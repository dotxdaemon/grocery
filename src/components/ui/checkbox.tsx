// ABOUTME: Implements a styled checkbox using Radix primitives.
// ABOUTME: Used for toggles like purchased state and favorites.
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

type CheckboxProps = CheckboxPrimitive.CheckboxProps

export const Checkbox = forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'peer relative size-5 shrink-0 rounded-md border border-[var(--divider)] bg-[var(--surface)] transition-all',
        'hover:border-foreground/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--prism-1)/0.7)] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--color-background))]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:border-transparent data-[state=checked]:text-[var(--on-primary)]',
        'data-[state=checked]:[background-image:var(--prism-gradient)]',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <Check className="size-4" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  ),
)

Checkbox.displayName = 'Checkbox'
