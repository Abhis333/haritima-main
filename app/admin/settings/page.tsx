import { Badge } from "@/components/ui/badge";
import { aiEnabled, chatEnabled, chatModelLabel } from "@/lib/ai";

// Shows whether each integration is configured — never the secret values themselves.
export default function AdminSettings() {
  const checks = [
    { name: "Database", ok: Boolean(process.env.DATABASE_URL), note: "DATABASE_URL" },
    { name: "Auth secret", ok: Boolean(process.env.AUTH_SECRET), note: "AUTH_SECRET" },
    { name: "AI chatbot answers", ok: chatEnabled(), note: chatModelLabel() },
    { name: "Embeddings (Gemini)", ok: aiEnabled(), note: `AI_API_KEY · ${process.env.AI_EMBEDDING_MODEL || "gemini-embedding-001"}` },
    { name: "Plant identification (Pl@ntNet)", ok: Boolean(process.env.PLANTNET_API_KEY), note: "PLANTNET_API_KEY" },
    { name: "Image & audio storage (Cloudinary)", ok: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET), note: "CLOUDINARY_*" },
    { name: "Map tiles", ok: true, note: process.env.NEXT_PUBLIC_MAP_URL || "OpenStreetMap default" },
  ];
  return (
    <div>
      <h1 className="text-4xl">Settings</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Integrations are configured through environment variables on the server (Vercel → Project → Settings → Environment Variables). Secret values are never shown here.</p>
      <ul className="mt-6 max-w-2xl divide-y divide-parch rounded-xl border border-parch bg-card">
        {checks.map((c) => (
          <li key={c.name} className="flex items-center justify-between gap-4 px-5 py-3.5">
            <div><p className="font-medium text-forest">{c.name}</p><p className="text-sm text-muted-foreground">{c.note}</p></div>
            <Badge variant={c.ok ? "verified" : "pending"}>{c.ok ? "Configured" : "Not set"}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
