export type Currency = {
  code: string;
  name: string;
  symbol: string;
};

export const currencies: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "\u20AC" },
  { code: "GBP", name: "British Pound", symbol: "\u00A3" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "JPY", name: "Japanese Yen", symbol: "\u00A5" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "INR", name: "Indian Rupee", symbol: "\u20B9" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "RSD", name: "Serbian Dinar", symbol: "RSD" },
];

export function getCurrencySymbol(code: string): string {
  return currencies.find((c) => c.code === code)?.symbol ?? code;
}

export function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: currencyCode === "JPY" ? 0 : 2,
    maximumFractionDigits: currencyCode === "JPY" ? 0 : 2,
  }).format(amount);
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
