/**
 * Anomaly Detection Utilities
 * 
 * Statistical methods for detecting unusual patterns in data
 */

export type Anomaly = {
  date: string;
  value: number;
  expectedValue: number;
  deviationScore: number;
  severity: "low" | "medium" | "high";
  type: "spike" | "drop" | "outlier";
  description: string;
};

/**
 * Detect anomalies using Z-score method
 */
export function detectAnomaliesZScore(
  data: Array<{ date: string; value: number }>,
  threshold: number = 2.5
): Anomaly[] {
  if (data.length < 7) return []; // Need minimum data points

  const values = data.map(point => point.value);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const standardDeviation = Math.sqrt(variance);

  const anomalies: Anomaly[] = [];

  data.forEach((point, index) => {
    if (standardDeviation === 0) return; // Avoid division by zero

    const zScore = Math.abs((point.value - mean) / standardDeviation);
    
    if (zScore > threshold) {
      const severity = zScore > 3.5 ? "high" : zScore > 2.8 ? "medium" : "low";
      const type = point.value > mean * 1.5 ? "spike" : 
                   point.value < mean * 0.5 ? "drop" : "outlier";
      
      const description = type === "spike" 
        ? `Unusually high value: ${point.value.toFixed(1)} vs expected ${mean.toFixed(1)}`
        : type === "drop"
        ? `Unusually low value: ${point.value.toFixed(1)} vs expected ${mean.toFixed(1)}`
        : `Outlier detected: ${point.value.toFixed(1)} deviates significantly from normal range`;

      anomalies.push({
        date: point.date,
        value: point.value,
        expectedValue: mean,
        deviationScore: zScore,
        severity,
        type,
        description,
      });
    }
  });

  return anomalies;
}

/**
 * Detect anomalies using Interquartile Range (IQR) method
 */
