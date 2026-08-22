import { Construction } from "lucide-react";

export function PlaceholderPage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="px-10 py-12 max-w-[1100px]">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-2xl">{description}</p>
      </div>
      <div
        className="rounded-2xl border p-12 flex flex-col items-center justify-center text-center gap-4"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        <div
          className="h-14 w-14 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "color-mix(in srgb, var(--gold) 10%, transparent)", color: "var(--gold-soft)" }}
        >
          <Construction className="h-6 w-6" />
        </div>
        <p className="text-sm text-muted-foreground max-w-md">
          Den här modulen är under uppbyggnad och aktiveras inom kort.
        </p>
      </div>
    </div>
  );
}
