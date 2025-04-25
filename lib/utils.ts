import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | number) {
  return format(date, "MMMM d, yyyy")
}

export function formatTime(date: Date | number) {
  return format(date, "h:mm a")
}

export function formatDateTime(date: Date | number) {
  return format(date, "MMMM d, yyyy 'at' h:mm a")
}

export function formatRelativeTime(date: Date | number) {
  return formatDistanceToNow(date, { addSuffix: true })
}

export function getInitials(name: string) {
  if (!name) return "U"
  const nameParts = name.split(" ")
  if (nameParts.length > 1) {
    return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
  }
  return nameParts[0][0].toUpperCase()
}
