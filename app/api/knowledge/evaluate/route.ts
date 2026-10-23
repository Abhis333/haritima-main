import { handle, HttpError, requireAdmin } from "@/lib/guards";
import { evalSchema } from "@/lib/validation";
import { EVAL_CASES, runCase } from "@/lib/eval";

export const maxDuration = 30;

// One test case per request, so a full run never hits the function time limit.
// Read-only (no data is written), so it is not audit-logged.
export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const { caseId, mode } = evalSchema.parse(await req.json());
  const testCase = EVAL_CASES.find((c) => c.id === caseId);
  if (!testCase) throw new HttpError(404, "Unknown test case");
  return Response.json(await runCase(testCase, mode));
});
