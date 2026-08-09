import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  calculateMovingAverage,
  exponentialSmoothing,
  doubleExponentialSmoothing,
  linearRegression,
  analyzeTrend,
  calculateMAPE,
  calculateRMSE,
  detectSeasonality,
  generateConfidenceIntervals,
} from "../src/modules/admin-analytics/utils/forecasting.utils.js";

describe("calculateMovingAverage", () => {
  it("computes windowed averages", () => {
    assert.deepEqual(calculateMovingAverage([1, 2, 3, 4, 5], 3), [2, 3, 4]);
  });

  it("returns empty when window exceeds data", () => {
    assert.deepEqual(calculateMovingAverage([1, 2], 3), []);
  });

  it("handles window of 1", () => {
    assert.deepEqual(calculateMovingAverage([1, 2, 3], 1), [1, 2, 3]);
  });
});

describe("exponentialSmoothing", () => {
  it("returns empty for empty input", () => {
    assert.deepEqual(exponentialSmoothing([]), []);
  });

  it("first value is data[0]", () => {
    assert.equal(exponentialSmoothing([5, 10])[0], 5);
  });

  it("smooths with alpha=0.5", () => {
    const result = exponentialSmoothing([10, 20, 30], 0.5);
    assert.equal(result[0], 10);
    assert.equal(result[1], 15); // 0.5*20 + 0.5*10
    assert.equal(result[2], 22.5); // 0.5*30 + 0.5*15
  });

  it("alpha=1 is identity", () => {
    assert.deepEqual(exponentialSmoothing([1, 2, 3], 1), [1, 2, 3]);
  });
});

describe("doubleExponentialSmoothing", () => {
  it("returns empty arrays for < 2 points", () => {
    const result = doubleExponentialSmoothing([1]);
    assert.deepEqual(result, { level: [], trend: [], forecast: [] });
  });

  it("produces same-length level/trend", () => {
    const result = doubleExponentialSmoothing([10, 12, 14, 16]);
    assert.equal(result.level.length, 4);
    assert.equal(result.trend.length, 4);
    assert.equal(result.forecast.length, 2); // one fewer than points, pushed only up to n-1
  });
});

describe("linearRegression", () => {
  it("perfect line has r2 = 1", () => {
    const { slope, intercept, r2 } = linearRegression([0, 1, 2, 3]);
    assert.equal(slope, 1);
    assert.equal(intercept, 0);
    assert.ok(Math.abs(r2 - 1) < 1e-9);
  });

  it("returns zeros for < 2 points", () => {
    assert.deepEqual(linearRegression([5]), { slope: 0, intercept: 0, r2: 0 });
  });

  it("flat data has slope 0", () => {
    const { slope } = linearRegression([4, 4, 4, 4]);
    assert.equal(slope, 0);
  });
});

describe("analyzeTrend", () => {
  it("detects increasing trend", () => {
    const trend = analyzeTrend([10, 12, 14, 16, 18]);
    assert.equal(trend.direction, "increasing");
    assert.equal(trend.changePercent, 80);
  });

  it("detects decreasing trend", () => {
    const trend = analyzeTrend([18, 16, 14, 12, 10]);
    assert.equal(trend.direction, "decreasing");
  });

  it("stable for small changes", () => {
    const trend = analyzeTrend([100, 102, 101, 103]);
    assert.equal(trend.direction, "stable");
  });

  it("weak for fewer than 3 points", () => {
    const trend = analyzeTrend([10, 12]);
    assert.equal(trend.direction, "stable");
    assert.equal(trend.strength, "weak");
  });
});

describe("calculateMAPE", () => {
  it("computes percentage error", () => {
    assert.equal(calculateMAPE([100, 100], [100, 100]), 0);
    assert.equal(calculateMAPE([100, 200], [100, 100]), 25); // (0 + 0.5)/2 * 100
  });

  it("skips zero actuals", () => {
    assert.equal(calculateMAPE([0, 100], [0, 90]), 10);
  });

  it("returns 0 when all actuals are zero", () => {
    assert.equal(calculateMAPE([0, 0], [5, 5]), 0);
  });
});

describe("calculateRMSE", () => {
  it("zero for perfect prediction", () => {
    assert.equal(calculateRMSE([1, 2, 3], [1, 2, 3]), 0);
  });

  it("computes RMSE", () => {
    const rmse = calculateRMSE([1, 2, 3], [1, 4, 3]);
    // errors: 0, 2, 0 -> squares 0,4,0 -> mean 4/3 -> sqrt
    assert.ok(Math.abs(rmse - Math.sqrt(4 / 3)) < 1e-9);
  });
});

describe("detectSeasonality", () => {
  it("returns false with insufficient data", () => {
    const result = detectSeasonality([{ date: "2024-01-01", value: 1 }], 7);
    assert.equal(result.hasSeasonality, false);
    assert.equal(result.strength, 0);
  });

  it("detects clear periodicity", () => {
    const data = [];
    for (let i = 0; i < 14; i++) {
      // strong weekly pattern: 100 on even weeks, 10 on odd
      data.push({ date: `2024-01-${String(i + 1).padStart(2, "0")}`, value: i % 7 < 4 ? 100 : 10 });
    }
    const result = detectSeasonality(data, 7);
    assert.equal(result.hasSeasonality, true);
    assert.ok(result.strength > 0);
  });
});

describe("generateConfidenceIntervals", () => {
  it("95% uses z-score 1.96", () => {
    const { lower, upper } = generateConfidenceIntervals([100], 10);
    assert.equal(lower[0], 100 - 19.6);
    assert.equal(upper[0], 100 + 19.6);
  });

  it("99% uses z-score 2.58", () => {
    const { upper } = generateConfidenceIntervals([100], 10, 0.99);
    assert.equal(upper[0], 100 + 25.8);
  });

  it("lower bound is never negative", () => {
    const { lower } = generateConfidenceIntervals([5], 10);
    assert.equal(lower[0], 0);
  });
});
