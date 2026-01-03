// ABOUTME: Wraps Radix dropdown menu primitives with styled items.
// ABOUTME: Provides contextual action menus for items and lists.
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu'
import { cn } from '../../lib/cn'

export const DropdownMenu = DropdownPrimitive.Root
export const DropdownMenuTrigger = DropdownPrimitive.Trigger
export const DropdownMenuContent = (
  props: React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>,
) => {
  const { className, sideOffset = 8, ...rest } = props
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'bg-popover z-50 min-w-[180px] overflow-hidden rounded-md border p-1 text-foreground shadow-md',
          className,
        )}
        {...rest}
      />
    </DropdownPrimitive.Portal>
  )
}

export const DropdownMenuItem = (
  props: React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item>,
) => {
  const { className, ...rest } = props
  return (
    <DropdownPrimitive.Item
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
        'focus:bg-secondary focus:text-secondary-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...rest}
    />
  )
}

export const DropdownMenuSeparator = () => (
  <DropdownPrimitive.Separator className="my-1 h-px bg-border" />
)
