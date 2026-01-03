// ABOUTME: Provides a styled label element for form fields.
// ABOUTME: Ensures consistent typography and spacing in forms.
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '../../lib/cn'

type LabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>

export function Label({ className, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}
      {...props}
    />
  )
}
