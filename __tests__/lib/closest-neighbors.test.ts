import { describe, it, expect } from 'vitest';
import { closestNeighbors, Point2D, NeighborResult } from '@/lib/closest-neighbors';

// The old, unoptimized method for comparison
function slowClosestNeighbors(
  points: Point2D[],
  idx: number,
  maxDist: number,
  maxCount: number
): NeighborResult[] {
  const n = points[idx];
  const results: NeighborResult[] = [];

  for (let j = 0; j < points.length; j++) {
    if (j === idx) continue;
    const dist = Math.sqrt(
      Math.pow(n.x - points[j].x, 2) + Math.pow(n.y - points[j].y, 2)
    );
    if (dist < maxDist) {
      results.push({ j, dist });
    }
  }

  return results.sort((a, b) => a.dist - b.dist).slice(0, maxCount);
}

describe('closestNeighbors Optimization', () => {
  it('should return the exact same top 3 neighbors as the unoptimized sort', () => {
    // 1. Generate 100 random points
    const points: Point2D[] = Array.from({ length: 100 }, () => ({
      x: Math.random() * 1000,
      y: Math.random() * 1000,
    }));

    const TARGET_IDX = 0;
    const MAX_DIST = 150;
    const MAX_DIST_SQ = MAX_DIST * MAX_DIST;
    const MAX_COUNT = 3;

    // 2. Run the old, slow method
    const slowResults = slowClosestNeighbors(points, TARGET_IDX, MAX_DIST, MAX_COUNT);

    // 3. Run your new, optimized zero-allocation method
    const buffer: NeighborResult[] = [];
    const validCount = closestNeighbors(points, TARGET_IDX, MAX_DIST_SQ, MAX_COUNT, buffer);

    // 4. Extract just the valid results from the buffer
    const fastResults = buffer.slice(0, validCount);

    // 5. Assert lengths match
    expect(fastResults.length).toBe(slowResults.length);

    // 6. Assert exact IDs and distances match (using toBeCloseTo for float precision)
    for (let i = 0; i < fastResults.length; i++) {
      expect(fastResults[i].j).toBe(slowResults[i].j);
      expect(fastResults[i].dist).toBeCloseTo(slowResults[i].dist, 5);
    }
  });

  it('should handle zero neighbors found without crashing', () => {
    // Two points very far away
    const points: Point2D[] = [
      { x: 0, y: 0 },
      { x: 10000, y: 10000 },
    ];
    const buffer: NeighborResult[] = [];
    const count = closestNeighbors(points, 0, 100, 3, buffer);
    expect(count).toBe(0);
  });
});
