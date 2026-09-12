import { describe, test, expect } from 'vitest';
import { findRowIndexAtY, toContentY } from '../../../src/editor/core/gutterGeometry';

describe('C-36: gutter geometry helpers', () => {
  const rows = [
    { top: 0, height: 20 },
    { top: 20, height: 20 },
    { top: 40, height: 30 },
  ];

  test('findRowIndexAtY finds the row containing a y-coordinate', () => {
    expect(findRowIndexAtY(rows, 5)).toBe(0);
    expect(findRowIndexAtY(rows, 20)).toBe(1);
    expect(findRowIndexAtY(rows, 39)).toBe(1);
    expect(findRowIndexAtY(rows, 40)).toBe(2);
    expect(findRowIndexAtY(rows, 69)).toBe(2);
  });

  test('findRowIndexAtY clamps to the last row when y overshoots past the end', () => {
    expect(findRowIndexAtY(rows, 1000)).toBe(2);
  });

  test('findRowIndexAtY clamps to the first row when y is negative (overshoots past the start)', () => {
    expect(findRowIndexAtY(rows, -50)).toBe(0);
  });

  test('findRowIndexAtY returns -1 for an empty row list', () => {
    expect(findRowIndexAtY([], 10)).toBe(-1);
  });

  test('toContentY adds back the container scroll offset', () => {
    // A row that reads clientY=150 in the viewport, when the container's own
    // top is at viewport y=50 and the container has scrolled 200px, sits at
    // content-relative y = 150 - 50 + 200 = 300.
    expect(toContentY(150, 50, 200)).toBe(300);
  });

  test('toContentY with no scroll is just the offset from the container top', () => {
    expect(toContentY(150, 50, 0)).toBe(100);
  });
});
