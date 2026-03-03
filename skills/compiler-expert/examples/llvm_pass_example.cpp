// LLVM Function Pass 示例
// 统计函数中的基本块数量

#include "llvm/IR/Function.h"
#include "llvm/IR/PassManager.h"
#include "llvm/Passes/PassBuilder.h"
#include "llvm/Passes/PassPlugin.h"
#include "llvm/Support/raw_ostream.h"

using namespace llvm;

namespace {

struct BlockCounter : public PassInfoMixin<BlockCounter> {
    PreservedAnalyses run(Function &F, FunctionAnalysisManager &AM) {
        unsigned count = 0;
        for (auto &BB : F) {
            (void)BB;
            ++count;
        }
        
        errs() << "Function '" << F.getName() << "' has "
             << count << " basic blocks.\n";
        
        return PreservedAnalyses::all();
    }
};

} // namespace

// 插件注册
extern "C" LLVM_ATTRIBUTE_WEAK ::llvm::PassPluginLibraryInfo
llvmGetPassPluginInfo() {
    return {
        LLVM_PLUGIN_API_VERSION, "BlockCounter", LLVM_VERSION_STRING,
        [](PassBuilder &PB) {
            PB.registerPipelineParsingCallback(
                [](StringRef Name, FunctionPassManager &FPM,
                   ArrayRef<PassBuilder::PipelineElement>) {
                    if (Name == "block-counter") {
                        FPM.addPass(BlockCounter());
                        return true;
                    }
                    return false;
                });
        }};
}
