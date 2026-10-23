import { describe, expect, it } from "vitest";
import { createKit } from "./createKit";

interface DemoConfig {
  duration: number;
  position: "top" | "bottom";
  animation: { in: string; out: string };
}

const defaults: DemoConfig = {
  duration: 3000,
  position: "top",
  animation: { in: "fade", out: "fade" },
};

describe("createKit()", () => {
  it("exposes initial defaults via getConfig()", () => {
    const kit = createKit(defaults);
    expect(kit.getConfig()).toEqual(defaults);
  });

  it("merges top-level partial updates", () => {
    const kit = createKit(defaults);
    kit.setup({ duration: 5000 });
    expect(kit.getConfig().duration).toBe(5000);
    expect(kit.getConfig().position).toBe("top");
  });

  it("replaces nested objects by default", () => {
    const kit = createKit(defaults);
    kit.setup({ animation: { in: "slide" } as DemoConfig["animation"] });
    expect(kit.getConfig().animation).toEqual({ in: "slide" });
  });

  it("deep-merges keys listed in deepMergeKeys", () => {
    const kit = createKit(defaults, { deepMergeKeys: ["animation"] });
    kit.setup({ animation: { in: "slide" } as DemoConfig["animation"] });
    expect(kit.getConfig().animation).toEqual({ in: "slide", out: "fade" });
  });

  it("reset() restores the original defaults", () => {
    const kit = createKit(defaults);
    kit.setup({ duration: 9999 });
    kit.reset();
    expect(kit.getConfig()).toEqual(defaults);
  });
});
