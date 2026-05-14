import { describe, it, expect, afterEach, vi } from "vitest";
import {
  parseDropTag,
  isDropTag,
  formatDropTag,
  getDropStatus,
  dropTagToDate,
  formatDropLabel,
} from "./parse-tag";

describe("parseDropTag", () => {
  it("parses a valid simple tag", () => {
    const result = parseDropTag("5.15.26");
    expect(result).not.toBeNull();
    expect(result!.date).toEqual(new Date(2026, 4, 15));
    expect(result!.type).toBe("mixed");
    expect(result!.raw).toBe("5.15.26");
  });

  it("parses a typed tag — bags", () => {
    const result = parseDropTag("5.15.26-bags");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("bags");
    expect(result!.raw).toBe("5.15.26-bags");
  });

  it("parses a typed tag — watches", () => {
    const result = parseDropTag("5.8.26-watches");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("watches");
  });

  it("rejects zero-padded month", () => {
    expect(parseDropTag("05.01.26")).toBeNull();
  });

  it("rejects zero-padded day with valid month", () => {
    expect(parseDropTag("5.01.26")).toBeNull();
  });

  it("rejects a plain string", () => {
    expect(parseDropTag("hello")).toBeNull();
  });

  it("rejects a tag with extra trailing segments", () => {
    expect(parseDropTag("5.15.26.extra")).toBeNull();
  });

  it("returns mixed type for an unknown type suffix", () => {
    const result = parseDropTag("5.15.26-unknown");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("mixed");
  });
});

describe("isDropTag", () => {
  it("returns true for a simple valid tag", () => {
    expect(isDropTag("5.15.26")).toBe(true);
  });

  it("returns true for a typed tag", () => {
    expect(isDropTag("5.15.26-watches")).toBe(true);
  });

  it("returns false for zero-padded month and day", () => {
    expect(isDropTag("05.01.26")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(isDropTag("")).toBe(false);
  });

  it("returns false for an unrelated product tag", () => {
    expect(isDropTag("sale")).toBe(false);
  });
});

describe("dropTagToDate", () => {
  it("returns the date for a valid tag", () => {
    expect(dropTagToDate("5.15.26")).toEqual(new Date(2026, 4, 15));
  });

  it("returns null for an invalid tag", () => {
    expect(dropTagToDate("not-a-tag")).toBeNull();
  });
});

describe("formatDropLabel", () => {
  it("formats a simple tag as a human-readable label", () => {
    expect(formatDropLabel("5.15.26")).toBe("May 15th");
  });

  it("includes a type label for typed tags", () => {
    expect(formatDropLabel("5.1.26-bags")).toBe("May 1st — Bags");
  });

  it("uses 2nd suffix for the 2nd of the month", () => {
    expect(formatDropLabel("5.2.26")).toBe("May 2nd");
  });

  it("uses 3rd suffix for the 3rd of the month", () => {
    expect(formatDropLabel("5.3.26")).toBe("May 3rd");
  });

  it("returns the raw tag string for an invalid tag", () => {
    expect(formatDropLabel("invalid")).toBe("invalid");
  });
});

describe("formatDropTag", () => {
  it("formats a date without type", () => {
    expect(formatDropTag(new Date(2026, 4, 15))).toBe("5.15.26");
  });

  it("formats a date with a non-mixed type suffix", () => {
    expect(formatDropTag(new Date(2026, 4, 1), "bags")).toBe("5.1.26-bags");
  });

  it("omits the suffix for mixed type", () => {
    expect(formatDropTag(new Date(2026, 4, 8), "mixed")).toBe("5.8.26");
  });

  it("produces a non-zero-padded month and day", () => {
    const tag = formatDropTag(new Date(2026, 0, 5)); // Jan 5
    expect(tag).toBe("1.5.26");
  });
});

describe("getDropStatus", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns future when more than 14 days away", () => {
    vi.setSystemTime(new Date(2026, 4, 13)); // May 13
    // May 29 is 16 days away
    expect(getDropStatus(new Date(2026, 4, 29))).toBe("future");
  });

  it("returns draft when 3–14 days away", () => {
    vi.setSystemTime(new Date(2026, 4, 13)); // May 13
    // May 20 is 7 days away
    expect(getDropStatus(new Date(2026, 4, 20))).toBe("draft");
  });

  it("returns upcoming when within 2 days", () => {
    vi.setSystemTime(new Date(2026, 4, 13)); // May 13
    // May 15 is 2 days away (< 2*dayMs from now)
    expect(getDropStatus(new Date(2026, 4, 15))).toBe("upcoming");
  });

  it("returns live on the drop day", () => {
    vi.setSystemTime(new Date(2026, 4, 15, 12, 0, 0)); // May 15 noon
    expect(getDropStatus(new Date(2026, 4, 15))).toBe("live");
  });

  it("returns ended when the drop day has passed", () => {
    vi.setSystemTime(new Date(2026, 4, 17)); // May 17
    expect(getDropStatus(new Date(2026, 4, 15))).toBe("ended");
  });
});
