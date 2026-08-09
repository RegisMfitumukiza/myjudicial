import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  isValidTimeBlock,
  areValidTimeBlocks,
  sortTimeBlocks,
  mergeAdjacentBlocks,
  convertLegacyToTimeBlocks,
  calculateTotalMinutes,
  formatTimeBlocks,
} from "../src/modules/experts/availability/time-blocks.types.js";

describe("isValidTimeBlock", () => {
  it("accepts a valid block", () => {
    assert.equal(isValidTimeBlock({ start: "09:00", end: "12:00" }), true);
  });

  it("rejects non-object", () => {
    assert.equal(isValidTimeBlock(null), false);
    assert.equal(isValidTimeBlock("09:00"), false);
  });

  it("rejects invalid time format", () => {
    assert.equal(isValidTimeBlock({ start: "9:00", end: "12:00" }), false);
    assert.equal(isValidTimeBlock({ start: "09:60", end: "12:00" }), false);
    assert.equal(isValidTimeBlock({ start: "25:00", end: "12:00" }), false);
  });

  it("rejects end before or equal to start", () => {
    assert.equal(isValidTimeBlock({ start: "12:00", end: "09:00" }), false);
    assert.equal(isValidTimeBlock({ start: "09:00", end: "09:00" }), false);
  });

  it("accepts midnight edge cases", () => {
    assert.equal(isValidTimeBlock({ start: "00:00", end: "23:59" }), true);
  });
});

describe("areValidTimeBlocks", () => {
  it("rejects empty array", () => {
    assert.equal(areValidTimeBlocks([]), false);
  });

  it("accepts non-overlapping blocks", () => {
    const blocks = [
      { start: "09:00", end: "12:00" },
      { start: "14:00", end: "17:00" },
    ];
    assert.equal(areValidTimeBlocks(blocks), true);
  });

  it("rejects overlapping blocks regardless of order", () => {
    const blocks = [
      { start: "14:00", end: "17:00" },
      { start: "09:00", end: "15:00" },
    ];
    assert.equal(areValidTimeBlocks(blocks), false);
  });

  it("rejects if any single block invalid", () => {
    const blocks = [
      { start: "09:00", end: "12:00" },
      { start: "not-a-time", end: "17:00" },
    ];
    assert.equal(areValidTimeBlocks(blocks), false);
  });

  it("accepts back-to-back blocks (no overlap)", () => {
    const blocks = [
      { start: "09:00", end: "12:00" },
      { start: "12:00", end: "15:00" },
    ];
    assert.equal(areValidTimeBlocks(blocks), true);
  });
});

describe("sortTimeBlocks", () => {
  it("sorts by start time without mutating input", () => {
    const input = [
      { start: "14:00", end: "17:00" },
      { start: "09:00", end: "12:00" },
    ];
    const sorted = sortTimeBlocks(input);
    assert.deepEqual(sorted, [
      { start: "09:00", end: "12:00" },
      { start: "14:00", end: "17:00" },
    ]);
    assert.deepEqual(input, [
      { start: "14:00", end: "17:00" },
      { start: "09:00", end: "12:00" },
    ]);
  });
});

describe("mergeAdjacentBlocks", () => {
  it("merges back-to-back blocks", () => {
    const merged = mergeAdjacentBlocks([
      { start: "09:00", end: "12:00" },
      { start: "12:00", end: "15:00" },
    ]);
    assert.deepEqual(merged, [{ start: "09:00", end: "15:00" }]);
  });

  it("does not merge separated blocks", () => {
    const merged = mergeAdjacentBlocks([
      { start: "09:00", end: "12:00" },
      { start: "13:00", end: "15:00" },
    ]);
    assert.equal(merged.length, 2);
  });

  it("returns single block unchanged", () => {
    const merged = mergeAdjacentBlocks([{ start: "09:00", end: "12:00" }]);
    assert.equal(merged.length, 1);
  });
});

describe("convertLegacyToTimeBlocks", () => {
  it("wraps into a single block", () => {
    assert.deepEqual(convertLegacyToTimeBlocks("09:00", "17:00"), [
      { start: "09:00", end: "17:00" },
    ]);
  });
});

describe("calculateTotalMinutes", () => {
  it("sums durations", () => {
    const blocks = [
      { start: "09:00", end: "12:00" },
      { start: "14:00", end: "16:30" },
    ];
    assert.equal(calculateTotalMinutes(blocks), 330);
  });

  it("returns zero for empty", () => {
    assert.equal(calculateTotalMinutes([]), 0);
  });
});

describe("formatTimeBlocks", () => {
  it("formats blocks as CSV", () => {
    const blocks = [
      { start: "09:00", end: "12:00" },
      { start: "14:00", end: "17:00" },
    ];
    assert.equal(formatTimeBlocks(blocks), "09:00-12:00, 14:00-17:00");
  });
});
