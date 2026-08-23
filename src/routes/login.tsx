import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Laptop, Moon, Sun } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme, type ThemePreference } from "@/hooks/use-theme";
import logo from "@/assets/allo-logo.png";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Logga in – Allo Event Operations" },
      { name: "description", content: "Logga in i Allo Events arbetsyta för projekt, bemanning, case, schema och tidrapportering." },
      { property: "og:title", content: "Logga in – Allo Event Operations" },
      { property: "og:type", content: "website" },
    ],
  }),
});

function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const { preference, setTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/admin" });
  }, [loading, user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await signIn(email, password);
    setSubmitting(false);
    if (signInError) setError(signInError);
    else navigate({ to: "/admin" });
  };

  const themeOptions: { value: ThemePreference; icon: typeof Sun; label: string }[] = [
    { value: "system", icon: Laptop, label: "System" },
    { value: "light", icon: Sun, label: "Ljust" },
    { value: "dark", icon: Moon, label: "Mörkt" },
  ];

  return (
    <div className="operations-login">
      <header className="operations-login-topbar">
        <Link to="/" className="operations-login-brand">
          <img src={logo} alt="Allo Event" />
          <span>Operations</span>
        </Link>
        <div className="operations-login-theme">
          {themeOptions.map(({ value, icon: Icon, label }) => (
            <button key={value} type="button" onClick={() => setTheme(value)} className={preference === value ? "is-active" : ""} title={label}>
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </header>

      <main className="operations-login-grid">
        <section className="operations-login-intro">
          <span className="operations-login-eyebrow">Allo Event · Internal workspace</span>
          <h1>Make it happen.<br /><span>Then manage it.</span></h1>
          <p>Projekt, personal, kundförfrågningar, case och tid — samlat i en arbetsyta byggd för leveransen bakom eventet.</p>
          <Link to="/" className="operations-login-back"><ArrowLeft className="h-4 w-4" />Till alloevent.se</Link>
        </section>

        <section className="operations-login-form-wrap">
          <form onSubmit={onSubmit} className="operations-login-form">
            <div>
              <span className="operations-login-eyebrow">Säker åtkomst</span>
              <h2>Logga in</h2>
              <p>Använd ditt Allo-konto för att öppna Operations.</p>
            </div>

            <label>
              <span>E-post</span>
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="namn@alloevent.se" />
            </label>
            <label>
              <span>Lösenord</span>
              <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </label>

            {error && <div className="operations-login-error">{error}</div>}

            <button type="submit" disabled={submitting} className="operations-login-submit">
              <span>{submitting ? "Loggar in…" : "Öppna Operations"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
