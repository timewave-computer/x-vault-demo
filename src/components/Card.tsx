import { HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib";

const cardVariants = cva(
  "rounded-lg p-4 shadow-sm transition-all duration-200 x-overflow-scroll",
  {
    variants: {
      variant: {
        primary: "bg-primary-light border-2 border-primary/40 ",
        secondary: "border-accent-purple/40 bg-accent-purple-light border-2",
      },
      isHoverable: {
        true: " hover:shadow-lg hover:shadow-primary  active:scale-95 active:shadow-inner",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      isHoverable: false,
    },
  },
);

type CardBaseProps = VariantProps<typeof cardVariants>;

export interface CardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, keyof CardBaseProps>,
    CardBaseProps {
  children: ReactNode;
}

export function Card({
  children,
  variant,
  isHoverable,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(cardVariants({ variant, isHoverable }), className)}
      {...props}
    >
      {children}
    </div>
  );
}
