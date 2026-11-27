import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

type HTMLProps = React.HTMLAttributes<HTMLElement>;

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends HTMLProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/80',
      destructive:
        'bg-destructive text-destructive-foreground hover:bg-destructive/20',
      outline:
        'border border-border bg-background hover:bg-accent hover:text-accent-foreground',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-muted hover:text-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    };

    const sizes = {
      default: 'h-8 px-2.5',
      sm: 'h-7 rounded-md px-2.5 text-[0.8rem]',
      lg: 'h-9 rounded-md px-2.5',
      icon: 'size-8',
    };

    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\']):size-4',
          variants[variant ?? 'default'],
          sizes[size ?? 'default'],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
