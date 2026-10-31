/**
 * Минимальные типы для встроенного node:sqlite (Node ≥ 22.5).
 * В проекте @types/node@20, где этого модуля ещё нет; рантайм его умеет.
 * Описана только используемая поверхность DatabaseSync.
 */
declare module "node:sqlite" {
  export interface StatementResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  export interface StatementSync {
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
    run(...params: unknown[]): StatementResult;
  }

  export class DatabaseSync {
    constructor(path: string, options?: { open?: boolean; readOnly?: boolean });
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
