import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'ak-rounded-lg ak-border ak-bg-card ak-text-card-foreground ak-shadow-sm',
  {
    variants: {
      variant: {
        default: '',
        elevated: 'ak-shadow-md',
        outlined: 'ak-border-2',
        ghost: 'ak-border-transparent ak-shadow-none',
      },
      padding: {
        none: 'ak-p-0',
        sm: 'ak-p-3',
        default: 'ak-p-6',
        lg: 'ak-p-8',
      },
      hover: {
        none: '',
        lift: 'ak-card-hover',
        glow: 'hover:ak-shadow-xl hover:ak-shadow-ak-primary-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
      hover: 'none',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, hover, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, hover, className }))}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('ak-flex ak-flex-col ak-space-y-1.5 ak-p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'ak-text-2xl ak-font-semibold ak-leading-none ak-tracking-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('ak-text-sm ak-text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('ak-p-6 ak-pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('ak-flex ak-items-center ak-p-6 ak-pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

// Point-Hive 专用卡片组件
interface CreditCardProps extends CardProps {
  creditScore: number;
  level: string;
  stars: number;
}

const CreditCard = React.forwardRef<HTMLDivElement, CreditCardProps>(
  ({ creditScore, level, stars, className, ...props }, ref) => {
    const getCreditColor = (score: number) => {
      if (score >= 950) return 'ak-credit-diamond';
      if (score >= 850) return 'ak-credit-gold';
      if (score >= 750) return 'ak-credit-silver';
      if (score >= 650) return 'ak-credit-bronze';
      if (score >= 600) return 'ak-credit-newbie';
      return 'ak-credit-risk';
    };

    return (
      <Card
        ref={ref}
        className={cn('ak-relative ak-overflow-hidden', className)}
        hover="glow"
        {...props}
      >
        <CardHeader>
          <div className="ak-flex ak-items-center ak-justify-between">
            <CardDescription>信用等级</CardDescription>
            <div className="ak-flex ak-space-x-1">
              {Array.from({ length: 5 }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    'ak-text-lg',
                    i < stars ? 'ak-text-yellow-400' : 'ak-text-gray-300'
                  )}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <CardTitle className="ak-text-2xl">{level}</CardTitle>
          <div className="ak-text-xl ak-font-mono ak-tabular-nums">
            {creditScore} 分
          </div>
        </CardHeader>
        <div
          className={cn(
            'ak-absolute ak-bottom-0 ak-left-0 ak-h-1 ak-w-full',
            getCreditColor(creditScore)
          )}
        />
      </Card>
    );
  }
);
CreditCard.displayName = 'CreditCard';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CreditCard,
  cardVariants,
};