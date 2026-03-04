#!/bin/bash
# Clash Verge 自动节点切换脚本
# 每10分钟自动测试所有节点，切换到延迟最低的节点

CLASH_API="http://localhost"
CLASH_SOCKET="/tmp/verge/verge-mihomo.sock"
TEST_URL="http://www.gstatic.com/generate_204"
INTERVAL=600  # 10分钟

LOG_FILE="/tmp/clash_auto_switch.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 获取所有代理节点（使用 Unix Socket）
get_all_proxies() {
    curl -s --unix-socket "${CLASH_SOCKET}" "${CLASH_API}/proxies" 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for name, info in data.get('proxies', {}).items():
        if info.get('type') not in ['Selector', 'URLTest', 'LoadBalance', 'Fallback', 'Direct', 'Reject', 'Pass', 'RejectDrop']:
            print(name)
except:
    pass
"
}

# 测试节点延迟
test_proxy_delay() {
    local proxy_name=$1
    
    # 切换到该节点（使用 Unix Socket）
    curl -s --unix-socket "${CLASH_SOCKET}" -X PUT "${CLASH_API}/proxies/GLOBAL" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"${proxy_name}\"}" 2>/dev/null
    
    sleep 1
    
    # 测试3次取平均
    local total_delay=0
    local success_count=0
    
    for i in 1 2 3; do
        local delay=$(curl -s -o /dev/null -w "%{time_total}" \
            --max-time 5 \
            "${TEST_URL}" 2>/dev/null)
        
        if [ -n "$delay" ] && [ "$delay" != "0.000" ]; then
            # 转换为毫秒
            local delay_ms=$(echo "$delay * 1000 / 1" | bc 2>/dev/null || echo "0")
            if [ "$delay_ms" -gt 0 ] 2>/dev/null; then
                total_delay=$((total_delay + delay_ms))
                ((success_count++))
            fi
        fi
    done
    
    if [ $success_count -gt 0 ]; then
        echo $((total_delay / success_count))
    else
        echo "9999"
    fi
}

# 切换到最佳节点
switch_to_best_proxy() {
    log "🚀 开始测试所有节点..."
    
    local proxies=$(get_all_proxies)
    
    if [ -z "$proxies" ]; then
        log "❌ 无法获取节点列表"
        return 1
    fi
    
    local best_proxy=""
    local best_delay=9999
    
    while IFS= read -r proxy; do
        [ -z "$proxy" ] && continue
        
        log -n "📍 测试 ${proxy} ... "
        local delay=$(test_proxy_delay "$proxy")
        
        if [ "$delay" = "9999" ]; then
            log "❌ 超时"
        else
            log "${delay}ms"
            
            if [ "$delay" -lt "$best_delay" ]; then
                best_delay=$delay
                best_proxy=$proxy
            fi
        fi
    done <<< "$proxies"
    
    if [ -n "$best_proxy" ] && [ "$best_delay" -lt 9999 ]; then
        log "✅ 最佳节点: ${best_proxy} (${best_delay}ms)"
        
        # 切换到最佳节点（使用 Unix Socket）
        curl -s --unix-socket "${CLASH_SOCKET}" -X PUT "${CLASH_API}/proxies/GLOBAL" \
            -H "Content-Type: application/json" \
            -d "{\"name\":\"${best_proxy}\"}" 2>/dev/null
        
        log "✅ 已切换至最佳节点: ${best_proxy}"
        return 0
    else
        log "❌ 未找到可用节点"
        return 1
    fi
}

# 获取当前节点信息
get_current_proxy() {
    curl -s "${CLASH_API}/proxies/GLOBAL" 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('now', 'unknown'))
except:
    print('unknown')
"
}

# 显示节点列表
list_proxies() {
    log "📋 当前可用节点:"
    local proxies=$(get_all_proxies)
    local current=$(get_current_proxy)
    
    while IFS= read -r proxy; do
        [ -z "$proxy" ] && continue
        if [ "$proxy" = "$current" ]; then
            log "  ⭐ ${proxy} (当前使用)"
        else
            log "     ${proxy}"
        fi
    done <<< "$proxies"
}

# 主循环
main_loop() {
    log "🎯 Clash 自动节点切换服务启动"
    log "⏰ 检查间隔: ${INTERVAL}秒 (10分钟)"
    
    while true; do
        log ""
        log "=== 新一轮测试 ==="
        switch_to_best_proxy
        list_proxies
        
        log "⏳ 等待 ${INTERVAL} 秒..."
        sleep $INTERVAL
    done
}

# 单次运行
run_once() {
    switch_to_best_proxy
}

# 命令处理
case "$1" in
    once)
        run_once
        ;;
    list)
        list_proxies
        ;;
    status)
        get_current_proxy
        ;;
    *)
        main_loop
        ;;
esac
