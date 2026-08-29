import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toFiniteNumber(value: number | string | null | undefined) {
  if (value == null || value === "") return null;
  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

export function formatDecimal(
  value: number | string | null | undefined,
  fractionDigits = 1,
) {
  const numericValue = toFiniteNumber(value);
  return numericValue == null ? null : numericValue.toFixed(fractionDigits);
}

export function formatCurrency(amount: number | string | null | undefined) {
  const numericAmount = toFiniteNumber(amount);
  if (numericAmount == null) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numericAmount);
}

export function formatDate(date: string | null | undefined) {
  if (!date) return "--";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | null | undefined) {
  if (!date) return "--";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(date));
}
