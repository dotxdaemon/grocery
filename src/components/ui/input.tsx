// ABOUTME: Exposes a styled text input consistent with the design system.
// ABOUTME: Handles focus rings and disabled states for accessibility.
import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'bg-[var(--surface)]/80 flex h-10 w-full rounded-md border border-[var(--divider)] px-3 py-2 text-base backdrop-blur transition-colors',
        'placeholder:text-[var(--muted)] hover:border-foreground/30',
        'focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--prism-1)/0.7)] focus-visible:ring-offset-1 focus-visible:ring-offset-[hsl(var(--color-background))]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
})

Input.displayName = 'Input'
