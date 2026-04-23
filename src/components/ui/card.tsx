// ABOUTME: Provides a lightweight card container for grouping content.
// ABOUTME: Applies padding, border, and rounding consistent with the design system.
import { cn } from '../../lib/cn'

type CardProps = React.HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'relative rounded-lg border border-border bg-card/80 p-4 shadow-sm backdrop-blur transition-all',
        'hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[0_12px_40px_-12px_hsl(var(--prism-1)/0.35)]',
        className,
      )}
      {...props}
    />
  )
}
