export type PredictionStatus = "under" | "warning" | "over";

export type CategoryPrediction = {
  projected: number;
  projectedOverspend: number;
  pacePerDay: number;
  status: PredictionStatus;
};

export function predictCategorySpending(input: {
  spent: number;
  allocated: number;
  dayOfMonth: number;
  daysInMonth: number;
}): CategoryPrediction {
  const { spent, allocated, dayOfMonth, daysInMonth } = input;

  if (dayOfMonth <= 0) {
    return {
      projected: spent,
      projectedOverspend: spent - allocated,
      pacePerDay: 0,
      status: spent > allocated ? "over" : "under",
    };
  }

  const pacePerDay = spent / dayOfMonth;
  const projected = pacePerDay * daysInMonth;
  const projectedOverspend = projected - allocated;

  let status: PredictionStatus;
  if (allocated === 0) {
    status = spent > 0 ? "over" : "under";
  } else if (projectedOverspend > allocated * 0.1) {
    status = "over";
  } else if (projectedOverspend > -allocated * 0.1) {
    status = "warning";
  } else {
    status = "under";
  }

  return { projected, projectedOverspend, pacePerDay, status };
}

export function getDaysInMonth(month: string): number {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m, 0).getDate();
}

export function getDayOfMonth(month: string): number {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (month !== currentMonth) {
    return getDaysInMonth(month);
  }
  return now.getDate();
}
