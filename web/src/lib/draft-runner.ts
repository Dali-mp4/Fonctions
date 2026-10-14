/** Read-only test results; only the API+Modal can produce these, never the browser. */
export type ExecutedCase = {
  label: string;
  passed: boolean;
  actual?: unknown;
  expected?: unknown;
  error?: string;
};
/** Millisecond durations measured by the API (not estimates). */
export type RunTimings = {
  auth?: number;
  load?: number;
  reserve?: number;
  sandbox?: number;
  finish?: number;
  total?: number;
  modal_phases?: Record<string, number>;
};
export type DraftRunResult = {
  run_id: string;
  status: "passed" | "failed" | "error";
  case_count: number;
  results: ExecutedCase[];
  error?: string;
  timings_ms?: RunTimings;
};
