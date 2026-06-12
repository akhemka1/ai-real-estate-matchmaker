import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, listingType: "sale" | "rent" = "sale") {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
  return listingType === "rent" ? `${formatted}/mo` : formatted;
}

const currencyLocaleMap: Record<string, string> = {
  USD: "en-US",
  INR: "en-IN",
  CAD: "en-CA",
  GBP: "en-GB",
  AED: "en-AE",
};

export function formatMarketPrice(
  price: number,
  listingType: "sale" | "rent" = "sale",
  currency = "USD"
) {
  const locale = currencyLocaleMap[currency] ?? "en-US";
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);

  return listingType === "rent" ? `${formatted}/mo` : formatted;
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatPercent(n: number, decimals = 0) {
  return `${n.toFixed(decimals)}%`;
}

export function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}
