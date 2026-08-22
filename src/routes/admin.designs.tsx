import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/designs")({
  component: () => (
    <div className="px-10 py-12 max-w-7xl">
      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Builder</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">3D-Monter Sparade Designs</h1>
      <p className="mt-3 text-sm text-muted-foreground">Loggar av kundsessioner från live-byggar-verktyget.</p>
    </div>
  ),
});
