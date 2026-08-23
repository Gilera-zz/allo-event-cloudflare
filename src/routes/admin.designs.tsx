import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/admin/designs")({
  component: () => (
    <PlaceholderPage
      eyebrow="3D Builder"
      title="Sparade monterdesigner"
      description="Kundsessioner och sparade designer från 3D-monterverktyget samlas här när sessionsloggningen kopplas in."
    />
  ),
});
