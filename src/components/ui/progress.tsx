"use client";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as React from "react";

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  indeterminate?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ value, indeterminate, className, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-300 dark:bg-gray-700 ${className ?? ""}`}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={`h-full w-full bg-blue-600 transition-transform ${indeterminate ? "animate-progress" : ""}`}
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = "Progress";

export { Progress };
