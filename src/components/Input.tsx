import { InputHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib";

const inputVariants = cva(
  "w-full px-4 py-3 text-base text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-0 transition-shadow [border-top-left-radius:0.4rem] [border-bottom-left-radius:0.4rem]",
  {
    variants: {
      isEnabled: {
        true: "border-primary/40 focus:shadow-[inset_0_1px_8px_rgba(0,145,255,0.25)]",
        false: "cursor-not-allowed",
      },
      isError: {
        true: "!shadow-[inset_0_1px_8px_rgba(255,0,0,0.25)]",
        false: "",
      },
    },
    defaultVariants: {
      isEnabled: true,
      isError: false,
    },
  },
);

type InputBaseProps = VariantProps<typeof inputVariants>;

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, keyof InputBaseProps>,
    InputBaseProps {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, isEnabled, isError, ...props }, ref) => {
    return (
      <input
        className={cn(inputVariants({ isEnabled, isError }), className)}
        ref={ref}
        disabled={!isEnabled}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
