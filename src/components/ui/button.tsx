// ABOUTME: Provides a styled button component consistent with the app design system.
// ABOUTME: Supports primary, secondary, outline, ghost, and destructive variants.
import { Slot } from '@radix-ui/react-slot'
import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
}

const focusClasses =
  'focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--color-background))]'

const variantClasses: Record<ButtonVariant, string> = {
  primary: `bg-[var(--primary)] text-[var(--on-primary)] hover:bg-[var(--primary-hover)] ${focusClasses}`,
  secondary: `border border-[var(--divider)] bg-[var(--surface2)] text-[var(--text)] hover:bg-[var(--surface)] ${focusClasses}`,
  outline: `border border-[var(--divider)] bg-transparent text-[var(--text)] hover:bg-[var(--surface2)] ${focusClasses}`,
  ghost: `text-[var(--text)] hover:bg-[var(--surface2)] ${focusClasses}`,
  destructive: `bg-[hsl(var(--color-destructive))] text-[hsl(var(--color-destructive-foreground))] hover:bg-[hsl(var(--color-destructive))] hover:brightness-95 ${focusClasses}`,
}

const sizeClasses = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'
