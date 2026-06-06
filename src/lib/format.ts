export const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const money = (value?: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

export const decimalMoney = (value?: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0);

export const shortDate = (value?: string) => {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

export const formatRange = (min?: number, max?: number) => {
  if (typeof min !== "number" || typeof max !== "number") {
    return "No estimate";
  }

  if (Math.round(min) === Math.round(max)) {
    return money(min);
  }

  return `${money(min)} - ${money(max)}`;
};
