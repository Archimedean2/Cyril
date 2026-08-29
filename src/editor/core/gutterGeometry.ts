/**
 * Pure geometry helpers for the C-36 speaker gutter (`SpeakerGutter.tsx`).
 * Kept separate from the component and unit-tested directly because jsdom
 * cannot lay out real pixels — these functions take plain numbers in and
 * out, so their behaviour (which row a drag is currently over, converting a
 * viewport Y to a "content-relative" Y that scrolls with the page) is
 * testable without a real browser.
 */

export interface GutterRowGeometry {
  top: number;
  height: number;
}

/**
 * The index of the row whose vertical span contains content-relative
 * coordinate `y`. Clamps to the first/last row when `y` falls outside every
 * row's span (e.g. a drag that overshoots past the top/bottom of the
 * document) rather than returning "no match" — a drag that runs off the end
 * of the lyric should still paint through the last real line.
 */
export function findRowIndexAtY(rows: GutterRowGeometry[], y: number): number {
  if (rows.length === 0) return -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (y < row.top + row.height) return i;
  }
  return rows.length - 1;
}

/**
 * Converts a pointer event's viewport-relative `clientY` into a
 * content-relative Y — the coordinate space `GutterRowGeometry.top` values
 * are measured in (see `SpeakerGutter`'s `recompute`) — by adding back the
 * container's current scroll offset. This is what lets the same cached row
 * rects stay valid while the page is scrolled mid-drag.
 */
export function toContentY(clientY: number, containerTop: number, containerScrollTop: number): number {
  return clientY - containerTop + containerScrollTop;
}
