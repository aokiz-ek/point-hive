import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'ak-inline-flex ak-items-center ak-justify-center ak-whitespace-nowrap ak-rounded-md ak-text-sm ak-font-medium ak-ring-offset-background ak-transition-colors ak-focus-visible:outline-none ak-focus-visible:ring-2 ak-focus-visible:ring-ring ak-focus-visible:ring-offset-2 ak-disabled:pointer-events-none ak-disabled:opacity-50 ak-button-press',
  {
    variants: {
      variant: {
        default: 'ak-bg-primary ak-text-primary-foreground hover:ak-bg-primary/90',
        destructive: 'ak-bg-destructive ak-text-destructive-foreground hover:ak-bg-destructive/90',
        outline: 'ak-border ak-border-input ak-bg-background hover:ak-bg-accent hover:ak-text-accent-foreground',
        secondary: 'ak-bg-secondary ak-text-secondary-foreground hover:ak-bg-secondary/80',
        ghost: 'hover:ak-bg-accent hover:ak-text-accent-foreground',
        link: 'ak-text-primary ak-underline-offset-4 hover:ak-underline',
        // Point-Hive 专用变体
        primary: 'ak-gradient-primary ak-text-white hover:ak-shadow-lg ak-transform hover:ak--translate-y-0.5',
        success: 'ak-gradient-success ak-text-white hover:ak-shadow-lg ak-transform hover:ak--translate-y-0.5',
        warning: 'ak-gradient-warning ak-text-white hover:ak-shadow-lg ak-transform hover:ak--translate-y-0.5',
        error: 'ak-gradient-error ak-text-white hover:ak-shadow-lg ak-transform hover:ak--translate-y-0.5',
      },
      size: {
        default: 'ak-h-10 ak-px-4 ak-py-2',
        xs: 'ak-h-7 ak-px-2 ak-text-xs',
        sm: 'ak-h-9 ak-px-3',
        lg: 'ak-h-11 ak-px-8',
        xl: 'ak-h-12 ak-px-10 ak-text-base',
        icon: 'ak-h-10 ak-w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    asChild = false,
    loading = false,
    icon,
    iconPosition = 'left',
    children,
    disabled,
    ...props
  }, ref) => {
    // 简化实现，移除 Slot 依赖
    if (asChild) {
      console.warn('asChild prop is not supported in this simplified implementation');
    }
    const Comp = 'button' as const;
    
    const isDisabled = disabled || loading;
    
    const iconElement = loading ? (
      <svg
        className="ak-animate-spin ak-h-4 ak-w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="ak-opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="ak-opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    ) : icon;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {iconElement && iconPosition === 'left' && (
          <span className={cn('ak-mr-2', children ? 'ak-mr-2' : 'ak-mr-0')}>
            {iconElement}
          </span>
        )}
        {children}
        {iconElement && iconPosition === 'right' && (
          <span className={cn('ak-ml-2', children ? 'ak-ml-2' : 'ak-ml-0')}>
            {iconElement}
          </span>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };