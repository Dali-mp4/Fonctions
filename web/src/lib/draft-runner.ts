/** Read-only test results; only the API+Modal can produce these, never the browser. */
export type ExecutedCase = {
  label: string;
  passed: boolean;
  actual?: unknown;
  expected?: unknown;
  error?: string;
};
export type DraftRunResult = {
  run_id: string;
  status: "passed" | "failed" | "error";
  case_count: number;
  results: ExecutedCase[];
  error?: string;
};
