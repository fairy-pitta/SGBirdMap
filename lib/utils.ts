import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convert date to YYYY-MM-DD format
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

// Convert time value (0-100) to time string (HH:MM)
export function timeValueToString(value: number): string {
  const totalMinutes = Math.floor((value / 100) * 24 * 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
}

// Convert time string (HH:MM) to time value (0-100)
export function timeStringToValue(timeString: string): number {
  const [hours, minutes] = timeString.split(":").map(Number)
  const totalMinutes = hours * 60 + minutes
  const value = (totalMinutes / (24 * 60)) * 100

  return Math.min(100, Math.max(0, value))
}
