import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/admin/mina-projekt")({
  component: () => (
    <PlaceholderPage
      eyebrow="Mina projekt"
      title="Dina pågående uppdrag"
      description="Här kommer du att se alla projekt du är bokad på, dina pass och uppdaterad information från projektledningen."
    />
  ),
});
