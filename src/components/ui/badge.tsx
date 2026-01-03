// ABOUTME: Renders a small label badge for categories and statuses.
// ABOUTME: Supports default and outline styles with compact spacing.
import { cn } from '../../lib/cn'

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'outline'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
        variant === 'default'
          ? 'border-transparent bg-secondary text-secondary-foreground'
          : 'border-border bg-background text-foreground',
        className,
      )}
      {...props}
    />
  )
}
