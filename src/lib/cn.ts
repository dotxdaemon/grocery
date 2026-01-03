// ABOUTME: Exposes a class name helper combining clsx and tailwind-merge.
// ABOUTME: Keeps utility class composition consistent across components.
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}
