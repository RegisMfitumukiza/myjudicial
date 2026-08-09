/**
 * Forecasting Utilities
 * 
 * Mathematical functions for predictive analytics
 */

import type { TimeSeriesPoint, TrendAnalysis, Forecast } from "../types/predictive.types.js";

/**
 * Simple moving average
 */
export function calculateMovingAverage(data: number[], window: number): number[] {
  const result: number[] = [];
  
  for (let i = window - 1; i < data.length; i++) {
    const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / window);
  }
  
  return result;
}

/**
 * Exponential smoothing for trend analysis
 */
export function exponentialSmoothing(data: number[], alpha: number = 0.3): number[] {
  if (data.length === 0) return [];
  
  const result: number[] = [data[0]];
  
  for (let i = 1; i < data.length; i++) {
    const smoothed = alpha * data[i] + (1 - alpha) * result[i - 1];
    result.push(smoothed);
  }
  
  return result;
}

/**
 * Double exponential smoothing (Holt's method) for trend and level
 */
export function doubleExponentialSmoothing(
  data: number[], 
  alpha: number = 0.3, 
  beta: number = 0.3
): { level: number[]; trend: number[]; forecast: number[] } {
  if (data.length < 2) return { level: [], trend: [], forecast: [] };
  
  const level: number[] = [data[0]];
  const trend: number[] = [data[1] - data[0]];
  const forecast: number[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const newLevel = alpha * data[i] + (1 - alpha) * (level[i - 1] + trend[i - 1]);
    const newTrend = beta * (newLevel - level[i - 1]) + (1 - beta) * trend[i - 1];
    
    level.push(newLevel);
    trend.push(newTrend);
    
    if (i < data.length - 1) {
      forecast.push(level[i] + trend[i]);
    }
  }
  
  return { level, trend, forecast };
}

/**
 * Linear regression for trend analysis
 */
export function linearRegression(data: number[]): { slope: number; intercept: number; r2: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };
  
  const xValues = Array.from({ length: n }, (_, i) => i);
  const xMean = xValues.reduce((a, b) => a + b, 0) / n;
  const yMean = data.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  let totalSumSquares = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = xValues[i] - xMean;
    const yDiff = data[i] - yMean;
    
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
    totalSumSquares += yDiff * yDiff;
  }
  
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;
  
  // Calculate R-squared
  let residualSumSquares = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * xValues[i] + intercept;
    residualSumSquares += Math.pow(data[i] - predicted, 2);
  }
  
  const r2 = totalSumSquares === 0 ? 0 : 1 - (residualSumSquares / totalSumSquares);
  
  return { slope, intercept, r2 };
}

/**
 * Analyze trend direction and strength
 */
export function analyzeTrend(data: number[]): TrendAnalysis {
  if (data.length < 3) {
    return {
      direction: "stable",
      strength: "weak",
      changePercent: 0,
      confidence: 0,
    };
  }
  
  const { slope, r2 } = linearRegression(data);
  const firstValue = data[0];
  const lastValue = data[data.length - 1];
  
  const changePercent = firstValue === 0 ? 0 : ((lastValue - firstValue) / firstValue) * 100;
  
  let direction: "increasing" | "decreasing" | "stable";
  if (Math.abs(changePercent) < 5) {
    direction = "stable";
  } else if (changePercent > 0) {
    direction = "increasing";
  } else {
    direction = "decreasing";
  }
  
  let strength: "strong" | "moderate" | "weak";
  if (r2 > 0.7) {
    strength = "strong";
  } else if (r2 > 0.4) {
    strength = "moderate";
  } else {
    strength = "weak";
  }
  
  return {
    direction,
    strength,
    changePercent,
    confidence: Math.max(0, Math.min(100, r2 * 100)),
  };
}

/**
 * Simple forecast using linear trend
 */
