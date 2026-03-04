# TVM 模型编译示例
import tvm
from tvm import relay
from tvm.driver import tvmc

# 方法1: 使用 TVMC 命令行工具编译 ONNX 模型
# tvmc compile model.onnx --target "llvm" --output model.tar

# 方法2: 使用 Python API
import onnx

# 加载 ONNX 模型
onnx_model = onnx.load("model.onnx")

# 转换为 Relay IR
mod, params = relay.frontend.from_onnx(onnx_model, shape_dict={"input": (1, 3, 224, 224)})

# 设置目标架构
target = tvm.target.Target("cuda -arch=sm_75")  # NVIDIA GPU
# target = tvm.target.Target("llvm -mcpu=armv8-a")  # ARM CPU

# 编译模型
with tvm.transform.PassContext(opt_level=3):
    lib = relay.build(mod, target=target, params=params)

# 导出编译结果
lib.export_library("compiled_model.so")

print("编译完成！")

# 使用自动调优优化性能 (AutoTVM)
from tvm import autotvm

# 创建调优任务
task = autotvm.task.create("conv2d_nchw.cuda", args=(1, 64, 56, 56, 64, 3, 3, 1, 1), target=target)

# 运行调优
measure_option = autotvm.measure_option(
    builder=autotvm.LocalBuilder(),
    runner=autotvm.LocalRunner(number=10, repeat=3, timeout=4, min_repeat_ms=150)
)

tuner = autotvm.tuner.XGBTuner(task)
tuner.tune(n_trial=20, measure_option=measure_option, callbacks=[autotvm.callback.log_to_file("conv2d.log")])
