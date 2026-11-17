/**
 * What a part of a controller's behaviour depends on, as of its last run —
 * `null` before the first. The controllers' stand-in for an effect's dependency
 * list: a host calls `sync` after every change, and each part reruns only when
 * its key has changed.
 */
export type Key = readonly unknown[] | null;

/** Whether `next` differs from `previous`, entry by entry. */
export function changed(previous: Key, next: readonly unknown[]): boolean {
  return previous === null || previous.length !== next.length || next.some((value, index) => value !== previous[index]);
}
