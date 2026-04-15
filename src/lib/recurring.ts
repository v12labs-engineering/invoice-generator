import { addDays, addMonths, addYears } from "date-fns";

type Cadence = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

export function advanceNextRunAt(from: Date, cadence: Cadence, intervalCount: number): Date {
  switch (cadence) {
    case "WEEKLY":
      return addDays(from, 7 * intervalCount);
    case "MONTHLY":
      return addMonths(from, intervalCount);
    case "QUARTERLY":
      return addMonths(from, 3 * intervalCount);
    case "YEARLY":
      return addYears(from, intervalCount);
  }
}
