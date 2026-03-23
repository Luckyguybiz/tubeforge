/**
 * Generic undo/redo history manager.
 *
 * Stores full state snapshots (deep-cloned via structuredClone or JSON
 * round-trip) with a configurable maximum depth. Designed to be embedded
 * inside Zustand stores or used standalone.
 *
 * Usage:
 *   const hm = new HistoryManager<MyState>({ maxHistory: 50 });
 *   hm.push(currentState);           // snapshot before mutation
 *   const prev = hm.undo(currentState); // returns previous state
 *   const next = hm.redo(currentState); // returns next state
 */

interface HistoryManagerOptions {
  /** Maximum number of undo steps to keep. Defaults to 50. */
  maxHistory?: number;
}

/** Deep-clone helper -- prefer structuredClone where available, JSON fallback. */
function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      // structuredClone can fail on non-serializable values; fall through
    }
  }
  return JSON.parse(JSON.stringify(value));
}

export class HistoryManager<T> {
  private past: T[] = [];
  private future: T[] = [];
  private readonly maxHistory: number;

  /** Debounce timer id used by pushDebounced */
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options?: HistoryManagerOptions) {
    this.maxHistory = options?.maxHistory ?? 50;
  }

  // --------------- public getters ---------------

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  get undoCount(): number {
    return this.past.length;
  }

  get redoCount(): number {
    return this.future.length;
  }

  // --------------- core operations ---------------

  /**
   * Record a snapshot. Call this *before* mutating state so that the
   * snapshot represents the state the user can return to.
   *
   * Clears the redo stack (new branch of history).
   */
  push(state: T): void {
    this.past.push(deepClone(state));
    if (this.past.length > this.maxHistory) {
      this.past.shift();
    }
    this.future = [];
  }

  /**
   * Push with debouncing -- groups rapid successive calls (e.g. per-pixel
   * drag) into a single history entry.  Only the *first* call within
   * `delayMs` actually records the snapshot; later calls within the window
   * are no-ops.  After the window elapses the debounce resets.
   */
  pushDebounced(state: T, delayMs = 300): void {
    if (this.debounceTimer !== null) return; // already recorded for this burst
    this.push(state);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
    }, delayMs);
  }

  /**
   * Undo: move current state onto the redo stack and return the previous state.
   * @param currentState  The state *right now* (so it can be pushed to redo).
   * @returns The restored state, or `null` if nothing to undo.
   */
  undo(currentState: T): T | null {
    if (this.past.length === 0) return null;
    const prev = this.past.pop()!;
    this.future.push(deepClone(currentState));
    return prev;
  }

  /**
   * Redo: move current state onto the undo stack and return the next state.
   * @param currentState  The state *right now* (so it can be pushed to undo).
   * @returns The restored state, or `null` if nothing to redo.
   */
  redo(currentState: T): T | null {
    if (this.future.length === 0) return null;
    const next = this.future.pop()!;
    this.past.push(deepClone(currentState));
    if (this.past.length > this.maxHistory) {
      this.past.shift();
    }
    return next;
  }

  /**
   * Returns the most recent N snapshots from the undo stack (newest first).
   * Useful for building a visual history panel.
   */
  getRecentSnapshots(count: number): T[] {
    const start = Math.max(0, this.past.length - count);
    return this.past.slice(start).reverse();
  }

  /** Wipe all history (e.g. on project load). */
  clear(): void {
    this.past = [];
    this.future = [];
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}
