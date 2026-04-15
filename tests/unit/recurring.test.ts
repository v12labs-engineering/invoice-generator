import { describe, it, expect } from "vitest";
import { advanceNextRunAt } from "@/lib/recurring";

describe("advanceNextRunAt", () => {
  it("advances weekly by intervalCount weeks", () => {
    const next = advanceNextRunAt(new Date("2026-01-01"), "WEEKLY", 2);
    expect(next.toISOString().slice(0, 10)).toBe("2026-01-15");
  });

  it("advances monthly, clamping to end of shorter month", () => {
    const next = advanceNextRunAt(new Date("2026-01-31"), "MONTHLY", 1);
    expect(next.toISOString().slice(0, 10)).toBe("2026-02-28");
  });

  it("advances quarterly", () => {
    const next = advanceNextRunAt(new Date("2026-01-15"), "QUARTERLY", 1);
    expect(next.toISOString().slice(0, 10)).toBe("2026-04-15");
  });

  it("advances yearly", () => {
    const next = advanceNextRunAt(new Date("2026-02-28"), "YEARLY", 1);
    expect(next.toISOString().slice(0, 10)).toBe("2027-02-28");
  });
});
