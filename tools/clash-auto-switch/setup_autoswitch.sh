#!/bin/bash
# Clash Verge 自动切换服务 - 每10分钟运行一次
# 保存为: ~/Library/LaunchAgents/com.clash.autoswitch.plist

cat << 'EOF' > ~/Library/LaunchAgents/com.clash.autoswitch.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.clash.autoswitch</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/Users/xuchong/.openclaw/workspace/tools/clash-auto-switch/clash_auto_switch.sh</string>
        <string>once</string>
    </array>
    
    <key>StartInterval</key>
    <integer>600</integer>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>StandardOutPath</key>
    <string>/tmp/clash_autoswitch.log</string>
    
    <key>StandardErrorPath</key>
    <string>/tmp/clash_autoswitch_error.log</string>
</dict>
</plist>
EOF

echo "✅ LaunchAgent 配置已创建"
echo ""
echo "📝 现在执行以下命令启动服务:"
echo "   launchctl load ~/Library/LaunchAgents/com.clash.autoswitch.plist"
echo ""
echo "📋 常用命令:"
echo "   启动: launchctl load ~/Library/LaunchAgents/com.clash.autoswitch.plist"
echo "   停止: launchctl unload ~/Library/LaunchAgents/com.clash.autoswitch.plist"
echo "   查看日志: tail -f /tmp/clash_autoswitch.log"
echo ""
echo "⏰ 服务将每10分钟自动运行一次，选择最优节点"