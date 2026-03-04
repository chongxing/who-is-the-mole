#!/bin/bash
# Clash 节点自动测试与切换脚本
# 测试多个代理节点，自动选择延迟最低的节点

CLASH_API="http://127.0.0.1:9090"
CLASH_SECRET=""  # 如果有API密钥，填在这里

# 测试的目标网站
TEST_URLS=(
    "https://www.google.com"
    "https://github.com"
    "https://huggingface.co"
)

# 获取所有节点
get_proxies() {
    curl -s "${CLASH_API}/proxies" | python3 -c "
import sys, json
data = json.load(sys.stdin)
proxies = data.get('proxies', {})
for name, info in proxies.items():
    if info.get('type') in ['SS', 'SSR', 'Vmess', 'Trojan', 'Vless']:
        print(name)
"
}

# 测试单个节点延迟
test_proxy_delay() {
    local proxy_name=$1
    local test_url=$2
    
    # 通过 Clash API 测试延迟
    response=$(curl -s -o /dev/null -w "%{http_code},%{time_total}" \
        -x "http://127.0.0.1:7890" \
        --connect-timeout 5 \
        --max-time 10 \
        "$test_url")
    
    http_code=$(echo $response | cut -d',' -f1)
    time_total=$(echo $response | cut -d',' -f2)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "301" ] || [ "$http_code" = "302" ]; then
        echo "$time_total"
    else
        echo "999"
    fi
}

# 批量测试所有节点
test_all_proxies() {
    echo "🔄 正在获取节点列表..."
    proxies=$(get_proxies)
    
    if [ -z "$proxies" ]; then
        echo "❌ 无法获取节点列表，请检查 Clash 是否运行"
        exit 1
    fi
    
    echo "🌐 开始测试节点延迟..."
    echo "节点名称 | Google | GitHub | HuggingFace | 平均延迟"
    echo "---------|--------|--------|-------------|----------"
    
    declare -A proxy_scores
    
    while IFS= read -r proxy; do
        [ -z "$proxy" ] && continue
        
        total_delay=0
        success_count=0
        
        # 切换到该节点
        curl -s -X PUT "${CLASH_API}/proxies/GLOBAL" \
            -H "Content-Type: application/json" \
            -d "{\"name\":\"$proxy\"}" > /dev/null
        
        sleep 1  # 等待切换生效
        
        for url in "${TEST_URLS[@]}"; do
            delay=$(test_proxy_delay "$proxy" "$url")
            if [ "$delay" != "999" ]; then
                total_delay=$(echo "$total_delay + $delay" | bc)
                ((success_count++))
            fi
        done
        
        if [ $success_count -gt 0 ]; then
            avg_delay=$(echo "scale=2; $total_delay / $success_count" | bc)
            proxy_scores["$proxy"]=$avg_delay
            printf "%-8s | %-6s | %-6s | %-11s | %.2fs\n" \
                "$proxy" \
                "$(test_proxy_delay \"$proxy\" \"${TEST_URLS[0]}\")s" \
                "$(test_proxy_delay \"$proxy\" \"${TEST_URLS[1]}\")s" \
                "$(test_proxy_delay \"$proxy\" \"${TEST_URLS[2]}\")s" \
                "$avg_delay"
        else
            printf "%-8s | ❌ | ❌ | ❌ | 超时\n" "$proxy"
            proxy_scores["$proxy"]=999
        fi
        
    done <<< "$proxies"
    
    # 找出最佳节点
    best_proxy=""
    best_delay=999
    
    for proxy in "${!proxy_scores[@]}"; do
        delay=${proxy_scores[$proxy]}
        if (( $(echo "$delay < $best_delay" | bc -l) )); then
            best_delay=$delay
            best_proxy=$proxy
        fi
    done
    
    if [ -n "$best_proxy" ] && [ "$best_delay" != "999" ]; then
        echo ""
        echo "✅ 最佳节点: $best_proxy (平均延迟: ${best_delay}s)"
        
        # 切换到最佳节点
        curl -s -X PUT "${CLASH_API}/proxies/GLOBAL" \
            -H "Content-Type: application/json" \
            -d "{\"name\":\"$best_proxy\"}" > /dev/null
        
        echo "🎯 已自动切换到最佳节点"
    else
        echo "❌ 所有节点均不可用"
    fi
}

# 主函数
main() {
    echo "🚀 Clash 节点自动测试工具"
    echo "=========================="
    
    # 检查依赖
    if ! command -v curl &> /dev/null; then
        echo "❌ 请先安装 curl"
        exit 1
    fi
    
    if ! command -v bc &> /dev/null; then
        echo "❌ 请先安装 bc"
        exit 1
    fi
    
    # 测试 Clash API 是否可访问
    if ! curl -s "${CLASH_API}/version" > /dev/null 2>&1; then
        echo "❌ 无法连接到 Clash API (${CLASH_API})"
        echo "请检查:"
        echo "  1. Clash 是否正在运行"
        echo "  2. API 端口是否正确 (默认 9090)"
        echo "  3. 在 Clash 设置中开启 External Controller"
        exit 1
    fi
    
    test_all_proxies
}

# 运行
main
