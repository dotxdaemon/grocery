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
        'flex h-10 w-full rounded-md border border-[var(--divider)] bg-[var(--surface)] px-3 py-2 text-base',
        'placeholder:text-[var(--muted)] ring-offset-[hsl(var(--color-background))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-ring) / 0.35)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
})

Input.displayName = 'Input'
