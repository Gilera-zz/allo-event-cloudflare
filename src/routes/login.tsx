import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/allo-logo.png";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Logga in – Allo Event Admin" },
      {
        name: "description",
        content: "Logga in i Allo Events adminportal för att hantera bokningar, personal, schema och tidrapporter.",
      },
      { property: "og:title", content: "Logga in – Allo Event Admin" },
      {
        property: "og:description",
        content: "Adminportal för Allo Event: bokningar, bemanning, schema och tidrapportering.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function LoginPage() {
  const { signIn, user, loading } = useAuth();
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
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) setError(error);
    else navigate({ to: "/admin" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/3 w-[60vw] h-[60vw] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, var(--gold-soft), transparent 70%)" }}
        />
      </div>

      <div
        className="w-full max-w-md rounded-2xl p-10 border"
        style={{
          backgroundColor: "var(--card)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderColor: "var(--surface-line)",
        }}
      >
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Allo" className="h-20 w-auto mb-4" />
          <h1 className="text-2xl font-semibold tracking-wide">Admin Portal</h1>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mt-2">
            Allo Event
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
              E-post
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-4 rounded-lg bg-transparent border text-sm focus:outline-none focus:ring-2 transition"
              style={{
                borderColor: "color-mix(in srgb, var(--gold) 30%, transparent)",
              }}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Lösenord
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-4 rounded-lg bg-transparent border text-sm focus:outline-none focus:ring-2 transition"
              style={{ borderColor: "color-mix(in srgb, var(--gold) 30%, transparent)" }}
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 px-3 py-2 rounded-md border border-red-900/40 bg-red-950/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-lg text-sm font-semibold tracking-wide transition disabled:opacity-60"
            style={{ backgroundColor: "var(--gold-soft)", color: "var(--background)" }}
          >
            {submitting ? "Loggar in..." : "Logga in"}
          </button>
        </form>
      </div>
    </div>
  );
}
