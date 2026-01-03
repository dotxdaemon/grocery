// ABOUTME: Provides a lightweight card container for grouping content.
// ABOUTME: Applies padding, border, and rounding consistent with the design system.
import { cn } from '../../lib/cn'

type CardProps = React.HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: CardProps) {
  return <div className={cn('rounded-lg border border-border bg-card p-4 shadow-sm', className)} {...props} />
}
