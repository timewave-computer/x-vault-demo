import { ButtonHTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib";

const buttonVariants = cva(
  "rounded-lg font-beast focus:outline-none focus:ring transition-all",
  {
    variants: {
      variant: {
        primary:
          "bg-accent-purple text-white hover:scale-105 hover:shadow-xl hover:bg-accent-purple-hover active:bg-accent-purple-active",
        secondary:
          "font-sans bg-primary text-white hover:scale-105 hover:shadow-xl",
        outline:
          "border-2 border-primary/40 bg-white text-primary hover:bg-primary-light hover:text-primary-hover",
        ghost: "text-primary hover:bg-primary-light hover:text-primary-hover",
      },
      size: {
        sm: "px-2 py-1 text-sm",
        md: "px-8 py-3 text-base",
      },
      fullWidth: {
        true: "w-full",
      },
      isDisabled: {
        true: "!bg-gray-300 text-gray-500 cursor-not-allowed !hover:scale-100 hover:shadow-none",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
      isDisabled: false,
    },
  },
);

type ButtonBaseProps = VariantProps<typeof buttonVariants>;

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps>,
    ButtonBaseProps {
  children: ReactNode;
  isLoading?: boolean;
}

export function Button({
  children,
  variant,
  size,
  fullWidth,
  className,
  disabled,
  isLoading,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        buttonVariants({
          variant,
          size,
          fullWidth,
          isDisabled: disabled || isLoading,
        }),
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "Processing..." : children}
    </button>
  );
}
