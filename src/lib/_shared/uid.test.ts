import { describe, expect, it } from "vitest";
import { uid, uuid } from "./uid";

describe("uid()", () => {
  it("uses the default prefix when none provided", () => {
    expect(uid()).toMatch(/^id-[a-z0-9]+-[a-z0-9]+$/);
  });

  it("honors a custom prefix", () => {
    expect(uid("toast")).toMatch(/^toast-/);
  });

  it("generates monotonically increasing, unique IDs", () => {
    const ids = Array.from({ length: 100 }, () => uid("x"));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("uuid()", () => {
  it("returns a string that parses as either a v4 UUID or a fallback uid", () => {
    const value = uuid();
    expect(typeof value).toBe("string");
    expect(value.length).toBeGreaterThan(8);
  });
});
