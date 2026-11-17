import { describe, expect, it } from "vitest";
import { databasePoolSize } from "@/lib/db/pool-size";

describe("DATABASE_POOL_SIZE", () => {
  it("uses the default when unset or blank, as .env.example ships it", () => {
    expect(databasePoolSize(undefined, false)).toBe(10);
    expect(databasePoolSize("", false)).toBe(10);
    expect(databasePoolSize("   ", false)).toBe(10);
    expect(databasePoolSize("", true)).toBe(3);
  });

  it("accepts a whole number of at least 1", () => {
    expect(databasePoolSize("1", false)).toBe(1);
    expect(databasePoolSize(" 25 ", true)).toBe(25);
  });

  it("refuses values that would leave the pool empty or undefined", () => {
    for (const bad of ["0", "-2", "2.5", "abc", "1e3", "NaN"]) {
      expect(() => databasePoolSize(bad, false)).toThrow(/DATABASE_POOL_SIZE/);
    }
  });
});
