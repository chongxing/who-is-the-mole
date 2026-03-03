# Compiler Expert Skill

编译器专家技能包 - 用于 OpenClaw 多机器人配置

## 快速开始

1. 将这个 skill 目录复制到你的 workspace:
   ```bash
   cp -r skills/compiler-expert /path/to/your/workspace/skills/
   ```

2. 在 OpenClaw 配置中指定使用此 skill

3. 向编译器专家提问：
   - "解释这段 LLVM IR"
   - "帮我写一个优化 Pass"
   - "这个编译错误是什么意思"
   - "如何优化这个循环"

## 包含内容

- **SKILL.md** - 技能定义和能力描述
- **tools.sh** - 常用编译器工具脚本
- **examples/** - 代码示例
  - `llvm_ir_example.ll` - LLVM IR 示例
  - `llvm_pass_example.cpp` - LLVM Pass 插件示例

## 适用场景

- LLVM/MLIR 开发
- 编译器优化
- 性能分析
- 代码生成
- 跨平台移植

## 技术栈覆盖

- ✅ LLVM (IR, Pass, TableGen)
- ✅ MLIR (Dialect, Transformation)
- ✅ GCC (插件, GIMPLE)
- ✅ 汇编 (x86, ARM, RISC-V)
- ✅ 链接器 (LLD, ld)
- ✅ 调试器 (lldb, gdb)

## 使用方法

```bash
# 加载工具函数
source tools.sh

# 查看 C 代码的 LLVM IR
view_ir test.c

# 比较优化前后汇编
diff_opt test.c

# 分析 ELF 文件
analyze_elf a.out
```
