/**
 * Ambient types for the experimental `node:bench` module.
 *
 * `@types/node` 26.6 does not ship declarations for it yet. Keep this file
 * limited to the surface used by the benchmark suite.
 */
declare module "node:bench" {
  export interface BenchSample {
    operations: number;
    duration_ns: bigint;
    rate: number;
    detail?: unknown;
  }

  export interface BenchContext {
    readonly index: number;
    readonly name: string;
    readonly params: Record<string, string | number | boolean>;
    readonly phase: "warmup" | "measurement";
    readonly signal: AbortSignal;
    start(): void;
    end(operations: number, options?: { detail?: unknown }): BenchSample;
    record(sample: {
      operations: number;
      duration_ns: bigint;
      detail?: unknown;
    }): BenchSample;
    diagnostic(message: unknown, options?: { level?: "info" | "warning"; detail?: unknown }): void;
    done(): void;
  }

  export interface BenchOptions {
    diagnosticChannels?: string[];
    only?: boolean;
    params?: Record<string, string | number | boolean>;
    samples?: number;
    signal?: AbortSignal;
    skip?: boolean | string;
    tags?: string[];
    timeout?: number;
    warmup?: number;
  }

  export interface SuiteOptions {
    diagnosticChannels?: string[];
    only?: boolean;
    skip?: boolean | string;
    tags?: string[];
  }

  export type BenchFunction = (context: BenchContext) => unknown;

  export function bench(name: string, fn: BenchFunction): Promise<unknown>;
  export function bench(name: string, options: BenchOptions, fn: BenchFunction): Promise<unknown>;
  export function suite(name: string, fn: () => unknown): Promise<unknown>;
  export function suite(name: string, options: SuiteOptions, fn: () => unknown): Promise<unknown>;
}
