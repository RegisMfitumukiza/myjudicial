/**
 * Phase 4: Time Blocks Types
 * Support for multiple time blocks per day (e.g., 9-12, 2-5 for lunch break)
 */

export interface TimeBlock {
  start: string; // HH:MM format (e.g., "09:00")
  end: string;   // HH:MM format (e.g., "12:00")
}

export interface TimeBlockWithMeta extends TimeBlock {
  order?: number; // For sorting/reordering in UI
  id?: string;    // Temporary ID for UI state management
}

/**
 * Validates a time block
 */
export function isValidTimeBlock(block: any): block is TimeBlock {
  if (!block || typeof block !== 'object') return false;
  
  const { start, end } = block;
  
  // Check format HH:MM
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(start) || !timeRegex.test(end)) return false;
  
  // End must be after start
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  return endMinutes > startMinutes;
}

/**
 * Validates an array of time blocks (no overlaps, sorted)
 */
export function areValidTimeBlocks(blocks: any[]): blocks is TimeBlock[] {
  if (!Array.isArray(blocks)) return false;
  if (blocks.length === 0) return false;
  
  // Each block must be valid
  if (!blocks.every(isValidTimeBlock)) return false;
  
  // Check for overlaps
  const sorted = [...blocks].sort((a, b) => a.start.localeCompare(b.start));
  
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    
    // Next block must start after current block ends
    if (next.start < current.end) {
      return false; // Overlap detected
    }
  }
  
  return true;
}

/**
 * Sorts time blocks by start time
 */
export function sortTimeBlocks(blocks: TimeBlock[]): TimeBlock[] {
  return [...blocks].sort((a, b) => a.start.localeCompare(b.start));
}

/**
 * Merges adjacent time blocks (e.g., [9-12, 12-14] -> [9-14])
 */
export function mergeAdjacentBlocks(blocks: TimeBlock[]): TimeBlock[] {
  if (blocks.length <= 1) return blocks;
  
  const sorted = sortTimeBlocks(blocks);
  const merged: TimeBlock[] = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const current = sorted[i];
    
    // If current starts exactly where last ends, merge them
    if (current.start === last.end) {
      last.end = current.end;
    } else {
      merged.push(current);
    }
  }
  
  return merged;
}

/**
 * Converts legacy single time block to time blocks array
 */
export function convertLegacyToTimeBlocks(startTime: string, endTime: string): TimeBlock[] {
  return [{ start: startTime, end: endTime }];
}

/**
 * Calculates total minutes in time blocks
 */
export function calculateTotalMinutes(blocks: TimeBlock[]): number {
  return blocks.reduce((total, block) => {
    const [startH, startM] = block.start.split(':').map(Number);
    const [endH, endM] = block.end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return total + (endMinutes - startMinutes);
  }, 0);
}

/**
 * Formats time blocks for display
 */
export function formatTimeBlocks(blocks: TimeBlock[]): string {
  return blocks.map(b => `${b.start}-${b.end}`).join(', ');
}
