// MLIR AI Dialect 示例 - Linalg 用于深度学习
// 展示如何使用 MLIR 的 Linalg Dialect 表示神经网络算子

// 卷积层表示
func.func @conv2d(%input: tensor<1x3x224x224xf32>, 
                  %filter: tensor<64x3x3x3xf32>,
                  %bias: tensor<64xf32>) -> tensor<1x64x222x222xf32> {
  // 执行卷积
  %0 = linalg.conv_2d_nchw_fchw 
    {dilations = dense<1> : tensor<2xi64>,
     strides = dense<1> : tensor<2xi64>}
    ins(%input, %filter : tensor<1x3x224x224xf32>, tensor<64x3x3x3xf32>)
    outs(%init : tensor<1x64x222x222xf32>) -> tensor<1x64x222x222xf32>
  
  // 添加 bias
  %1 = linalg.broadcast 
    ins(%bias : tensor<64xf32>)
    outs(%0 : tensor<1x64x222x222xf32>) -> tensor<1x64x222x222xf32>
  
  // ReLU 激活
  %c0 = arith.constant 0.0 : f32
  %2 = linalg.generic {
    indexing_maps = [affine_map<(d0, d1, d2, d3) -> (d0, d1, d2, d3)>,
                     affine_map<(d0, d1, d2, d3) -> ()>,
                     affine_map<(d0, d1, d2, d3) -> (d0, d1, d2, d3)>],
    iterator_types = ["parallel", "parallel", "parallel", "parallel"]
  } ins(%1, %c0 : tensor<1x64x222x222xf32>, f32)
    outs(%out : tensor<1x64x222x222xf32>) {
    ^bb0(%in: f32, %const: f32, %out: f32):
      %max = arith.maxf %in, %const : f32
      linalg.yield %max : f32
  } -> tensor<1x64x222x222xf32>
  
  return %2 : tensor<1x64x222x222xf32>
}

// 矩阵乘法 (全连接层)
func.func @fully_connected(%input: tensor<1x512xf32>,
                           %weight: tensor<256x512xf32>,
                           %bias: tensor<256xf32>) -> tensor<1x256xf32> {
  %0 = linalg.matmul
    ins(%input, %weight : tensor<1x512xf32>, tensor<256x512xf32>)
    outs(%init : tensor<1x256xf32>) -> tensor<1x256xf32>
  
  %1 = linalg.broadcast
    ins(%bias : tensor<256xf32>)
    outs(%0 : tensor<1x256xf32>) -> tensor<1x256xf32>
  
  return %1 : tensor<1x256xf32>
}

// 批量归一化
func.func @batch_norm(%input: tensor<1x64x56x56xf32>,
                      %gamma: tensor<64xf32>,
                      %beta: tensor<64xf32>,
                      %mean: tensor<64xf32>,
                      %variance: tensor<64xf32>) -> tensor<1x64x56x56xf32> {
  // x_norm = (x - mean) / sqrt(variance + epsilon)
  // y = gamma * x_norm + beta
  %epsilon = arith.constant 1.0e-5 : f32
  %0 = linalg.generic {
    indexing_maps = [affine_map<(n, c, h, w) -> (n, c, h, w)>,
                     affine_map<(n, c, h, w) -> (c)>,
                     affine_map<(n, c, h, w) -> (c)>,
                     affine_map<(n, c, h, w) -> (c)>,
                     affine_map<(n, c, h, w) -> (c)>,
                     affine_map<(n, c, h, w) -> ()>,
                     affine_map<(n, c, h, w) -> (n, c, h, w)>],
    iterator_types = ["parallel", "parallel", "parallel", "parallel"]
  } ins(%input, %mean, %variance, %gamma, %beta, %epsilon 
        : tensor<1x64x56x56xf32>, tensor<64xf32>, tensor<64xf32>,
          tensor<64xf32>, tensor<64xf32>, f32)
    outs(%out : tensor<1x64x56x56xf32>) {
    ^bb0(%x: f32, %m: f32, %v: f32, %g: f32, %b: f32, %eps: f32, %out: f32):
      %sub = arith.subf %x, %m : f32
      %add_eps = arith.addf %v, %eps : f32
      %sqrt = math.sqrt %add_eps : f32
      %div = arith.divf %sub, %sqrt : f32
      %mul = arith.mulf %div, %g : f32
      %result = arith.addf %mul, %b : f32
      linalg.yield %result : f32
  } -> tensor<1x64x56x56xf32>
  
  return %0 : tensor<1x64x56x56xf32>
}
