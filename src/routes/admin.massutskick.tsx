import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/admin/massutskick")({
  component: () => (
    <PlaceholderPage
      eyebrow="Admin Översikt"
      title="Massutskick"
      description="Skicka SMS och e-post till hela eller delar av personalstyrkan inför ett uppdrag eller akut bemanning."
    />
  ),
});
