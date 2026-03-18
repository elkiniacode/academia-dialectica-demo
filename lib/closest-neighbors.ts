/**
 * Optimized closest-neighbor lookup for neuron canvas.
 *
 * Uses distSq for early rejection and insertion sorting.
 * Strictly zero-allocation: Mutates the provided `out` buffer
 * and returns the count of valid neighbors found.
 */

export interface NeighborResult {
  j: number;
  dist: number;
}

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Find the `maxCount` closest neighbors within `maxDistSq` of `points[idx]`.
 *
 * Zero-allocation: mutates the `out` buffer in place and returns the count.
 * Sorts by distSq during insertion; only applies Math.sqrt to the final top-K.
 */
export function closestNeighbors(
  points: Point2D[],
  idx: number,
  maxDistSq: number,
  maxCount: number,
  out: NeighborResult[]
): number {
  const n = points[idx];
  let len = 0;

  for (let j = 0; j < points.length; j++) {
    if (j === idx) continue;
    const dx = n.x - points[j].x;
    const dy = n.y - points[j].y;
    const distSq = dx * dx + dy * dy;

    // Early rejection — no sqrt needed
    if (distSq >= maxDistSq) continue;

    if (len < maxCount) {
      // Ensure the object exists in the pooled array
      if (!out[len]) out[len] = { j: 0, dist: 0 };

      out[len].j = j;
      out[len].dist = distSq; // Temporarily store distSq
      len++;

      // Insertion sort comparing distSq
      for (let k = len - 1; k > 0 && out[k].dist < out[k - 1].dist; k--) {
        const tmp = out[k];
        out[k] = out[k - 1];
        out[k - 1] = tmp;
      }
    } else if (distSq < out[maxCount - 1].dist) {
      // Closer than the farthest in buffer — replace and re-sort
      out[maxCount - 1].j = j;
      out[maxCount - 1].dist = distSq;

      for (let k = maxCount - 1; k > 0 && out[k].dist < out[k - 1].dist; k--) {
        const tmp = out[k];
        out[k] = out[k - 1];
        out[k - 1] = tmp;
      }
    }
  }

  // Convert the final top-K distSq to actual distances ONLY at the very end
  for (let i = 0; i < len; i++) {
    out[i].dist = Math.sqrt(out[i].dist);
  }

  // Return the count. Caller loops: for (let i = 0; i < len; i++) { ... }
  return len;
}
