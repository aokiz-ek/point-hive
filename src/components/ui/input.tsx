import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Search, X } from 'lucide-react';

const inputVariants = cva(
  'ak-flex ak-h-10 ak-w-full ak-rounded-md ak-border ak-border-input ak-bg-background ak-px-3 ak-py-2 ak-text-sm ak-ring-offset-background file:ak-border-0 file:ak-bg-transparent file:ak-text-sm file:ak-font-medium placeholder:ak-text-muted-foreground ak-focus-visible:outline-none ak-focus-visible:ring-2 ak-focus-visible:ring-ring ak-focus-visible:ring-offset-2 ak-disabled:cursor-not-allowed ak-disabled:opacity-50 ak-transition-colors',
  {
    variants: {
      variant: {
        default: '',
        error: 'ak-border-destructive ak-focus-visible:ring-destructive',
        success: 'ak-border-green-500 ak-focus-visible:ring-green-500',
      },
      size: {
        default: 'ak-h-10',
        sm: 'ak-h-8 ak-px-2 ak-text-sm',
        lg: 'ak-h-12 ak-px-4 ak-text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  error?: string;
  helperText?: string;
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type,
    variant,
    size,
    error,
    helperText,
    label,
    leftIcon,
    rightIcon,
    onClear,
    value,
    disabled,
    ...props
  }, ref) => {
    const hasError = Boolean(error);
    const finalVariant = hasError ? 'error' : variant;
    
    const showClearButton = onClear && value && !disabled;

    return (
      <div className="ak-space-y-2">
        {label && (
          <label className="ak-text-sm ak-font-medium ak-leading-none ak-peer-disabled:cursor-not-allowed ak-peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <div className="ak-relative">
          {leftIcon && (
            <div className="ak-absolute ak-left-3 ak-top-1/2 ak--translate-y-1/2 ak-text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ variant: finalVariant, size, className }),
              leftIcon && 'ak-pl-10',
              (rightIcon || showClearButton) && 'ak-pr-10'
            )}
            ref={ref}
            value={value}
            disabled={disabled}
            {...props}
          />
          {showClearButton && (
            <button
              type="button"
              onClick={onClear}
              className="ak-absolute ak-right-3 ak-top-1/2 ak--translate-y-1/2 ak-text-muted-foreground hover:ak-text-foreground ak-transition-colors"
            >
              <X size={16} />
            </button>
          )}
          {rightIcon && !showClearButton && (
            <div className="ak-absolute ak-right-3 ak-top-1/2 ak--translate-y-1/2 ak-text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p className={cn(
            'ak-text-sm',
            hasError ? 'ak-text-destructive' : 'ak-text-muted-foreground'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// 密码输入框组件
interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightIcon'> {
  showToggle?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showToggle = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <Input
        {...props}
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightIcon={
          showToggle ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="ak-text-muted-foreground hover:ak-text-foreground ak-transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          ) : undefined
        }
      />
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

// 搜索输入框组件
interface SearchInputProps extends Omit<InputProps, 'type' | 'leftIcon'> {
  onSearch?: (value: string) => void;
  clearable?: boolean;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, clearable = true, placeholder = '搜索...', ...props }, ref) => {
    const [searchValue, setSearchValue] = React.useState(props.value || '');

    const handleSearch = (value: string) => {
      setSearchValue(value);
      onSearch?.(value);
    };

    const handleClear = () => {
      setSearchValue('');
      onSearch?.('');
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => handleSearch(e.target.value)}
        leftIcon={<Search size={16} />}
        onClear={clearable ? handleClear : undefined}
      />
    );
  }
);
SearchInput.displayName = 'SearchInput';

// 数字输入框组件
interface NumberInputProps extends Omit<InputProps, 'type'> {
  min?: number;
  max?: number;
  step?: number;
  format?: 'currency' | 'percentage' | 'decimal';
  prefix?: string;
  suffix?: string;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ 
    min, 
    max, 
    step, 
    format, 
    prefix, 
    suffix, 
    value, 
    onChange, 
    ...props 
  }, ref) => {
    const formatValue = (val: string | number) => {
      const numVal = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(numVal)) return '';
      
      switch (format) {
        case 'currency':
          return new Intl.NumberFormat('zh-CN').format(numVal);
        case 'percentage':
          return `${numVal}%`;
        default:
          return numVal.toString();
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/[^\d.-]/g, '');
      const numValue = parseFloat(rawValue);
      
      if (!isNaN(numValue)) {
        if (min !== undefined && numValue < min) return;
        if (max !== undefined && numValue > max) return;
      }
      
      onChange?.(e);
    };

    const displayValue = value && (typeof value === 'string' || typeof value === 'number') ? formatValue(value) : '';

    return (
      <div className="ak-relative">
        {prefix && (
          <span className="ak-absolute ak-left-3 ak-top-1/2 ak--translate-y-1/2 ak-text-muted-foreground ak-pointer-events-none">
            {prefix}
          </span>
        )}
        <Input
          {...props}
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleChange}
          className={cn(
            prefix && 'ak-pl-8',
            suffix && 'ak-pr-8',
            'ak-text-right ak-tabular-nums',
            props.className
          )}
        />
        {suffix && (
          <span className="ak-absolute ak-right-3 ak-top-1/2 ak--translate-y-1/2 ak-text-muted-foreground ak-pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    );
  }
);
NumberInput.displayName = 'NumberInput';

export { 
  Input, 
  PasswordInput, 
  SearchInput, 
  NumberInput,
  inputVariants 
};