export function detectAnomaliesIQR(
  data: Array<{ date: string; value: number }>
): Anomaly[] {
  if (data.length < 7) return [];

  const values = data.map(point => point.value).sort((a, b) => a - b);
  const n = values.length;
  
  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  const q1 = values[q1Index];
  const q3 = values[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  const anomalies: Anomaly[] = [];

  data.forEach(point => {
    if (point.value < lowerBound || point.value > upperBound) {
      const severity = 
        point.value < q1 - 3 * iqr || point.value > q3 + 3 * iqr ? "high" :
        point.value < q1 - 2 * iqr || point.value > q3 + 2 * iqr ? "medium" : "low";
      
      const type = point.value > upperBound ? "spike" : "drop";
      const expectedValue = (q1 + q3) / 2; // Median as expected value
      
      const description = type === "spike"
        ? `Value ${point.value.toFixed(1)} exceeds upper bound ${upperBound.toFixed(1)}`
        : `Value ${point.value.toFixed(1)} below lower bound ${lowerBound.toFixed(1)}`;

      anomalies.push({
        date: point.date,
        value: point.value,
        expectedValue,
        deviationScore: Math.abs(point.value - expectedValue) / iqr,
        severity,
        type,
        description,
      });
    }
  });

  return anomalies;
}

/**
 * Detect trend changes/breakpoints
 */
export function detectTrendBreakpoints(
  data: Array<{ date: string; value: number }>,
  windowSize: number = 7
): Array<{
  date: string;
  changeType: "acceleration" | "deceleration" | "reversal";
  magnitude: number;
  description: string;
}> {
  if (data.length < windowSize * 2) return [];

  const breakpoints: Array<{
    date: string;
    changeType: "acceleration" | "deceleration" | "reversal";
    magnitude: number;
    description: string;
  }> = [];

  for (let i = windowSize; i < data.length - windowSize; i++) {
    const beforeWindow = data.slice(i - windowSize, i);
    const afterWindow = data.slice(i, i + windowSize);
    
    const beforeTrend = calculateTrend(beforeWindow.map(p => p.value));
    const afterTrend = calculateTrend(afterWindow.map(p => p.value));
    
    const trendChange = afterTrend - beforeTrend;
    
    if (Math.abs(trendChange) > 0.5) { // Significant trend change threshold
      let changeType: "acceleration" | "deceleration" | "reversal";
      
      if (beforeTrend > 0 && afterTrend < 0 || beforeTrend < 0 && afterTrend > 0) {
        changeType = "reversal";
      } else if (Math.abs(afterTrend) > Math.abs(beforeTrend)) {
        changeType = "acceleration";
      } else {
        changeType = "deceleration";
      }
      
      const description = 
        changeType === "reversal" 
          ? `Trend reversed from ${beforeTrend > 0 ? 'positive' : 'negative'} to ${afterTrend > 0 ? 'positive' : 'negative'}`
          : changeType === "acceleration"
          ? `Trend accelerated: slope increased from ${beforeTrend.toFixed(2)} to ${afterTrend.toFixed(2)}`
          : `Trend decelerated: slope decreased from ${beforeTrend.toFixed(2)} to ${afterTrend.toFixed(2)}`;

      breakpoints.push({
        date: data[i].date,
        changeType,
        magnitude: Math.abs(trendChange),
        description,
      });
    }
  }

  return breakpoints;
}

/**
 * Calculate simple linear trend (slope) for a series of values
 */
function calculateTrend(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;

  const xValues = Array.from({ length: n }, (_, i) => i);
  const xMean = xValues.reduce((a, b) => a + b, 0) / n;
  const yMean = values.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const xDiff = xValues[i] - xMean;
    const yDiff = values[i] - yMean;
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
  }

  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Detect seasonal anomalies
 */
export function detectSeasonalAnomalies(
  data: Array<{ date: string; value: number }>,
  period: number = 7 // Weekly seasonality
): Anomaly[] {
  if (data.length < period * 3) return [];

  const anomalies: Anomaly[] = [];
  
  // Calculate seasonal averages
  const seasonalAverages: number[] = [];
  for (let pos = 0; pos < period; pos++) {
    const positionValues: number[] = [];
    
    for (let i = pos; i < data.length; i += period) {
      positionValues.push(data[i].value);
    }
    
    const average = positionValues.reduce((a, b) => a + b, 0) / positionValues.length;
    seasonalAverages.push(average);
  }

  // Check each data point against its seasonal expectation
  data.forEach((point, index) => {
    const seasonalPosition = index % period;
    const expectedValue = seasonalAverages[seasonalPosition];
    const deviation = Math.abs(point.value - expectedValue) / expectedValue;
    
    if (deviation > 0.5) { // 50% deviation threshold
      const severity = deviation > 1.0 ? "high" : deviation > 0.75 ? "medium" : "low";
      const type = point.value > expectedValue ? "spike" : "drop";
      
      const description = `Seasonal anomaly: ${point.value.toFixed(1)} vs seasonal average ${expectedValue.toFixed(1)}`;

      anomalies.push({
        date: point.date,
        value: point.value,
        expectedValue,
        deviationScore: deviation,
        severity,
        type,
        description,
      });
    }
  });

  return anomalies;
}

/**
 * Combine multiple anomaly detection methods
 */
export function detectAnomalies(
  data: Array<{ date: string; value: number }>,
  methods: ("zscore" | "iqr" | "seasonal")[] = ["zscore", "iqr"]
): Anomaly[] {
  let allAnomalies: Anomaly[] = [];

  if (methods.includes("zscore")) {
    allAnomalies = allAnomalies.concat(detectAnomaliesZScore(data));
  }

  if (methods.includes("iqr")) {
    allAnomalies = allAnomalies.concat(detectAnomaliesIQR(data));
  }

  if (methods.includes("seasonal")) {
    allAnomalies = allAnomalies.concat(detectSeasonalAnomalies(data));
  }

  // Remove duplicates and sort by date
  const uniqueAnomalies = allAnomalies.reduce((acc, anomaly) => {
    const existing = acc.find(a => a.date === anomaly.date);
    if (!existing || anomaly.deviationScore > existing.deviationScore) {
      return [...acc.filter(a => a.date !== anomaly.date), anomaly];
    }
    return acc;
  }, [] as Anomaly[]);

  return uniqueAnomalies.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}