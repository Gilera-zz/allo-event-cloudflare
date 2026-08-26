import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/massutskick")({
  component: MassutskickPage,
});

const ALL = "__all__";
const ADMINS = "__admins__";
const DEFAULT_SUPABASE_URL = "https://qbgfacgpehqgeuxhxrus.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_1gcxIzSegBkhJuhMw2QJeA_r5urYSMW";

const massEmailInput = z.object({
  accessToken: z.string().min(20),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(20_000),
  audience: z.enum(["all", "admins", "city"]),
  cityFilter: z.string().trim().max(120).nullable().optional(),
});

type MassEmailResult = {
  sent: number;
  failed: number;
  total: number;
  errors: string[];
};

type RecipientProfile = {
  email: string | null;
  city: string | null;
  is_admin: boolean | null;
  mass_email_opt_out: boolean | null;
};

export const sendMassEmail = createServerFn({ method: "POST" })
  .validator(massEmailInput)
  .handler(async ({ data }): Promise<MassEmailResult> => {
    // Cloudflare injects Worker vars/secrets per request. Keep all secret reads here,
    // never at module scope, so RESEND_API_KEY cannot be baked into the client bundle.
    const env = process.env;
    const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseKey =
      env.SUPABASE_ANON_KEY ||
      env.SUPABASE_PUBLISHABLE_KEY ||
      env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      env.VITE_SUPABASE_ANON_KEY ||
      DEFAULT_SUPABASE_PUBLISHABLE_KEY;
    const resendApiKey = env.RESEND_API_KEY;

    if (!resendApiKey) {
      throw new Error(
        "RESEND_API_KEY saknas i Cloudflare Worker. Lägg till den under Settings → Variables and Secrets.",
      );
    }

    const authed = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userError } = await authed.auth.getUser(data.accessToken);
    if (userError || !userData.user) throw new Error("Sessionen är inte längre giltig. Logga in igen.");

    // Never trust the browser's admin state. Re-check the authenticated user's role server-side.
    const { data: adminRole, error: adminError } = await authed
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (adminError) throw new Error(`Kunde inte verifiera administratör: ${adminError.message}`);
    if (!adminRole) throw new Error("Behörighet saknas: endast administratörer kan göra massutskick.");

    const { data: rows, error: recipientsError } = await authed
      .from("profiles")
      .select("email, city, is_admin, mass_email_opt_out");

    if (recipientsError) {
      const missingOptOut = recipientsError.message.toLowerCase().includes("mass_email_opt_out");
      if (missingOptOut) {
        throw new Error(
          "Databasen saknar mass_email_opt_out. Kör migrationen db/migrations/20260826_mass_email_opt_out.sql först.",
        );
      }
      throw new Error(`Kunde inte hämta mottagare: ${recipientsError.message}`);
    }

    const cityFilter = (data.cityFilter ?? "").trim().toLocaleLowerCase("sv-SE");
    const filtered = ((rows ?? []) as RecipientProfile[]).filter((profile) => {
      if (profile.mass_email_opt_out) return false;
      if (data.audience === "admins" && !profile.is_admin) return false;
      if (
        data.audience === "city" &&
        (profile.city ?? "").trim().toLocaleLowerCase("sv-SE") !== cityFilter
      ) {
        return false;
      }
      return true;
    });

    const recipients = Array.from(
      new Set(
        filtered
          .map((profile) => (profile.email ?? "").trim().toLowerCase())
          .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
      ),
    );

    if (recipients.length === 0) return { sent: 0, failed: 0, total: 0, errors: [] };

    const from = env.RESEND_FROM_EMAIL || "Allo Event <info@alloevent.se>";
    const replyTo = env.RESEND_REPLY_TO || "info@alloevent.se";
    const content = renderEmail(data.message);
    const batchSize = 100;
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let index = 0; index < recipients.length; index += batchSize) {
      const chunk = recipients.slice(index, index + batchSize);
      const payload = chunk.map((to) => ({
        from,
        to: [to],
        reply_to: replyTo,
        subject: data.subject,
        html: content,
      }));

      try {
        const response = await fetch("https://api.resend.com/emails/batch", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const text = await response.text();
          failed += chunk.length;
          errors.push(`Batch ${Math.floor(index / batchSize) + 1}: ${response.status} ${text.slice(0, 180)}`);
        } else {
          sent += chunk.length;
        }
      } catch (error) {
        failed += chunk.length;
        errors.push(
          `Batch ${Math.floor(index / batchSize) + 1}: ${error instanceof Error ? error.message : "okänt fel"}`,
        );
      }
    }

    return { sent, failed, total: recipients.length, errors: errors.slice(0, 5) };
  });

