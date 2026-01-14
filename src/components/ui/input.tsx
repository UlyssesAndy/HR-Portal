import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 px-4 py-2 text-sm text-slate-900 dark:text-white transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-400/20 disabled:cursor-not-allowed disabled:opacity-50 hover:border-slate-300 dark:hover:border-slate-700",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
