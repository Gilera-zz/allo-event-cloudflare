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
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>
      <div className="admin-panel admin-placeholder-panel">
        <span className="admin-placeholder-icon"><Construction className="h-5 w-5" /></span>
        <div>
          <strong>Modulen förbereds</strong>
          <p>Den här arbetsytan är under uppbyggnad och aktiveras när funktionen kopplas in.</p>
        </div>
      </div>
    </div>
  );
}
