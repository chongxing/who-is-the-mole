# Compiler Expert Skill

编译器专家技能包 - 传统编译器 + AI 编译器双栈

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
   - **"把 PyTorch 模型编译到 GPU"**
   - **"TVM 自动调优怎么配置"**
   - **"XLA 算子融合原理是什么"**

## 包含内容

- **SKILL.md** - 技能定义和能力描述
- **tools.sh** - 常用编译器工具脚本
- **examples/** - 代码示例
  - `llvm_ir_example.ll` - LLVM IR 示例
  - `llvm_pass_example.cpp` - LLVM Pass 插件示例
  - **`tvm_compile_example.py`** - TVM 模型编译示例
  - **`mlir_linalg_ai.mlir`** - MLIR Linalg AI 算子示例

## 适用场景

### 传统编译器
- LLVM/MLIR 开发
- 编译器优化
- 性能分析
- 代码生成
- 跨平台移植

### AI 编译器
- 深度学习模型编译
- 算子融合优化
- 量化部署
- 硬件适配 (GPU/TPU/NPU)
- AutoTuning 自动调优

## 技术栈覆盖

### 传统编译器
- ✅ LLVM (IR, Pass, TableGen)
- ✅ MLIR (Dialect, Transformation)
- ✅ GCC (插件, GIMPLE)
- ✅ 汇编 (x86, ARM, RISC-V)
- ✅ 链接器 (LLD, ld)
- ✅ 调试器 (lldb, gdb)

### AI 编译器
- ✅ **XLA** - Google 深度学习编译器
- ✅ **TVM** - Apache 端到端编译器
- ✅ **Torch-MLIR** - PyTorch 到 MLIR
- ✅ **IREE** - 边缘设备推理引擎
- ✅ **ONNX** - 模型转换工具链

### DSL 设计与实现
- ✅ **外部 DSL** - Halide, TACO, Futhark
- ✅ **内部 DSL** - Python/C++ Embedding
- ✅ **Parser 生成** - ANTLR4, Flex/Bison
- ✅ **MLIR Dialect** - 自定义 DSL 编译

### GPGPU 后端
- ✅ **CUDA** - NVIDIA GPU (PTX/SASS)
- ✅ **HIP/ROCm** - AMD GPU
- ✅ **SYCL** - 跨平台 C++17
- ✅ **OpenCL** - 开放标准
- ✅ **Vulkan Compute** - SPIR-V
- ✅ **MLIR GPU Dialect** - 统一 GPU 代码生成

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

# TVM 编译模型
python examples/tvm_compile_example.py

# 查看 MLIR AI 示例
cat examples/mlir_linalg_ai.mlir
```

## 典型任务

### 传统编译
| 任务 | 方法 |
|------|------|
| 解释 LLVM IR | `opt` + `llvm-dis` |
| 编写优化 Pass | LLVM Pass 插件 |
| 跨平台移植 | LLVM Backend |

### AI 编译
| 任务 | 方法 |
|------|------|
| PyTorch → GPU | Torch-MLIR → LLVM → PTX |
| ONNX → 手机 | TVM + AutoTVM 自动调优 |
| TensorFlow → TPU | XLA JIT 编译 |
| 模型量化 | TVM/TensorRT INT8 量化 |
| 算子融合 | MLIR Linalg Fusion |

### DSL 开发
| 任务 | 方法 |
|------|------|
| 设计图像处理 DSL | ANTLR4 + MLIR Dialect |
| 嵌入 Python DSL | Python Metaclass |
| 生成 MLIR | DSL → Custom Dialect → LLVM |

### GPGPU 编程
| 任务 | 方法 |
|------|------|
| CUDA 核函数优化 | Shared Memory + Coalescing |
| 跨平台 GPU | SYCL / OpenCL |
| MLIR → GPU | GPU Dialect → PTX/SPIR-V |
| AMD GPU 迁移 | HIPify + ROCm |