export function generateForecast(
  historicalData: TimeSeriesPoint[],
  forecastPeriods: number,
  confidenceLevel: number = 0.95
): Forecast {
  const values = historicalData.map(point => point.value);
  const { slope, intercept, r2 } = linearRegression(values);
  const trend = analyzeTrend(values);
  
  // Generate forecast points
  const forecast: TimeSeriesPoint[] = [];
  const lastDate = new Date(historicalData[historicalData.length - 1].date);
  
  // Calculate standard error for confidence intervals
  let residualSumSquares = 0;
  for (let i = 0; i < values.length; i++) {
    const predicted = slope * i + intercept;
    residualSumSquares += Math.pow(values[i] - predicted, 2);
  }
  
  const standardError = Math.sqrt(residualSumSquares / (values.length - 2));
  const tValue = 1.96; // Approximate t-value for 95% confidence
  const marginOfError = tValue * standardError;
  
  const confidence = {
    lower: [] as number[],
    upper: [] as number[],
  };
  
  for (let i = 1; i <= forecastPeriods; i++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + i);
    
    const predictedValue = slope * (values.length - 1 + i) + intercept;
    const lowerBound = Math.max(0, predictedValue - marginOfError);
    const upperBound = predictedValue + marginOfError;
    
    forecast.push({
      date: futureDate.toISOString().split('T')[0],
      value: Math.max(0, predictedValue),
      predicted: true,
    });
    
    confidence.lower.push(lowerBound);
    confidence.upper.push(upperBound);
  }
  
  // Calculate metrics
  const mape = calculateMAPE(values, values.map((_, i) => slope * i + intercept));
  const rmse = calculateRMSE(values, values.map((_, i) => slope * i + intercept));
  
  return {
    timeSeries: [...historicalData, ...forecast],
    trend,
    confidence,
    metrics: {
      mape,
      rmse,
      r2,
    },
  };
}

/**
 * Mean Absolute Percentage Error
 */
export function calculateMAPE(actual: number[], predicted: number[]): number {
  let sum = 0;
  let count = 0;
  
  for (let i = 0; i < Math.min(actual.length, predicted.length); i++) {
    if (actual[i] !== 0) {
      sum += Math.abs((actual[i] - predicted[i]) / actual[i]);
      count++;
    }
  }
  
  return count === 0 ? 0 : (sum / count) * 100;
}

/**
 * Root Mean Square Error
 */
export function calculateRMSE(actual: number[], predicted: number[]): number {
  let sumSquares = 0;
  const length = Math.min(actual.length, predicted.length);
  
  for (let i = 0; i < length; i++) {
    sumSquares += Math.pow(actual[i] - predicted[i], 2);
  }
  
  return Math.sqrt(sumSquares / length);
}

/**
 * Detect seasonal patterns in time series data
 */
export function detectSeasonality(
  data: TimeSeriesPoint[],
  period: number
): { hasSeasonality: boolean; strength: number } {
  if (data.length < period * 2) {
    return { hasSeasonality: false, strength: 0 };
  }
  
  const values = data.map(point => point.value);
  const seasonalAverages: number[] = [];
  
  // Calculate average for each position in the cycle
  for (let pos = 0; pos < period; pos++) {
    const positionValues: number[] = [];
    
    for (let i = pos; i < values.length; i += period) {
      positionValues.push(values[i]);
    }
    
    const average = positionValues.reduce((a, b) => a + b, 0) / positionValues.length;
    seasonalAverages.push(average);
  }
  
  // Calculate variance in seasonal averages
  const overallMean = seasonalAverages.reduce((a, b) => a + b, 0) / seasonalAverages.length;
  const variance = seasonalAverages.reduce((sum, avg) => {
    return sum + Math.pow(avg - overallMean, 2);
  }, 0) / seasonalAverages.length;
  
  const coefficientOfVariation = overallMean === 0 ? 0 : Math.sqrt(variance) / overallMean;
  const hasSeasonality = coefficientOfVariation > 0.1; // Threshold for seasonality
  
  return {
    hasSeasonality,
    strength: Math.min(100, coefficientOfVariation * 100),
  };
}

/**
 * Generate confidence intervals
 */
export function generateConfidenceIntervals(
  forecast: number[],
  standardError: number,
  confidenceLevel: number = 0.95
): { lower: number[]; upper: number[] } {
  const zScore = confidenceLevel === 0.95 ? 1.96 : 
                 confidenceLevel === 0.99 ? 2.58 : 1.645; // 90%
  
  const marginOfError = zScore * standardError;
  
  return {
    lower: forecast.map(value => Math.max(0, value - marginOfError)),
    upper: forecast.map(value => value + marginOfError),
  };
}