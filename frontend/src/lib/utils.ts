import { twMerge } from 'tailwind-merge'

function cn(...classes: (string | undefined | false)[]): string {
  return twMerge(classes.filter(Boolean).join(' '))
}

export { cn }