function renderEmail(message: string) {
  const body = message
    .split(/\r?\n/)
    .map((line) =>
      line.trim()
        ? `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#171717;">${escapeHtml(line)}</p>`
        : `<div style="height:8px;"></div>`,
    )
    .join("");

  return `
    <!doctype html>
    <html lang="sv">
      <body style="margin:0;padding:0;background:#f3f3f0;font-family:Arial,Helvetica,sans-serif;color:#171717;">
        <div style="padding:32px 16px;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #deded8;">
            <div style="padding:22px 28px;border-bottom:1px solid #e8e8e3;">
              <div style="font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#6b6b67;">Allo Event</div>
            </div>
            <div style="padding:30px 28px 24px;">${body}</div>
            <div style="padding:18px 28px 24px;border-top:1px solid #e8e8e3;font-size:11px;line-height:1.55;color:#777773;">
              Detta är ett personalutskick från Allo Event. Vid frågor, kontakta
              <a href="mailto:info@alloevent.se" style="color:#555;text-decoration:underline;">info@alloevent.se</a>.
            </div>
          </div>
        </div>
      </body>
    </html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function validEmail(email: string | null) {
  return !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function MassutskickPage() {
  const sendOnServer = useServerFn(sendMassEmail);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState(ALL);
  const [profiles, setProfiles] = useState<RecipientProfile[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(true);
  const [recipientError, setRecipientError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingRecipients(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("email, city, is_admin, mass_email_opt_out");
      if (cancelled) return;
      if (error) {
        setRecipientError(error.message);
        setProfiles([]);
      } else {
        setRecipientError(null);
        setProfiles((data as RecipientProfile[]) ?? []);
      }
      setLoadingRecipients(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cities = useMemo<string[]>(
    () =>
      Array.from(
        new Set<string>(
          profiles
            .map((profile) => (profile.city ?? "").trim())
            .filter((city) => city.length > 0),
        ),
      ).sort((a, b) => a.localeCompare(b, "sv")),
    [profiles],
  );

  const selectedRecipients = useMemo(() => {
    const city = target !== ALL && target !== ADMINS ? target.toLocaleLowerCase("sv-SE") : "";
    const emails = profiles
      .filter((profile) => {
        if (profile.mass_email_opt_out || !validEmail(profile.email)) return false;
        if (target === ADMINS) return !!profile.is_admin;
        if (target !== ALL) return (profile.city ?? "").trim().toLocaleLowerCase("sv-SE") === city;
        return true;
      })
      .map((profile) => profile.email!.trim().toLowerCase());
    return new Set(emails).size;
  }, [profiles, target]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error("Du är inte längre inloggad.");

      const audience: "all" | "admins" | "city" =
        target === ALL ? "all" : target === ADMINS ? "admins" : "city";

      return sendOnServer({
        data: {
          accessToken,
          subject: subject.trim(),
          message: message.trim(),
          audience,
          cityFilter: audience === "city" ? target : null,
        },
      });
    },
    onSuccess: (result) => {
      if (result.sent > 0 && result.failed === 0) {
        setSubject("");
        setMessage("");
      }
    },
  });

  const canSend =
    subject.trim().length > 0 &&
    message.trim().length > 0 &&
    selectedRecipients > 0 &&
    !mutation.isPending;

  const submit = () => {
    if (!canSend) return;
    const audienceLabel =
      target === ALL ? "alla aktiva mottagare" : target === ADMINS ? "alla administratörer" : `personal i ${target}`;
    const approved = window.confirm(
      `Skicka detta e-postutskick till ${selectedRecipients} mottagare (${audienceLabel})?`,
    );
    if (approved) mutation.mutate();
  };

  return (
    <div className="admin-page">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Personal · Kommunikation</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Massutskick</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Skicka e-post till hela personalstyrkan, administratörer eller personal i en vald ort.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5">
        <section
          className="rounded-xl border p-5 md:p-6"
          style={{ borderColor: "var(--surface-line)", backgroundColor: "var(--surface)" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="mass-target" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Mottagare
              </Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger id="mass-target" className="h-11 bg-background/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Alla personal</SelectItem>
                  <SelectItem value={ADMINS}>Administratörer · testutskick</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="mass-subject" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Ämne
              </Label>
              <Input
                id="mass-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={200}
                placeholder="Ex. Viktig information inför kommande uppdrag"
                className="h-11 bg-background/40"
              />
              <div className="text-right text-[10px] text-muted-foreground">{subject.length}/200</div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="mass-message" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Meddelande
              </Label>
              <Textarea
                id="mass-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={20_000}
                rows={11}
                placeholder="Skriv meddelandet som ska skickas till personalen..."
                className="min-h-[250px] resize-y bg-background/40 leading-relaxed"
              />
              <div className="flex items-center justify-between gap-4 text-[10px] text-muted-foreground">
                <span>Radbrytningar behålls i e-postmeddelandet.</span>
                <span>{message.length.toLocaleString("sv-SE")}/20 000</span>
              </div>
            </div>
          </div>

          {recipientError && (
            <div
              className="mt-5 rounded-lg border p-4 text-sm flex gap-3"
              style={{
                borderColor: "color-mix(in srgb, var(--destructive) 35%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--destructive) 7%, transparent)",
              }}
            >
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
              <div>
                <div className="font-medium">Kunde inte läsa mottagarlistan</div>
                <div className="mt-1 text-xs text-muted-foreground">{recipientError}</div>
              </div>
            </div>
          )}

          {mutation.isSuccess && (
            <div
              className="mt-5 rounded-lg border p-4 text-sm flex gap-3"
              style={{ borderColor: "rgba(34,197,94,.3)", backgroundColor: "rgba(34,197,94,.07)" }}
            >
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "rgb(34,197,94)" }} />
              <div>
                <div className="font-medium">Utskick klart</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {mutation.data.sent} skickade · {mutation.data.failed} misslyckade · {mutation.data.total} mottagare totalt
                </div>
                {mutation.data.errors.length > 0 && (
                  <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground list-disc pl-4">
                    {mutation.data.errors.map((error, index) => (
                      <li key={`${error}-${index}`}>{error}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {mutation.isError && (
            <div
              className="mt-5 rounded-lg border p-4 text-sm flex gap-3"
              style={{
                borderColor: "color-mix(in srgb, var(--destructive) 35%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--destructive) 7%, transparent)",
              }}
            >
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
              <div>
                <div className="font-medium">Utskicket kunde inte skickas</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {mutation.error instanceof Error ? mutation.error.message : "Okänt fel"}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-5 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ borderColor: "var(--surface-line)" }}>
            <div className="text-xs text-muted-foreground">
              {loadingRecipients ? "Räknar mottagare…" : `${selectedRecipients} aktiva mottagare`}
            </div>
            <Button
              type="button"
              disabled={!canSend}
              onClick={submit}
              className="h-10 px-5 rounded-md font-semibold"
              style={{ backgroundColor: "var(--foreground)", color: "var(--background)" }}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Skickar…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Skicka utskick
                </>
              )}
            </Button>
          </div>
        </section>

        <aside className="space-y-3">
          <InfoCard
            icon={Users}
            title={loadingRecipients ? "Mottagare" : `${selectedRecipients} mottagare`}
            text={
              target === ALL
                ? "Alla profiler med giltig e-post som inte har avanmält massutskick."
                : target === ADMINS
                  ? "Säkert testläge som endast skickar till administratörer."
                  : `Endast mottagare registrerade i ${target}.`
            }
          />
          <InfoCard
            icon={ShieldCheck}
            title="Behörighet kontrolleras"
            text="Adminrollen verifieras på servern innan Resend får skicka något."
          />
          <InfoCard
            icon={Mail}
            title="Skickas via Resend"
            text="API-nyckeln ligger som hemlighet i Cloudflare och exponeras aldrig i webbläsaren."
          />
          {target !== ALL && target !== ADMINS && (
            <InfoCard icon={MapPin} title="Ortfilter" text={`Aktivt filter: ${target}`} />
          )}
        </aside>
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Users;
  title: string;
  text: string;
}) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: "var(--surface-line)", backgroundColor: "var(--surface)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="h-8 w-8 rounded-md border flex items-center justify-center shrink-0"
          style={{ borderColor: "var(--surface-line)", backgroundColor: "var(--background)" }}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div>
          <div className="text-xs font-semibold">{title}</div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{text}</p>
        </div>
      </div>
    </div>
  );
}
