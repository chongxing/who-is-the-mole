#!/bin/bash
# huggingface_download.sh - 带代理的模型下载脚本
# 使用方法: ./huggingface_download.sh <model_id> [output_dir]

MODEL_ID=${1:-"gpt2"}  # 默认下载 gpt2
OUTPUT_DIR=${2:-"./models/$MODEL_ID"}

# 检查 Clash 是否运行
if ! pgrep -x "clash-verge" > /dev/null 2>&1; then
    echo "⚠️  Clash Verge 未运行，请先启动"
    echo "   或者手动设置代理: export HTTPS_PROXY=http://127.0.0.1:7890"
fi

# 设置代理和镜像
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890
export HF_ENDPOINT=https://hf-mirror.com

echo "🚀 开始下载模型: $MODEL_ID"
echo "📁 保存位置: $OUTPUT_DIR"
echo "🌐 使用镜像: $HF_ENDPOINT"
echo "🔌 代理: $HTTPS_PROXY"
echo ""

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

# 下载模型
huggingface-cli download \
    --resume-download \
    --local-dir "$OUTPUT_DIR" \
    --local-dir-use-symlinks False \
    "$MODEL_ID"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 下载完成: $OUTPUT_DIR"
    echo "📊 文件大小: $(du -sh "$OUTPUT_DIR" | cut -f1)"
else
    echo ""
    echo "❌ 下载失败，尝试以下解决方案:"
    echo "   1. 检查网络连接和代理设置"
    echo "   2. 确认模型ID正确: https://huggingface.co/$MODEL_ID"
    echo "   3. 部分模型需要 HF_TOKEN，请设置环境变量"
    exit 1
fi
