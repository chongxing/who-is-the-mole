; LLVM IR 示例 - 简单函数
; 编译: llc example.ll

define i32 @add(i32 %a, i32 %b) {
entry:
    %sum = add i32 %a, %b
    ret i32 %sum
}

; 带条件的函数
define i32 @max(i32 %x, i32 %y) {
entry:
    %cmp = icmp sgt i32 %x, %y
    br i1 %cmp, label %if.then, label %if.else

if.then:
    ret i32 %x

if.else:
    ret i32 %y
}

; 循环示例
define i32 @sum_array(i32* %arr, i32 %n) {
entry:
    br label %loop.cond

loop.cond:
    %i = phi i32 [ 0, %entry ], [ %i.next, %loop.body ]
    %sum = phi i32 [ 0, %entry ], [ %sum.next, %loop.body ]
    %cmp = icmp slt i32 %i, %n
    br i1 %cmp, label %loop.body, label %loop.end

loop.body:
    %ptr = getelementptr i32, i32* %arr, i32 %i
    %val = load i32, i32* %ptr
    %sum.next = add i32 %sum, %val
    %i.next = add i32 %i, 1
    br label %loop.cond

loop.end:
    ret i32 %sum
}
