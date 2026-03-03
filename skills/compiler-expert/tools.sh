#!/bin/bash
# 编译器专家常用工具脚本

# 查看 LLVM IR
view_ir() {
    clang -S -emit-llvm "$1" -o - | less
}

# 查看优化后的汇编
view_asm() {
    clang -O2 -S "$1" -o - | less
}

# 运行 LLVM opt 并查看结果
run_opt() {
    local file="$1"
    local passes="$2"
    opt -passes="$passes" "$file" -S -o -
}

# 查看所有 LLVM Passes
list_passes() {
    opt -passes=help 2>&1 | less
}

# 比较优化前后
diff_opt() {
    local file="$1"
    echo "=== 未优化 ==="
    clang -O0 -S "$file" -o -
    echo ""
    echo "=== O2 优化 ==="
    clang -O2 -S "$file" -o -
}

# 分析 ELF 文件
analyze_elf() {
    readelf -a "$1" | less
}

# 查看符号表
view_symbols() {
    nm -C "$1" | less
}

# 反汇编
disasm() {
    objdump -d "$1" | less
}
