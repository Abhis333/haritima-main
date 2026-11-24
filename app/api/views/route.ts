import { handle } from "@/lib/guards";
import { viewSchema } from "@/lib/validation";
import { recordPlantView } from "@/lib/analytics";
import { clientKey, rateLimit } from "@/lib/rate-limit";

// Called once per plant per browser session by components/ViewBeacon.tsx.
export const POST = handle(async (req: Request) => {
  if (!rateLimit(`view:${clientKey(req)}`, 60, 60_000).ok) return new Response(null, { status: 204 });
  const { plantId } = viewSchema.parse(await req.json());
  await recordPlantView(plantId);
  return new Response(null, { status: 204 });
});
