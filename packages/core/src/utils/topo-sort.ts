/**
 * 위상 정렬 레이어 계산
 *
 * 태스크 의존성(blockedBy)을 기반으로 depth를 계산하고,
 * 같은 depth의 태스크를 하나의 레이어로 그룹핑한다.
 * VS Code 대시보드의 topoSortLayers 로직을 타입 안전한 순수 함수로 추출.
 */
import type { Task } from "../types/index.js";

/** 위상 정렬 결과 */
export interface TopoSortResult {
  /** depth별 태스크 그룹 (layers[0] = 의존 없는 루트 태스크) */
  layers: Task[][];
  /** 태스크 ID → depth 매핑 */
  depths: Map<string, number>;
}

/**
 * 태스크 의존성 기반 레이어 계산
 *
 * 각 태스크의 depth를 재귀적으로 계산한다:
 * - blockedBy가 없는 태스크 → depth 0
 * - blockedBy가 있는 태스크 → max(부모 depth) + 1
 * - 순환 참조 시 depth 0으로 처리 (graceful)
 */
export function topoSortLayers(tasks: readonly Task[]): TopoSortResult {
  const taskMap = new Map<string, Task>();
  for (const task of tasks) {
    taskMap.set(task.id, task);
  }

  const depths = new Map<string, number>();
  const visiting = new Set<string>();

  function getDepth(id: string): number {
    const cached = depths.get(id);
    if (cached !== undefined) return cached;

    // 순환 방지
    if (visiting.has(id)) return 0;
    visiting.add(id);

    const task = taskMap.get(id);
    if (!task || task.blockedBy.length === 0) {
      depths.set(id, 0);
      visiting.delete(id);
      return 0;
    }

    let maxParentDepth = 0;
    for (const parentId of task.blockedBy) {
      if (taskMap.has(parentId)) {
        const d = getDepth(parentId) + 1;
        if (d > maxParentDepth) maxParentDepth = d;
      }
    }

    depths.set(id, maxParentDepth);
    visiting.delete(id);
    return maxParentDepth;
  }

  for (const task of tasks) {
    getDepth(task.id);
  }

  // depth별 그룹핑
  const layers: Task[][] = [];
  for (const task of tasks) {
    const d = depths.get(task.id) ?? 0;
    while (layers.length <= d) {
      layers.push([]);
    }
    layers[d].push(task);
  }

  return { layers, depths };
}
