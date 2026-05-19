import { filterIntermediateValues } from '../apps/PercentArrayFilter';
import type { QueuedValue } from '../apps/PubnubMessageQueue';

function vals(...values: number[]): QueuedValue[] {
  return values.map((v) => ({ value: v }));
}

describe('filterIntermediateValues', () => {
  it('returns empty array unchanged', () => {
    expect(filterIntermediateValues([])).toEqual([]);
  });

  it('returns single element unchanged', () => {
    const input = vals(50);
    expect(filterIntermediateValues(input)).toEqual(input);
  });

  it('returns two elements unchanged', () => {
    const input = vals(0, 100);
    expect(filterIntermediateValues(input)).toEqual(input);
  });

  it('keeps only first and last for strictly ascending sequence', () => {
    const result = filterIntermediateValues(vals(0, 25, 50, 75, 100));
    expect(result).toEqual(vals(0, 100));
  });

  it('keeps only first and last for strictly descending sequence', () => {
    const result = filterIntermediateValues(vals(100, 75, 50, 25, 0));
    expect(result).toEqual(vals(100, 0));
  });

  it('keeps peaks and valleys: [0,50,100,75,50,75,100] → [0,100,50,100]', () => {
    const result = filterIntermediateValues(vals(0, 50, 100, 75, 50, 75, 100));
    // 50 between 0 and 100 is monotone increasing → dropped
    // 100 between 50 and 75 is NOT monotone → kept
    // 75 between 100 and 50 is monotone decreasing → dropped
    // 50 between 75 and 75 is NOT monotone (75>=50 but 50>=75 is false) → kept
    // 75 between 50 and 100 is monotone increasing → dropped
    expect(result).toEqual(vals(0, 100, 50, 100));
  });

  it('keeps all three for a simple peak: [0, 100, 0]', () => {
    const result = filterIntermediateValues(vals(0, 100, 0));
    // 100 between 0 and 0: 0<=100 but 100<=0 is false; 0>=100 is false → NOT monotone → kept
    expect(result).toEqual(vals(0, 100, 0));
  });

  it('keeps all three for a simple valley: [100, 0, 100]', () => {
    const result = filterIntermediateValues(vals(100, 0, 100));
    expect(result).toEqual(vals(100, 0, 100));
  });

  it('always includes first and last elements', () => {
    const input = vals(10, 20, 30, 40, 50);
    const result = filterIntermediateValues(input);
    expect(result[0]).toEqual({ value: 10 });
    expect(result[result.length - 1]).toEqual({ value: 50 });
  });

  it('preserves the to field on QueuedValue', () => {
    const input: QueuedValue[] = [
      { value: 0, to: 'device1' },
      { value: 100, to: 'device1' },
    ];
    const result = filterIntermediateValues(input);
    expect(result).toEqual(input);
  });
});
