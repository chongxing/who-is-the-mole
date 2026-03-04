# Network Proxy Switcher - 网络代理自动切换

自动测试网络延迟并切换 Clash Verge 代理节点，选择最优网络路径。

## 核心能力

- 🔍 **节点发现**: 自动读取 Clash Verge 所有可用代理节点
- ⚡ **延迟测试**: 测试每个节点到目标网站的延迟
- 🎯 **智能选择**: 自动选择延迟最低的节点
- 🔄 **自动切换**: 通过 API 自动切换到最优节点
- ⏰ **定时任务**: 支持定时自动执行（10分钟/30分钟/自定义）

## 使用方式

### 1. 立即测试并切换（单次）

```bash
# 测试所有节点，自动切换到最优
/Users/xuchong/.openclaw/workspace/tools/clash-auto-switch/clash_auto_switch.sh once
```

**输出示例：**
```
🚀 开始测试所有节点...
测试 香港-IPLC-HK-4 ... 48ms
测试 日本-TY-2 ... 65ms
测试 新加坡-SG-1 ... 90ms
...
✅ 最佳节点: 香港-IPLC-HK-4 (48ms)
✅ 已切换至最佳节点
```

### 2. 查看当前节点列表

```bash
# 列出所有可用节点
/Users/xuchong/.openclaw/workspace/tools/clash-auto-switch/clash_auto_switch.sh list
```

### 3. 查看当前使用的节点

```bash
# 显示当前激活的节点
/Users/xuchong/.openclaw/workspace/tools/clash-auto-switch/clash_auto_switch.sh status
```

### 4. 启动自动定时切换

```bash
# 每10分钟自动测试并切换
launchctl load ~/Library/LaunchAgents/com.clash.autoswitch.plist

# 查看日志
tail -f /tmp/clash_autoswitch.log
```

## 技术实现

### Clash API 调用

```bash
# 获取所有节点
curl -s --unix-socket /tmp/verge/verge-mihomo.sock \
    http://localhost/proxies

# 切换到指定节点
curl -s --unix-socket /tmp/verge/verge-mihomo.sock \
    -X PUT http://localhost/proxies/GLOBAL \
    -H "Content-Type: application/json" \
    -d '{"name":"节点名称"}'

# 测试节点延迟
curl -s -o /dev/null -w "%{time_total}" \
    --max-time 5 \
    http://www.google.com
```

### 延迟测试算法

1. **切换节点**: 通过 API 切换到待测试节点
2. **等待生效**: 等待 1-2 秒让切换生效
3. **多次测试**: 对每个节点测试 3 次取平均
4. **记录结果**: 记录每个节点的平均延迟
5. **选择最优**: 找出延迟最低的节点
6. **最终切换**: 切换到最优节点并保持

## 配置文件

### 自动切换服务配置

文件: `~/Library/LaunchAgents/com.clash.autoswitch.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.clash.autoswitch</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/path/to/clash_auto_switch.sh</string>
        <string>once</string>
    </array>
    
    <key>StartInterval</key>
    <integer>600</integer>  <!-- 10分钟 -->
    
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

## 命令速查表

| 命令 | 功能 |
|------|------|
| `clash_auto_switch.sh once` | 立即测试并切换一次 |
| `clash_auto_switch.sh list` | 列出所有节点 |
| `clash_auto_switch.sh status` | 查看当前节点 |
| `launchctl load com.clash.autoswitch.plist` | 启动自动服务 |
| `launchctl unload com.clash.autoswitch.plist` | 停止自动服务 |
| `tail -f /tmp/clash_autoswitch.log` | 查看实时日志 |

## 典型任务

- 手动测试所有节点延迟
- 自动切换到最快节点
- 设置定时自动切换任务
- 查看节点切换历史日志
- 排查网络连接问题

## 依赖条件

- Clash Verge 必须正在运行
- External Controller 必须启用（Unix Socket: `/tmp/verge/verge-mihomo.sock`）
- 系统必须安装 `curl` 和 `python3`

## 故障排查

**问题：无法获取节点列表**
- 检查 Clash Verge 是否运行：`ps aux | grep clash`
- 检查 Socket 文件是否存在：`ls -la /tmp/verge/verge-mihomo.sock`

**问题：节点切换失败**
- 检查节点名称是否正确（区分大小写）
- 检查 API 是否可访问

**问题：延迟测试超时**
- 检查网络连接
- 增加测试超时时间（修改脚本中的 `--max-time` 参数）
