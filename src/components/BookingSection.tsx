import { useEffect, useState } from "react";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
type BookingT = {
  badge: string;
  headlineTop: string;
  headlineBottom: string;
  brandDescription: string;
  formTitle: string;
  formSubtitle: string;
  labels: {
    company: string; org_number: string; first_name: string; last_name: string;
    email: string; phone: string; city: string; staff_count: string;
    start_date: string; end_date: string; need_type: string; description: string;
  };
  selectCategory: string;
  consentPrivacyPrefix: string;
  consentPrivacyLink: string;
  consentPrivacySuffix: string;
  consentMarketing: string;
  submit: string;
  submitting: string;
  errors: { consent: string; required: string; generic: string };
  successTitle: string;
  successBody: string;
  close: string;
  needTypes: readonly string[];
};

const COMPLETED_BASELINE = 480;


type FormState = {
  company: string;
  org_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  start_date: string;
  end_date: string;
  staff_count: string;
  need_type: string;
  description: string;
  consent_privacy: boolean;
  consent_marketing: boolean;
};

const INITIAL: FormState = {
  company: "",
  org_number: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  city: "",
  start_date: "",
  end_date: "",
  staff_count: "",
  need_type: "",
  description: "",
  consent_privacy: false,
  consent_marketing: false,
};

const NEED_TYPES = [
  "Eventpersonal",
  "Bygg & Logistik",
  "Servering & Bartending",
  "Mässpersonal & Värdar",
  "Lager & Flytt",
  "Städ & Sanering",
  "Annat",
];

export function BookingSection({
  t,
  intent = "quote",
  language = "sv",
  onIntentChange,
}: {
  t: BookingT;
  intent?: "staffing" | "quote";
  language?: "sv" | "en";
  onIntentChange?: (intent: "staffing" | "quote") => void;
}) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [completedCount, setCompletedCount] = useState<number>(COMPLETED_BASELINE);

  const isStaffing = intent === "staffing";
  const sv = language === "sv";
  const presentation = isStaffing
    ? {
        badge: sv ? "Boka personal" : "Book staff",
        headlineTop: "YOUR WORK.",
        headlineBottom: "OUR PEOPLE.",
        body: sv
          ? "Behöver ni förstärkning till ett uppdrag? Berätta vilken kompetens, period och omfattning ni söker så återkommer vi inom 24 timmar."
          : "Need extra crew for an assignment? Tell us the skills, dates and scale you need and we will get back to you within 24 hours.",
        formTitle: sv ? "Boka personal" : "Book staff",
        formSubtitle: sv ? "Beskriv bemanningsbehovet så återkommer vi med rätt upplägg." : "Describe your staffing need and we will return with the right setup.",
        needLabel: sv ? "Typ av personal" : "Type of staff",
        staffLabel: sv ? "Antal personal" : "Number of staff",
        descriptionLabel: sv ? "Beskriv bemanningsbehovet" : "Describe the staffing need",
        options: sv
          ? ["Eventpersonal", "Bygg & Logistik", "Servering & Bartending", "Mässpersonal & Värdar", "Lager & Flytt", "Städ & Sanering", "Annat"]
          : ["Event staff", "Build & logistics", "Hospitality & bartending", "Exhibition staff & hosts", "Warehouse & moving", "Cleaning", "Other"],
        successBody: sv
          ? "Vi har tagit emot er bemanningsförfrågan och återkommer inom 24 timmar."
          : "We have received your staffing request and will get back to you within 24 hours.",
      }
    : {
        badge: sv ? "Be om offert" : "Request a quote",
        headlineTop: "YOUR EVENT.",
        headlineBottom: "OUR DELIVERY.",
        body: sv
          ? "Planerar ni event, mässa, monter, rigg eller logistik? Ge oss ramarna så tar vi nästa steg tillsammans och återkommer inom 24 timmar."
          : "Planning an event, exhibition, booth, rig or logistics delivery? Give us the outline and we will take the next step together within 24 hours.",
        formTitle: sv ? "Berätta om projektet" : "Tell us about the project",
        formSubtitle: sv ? "Ni behöver inte ha allt klart – börja med det ni vet." : "You do not need to have everything figured out – start with what you know.",
        needLabel: sv ? "Vad gäller förfrågan?" : "What is the inquiry about?",
        staffLabel: sv ? "Personalbehov, ungefär" : "Approx. staffing need",
        descriptionLabel: sv ? "Beskriv projektet" : "Describe the project",
        options: sv
          ? ["Eventproduktion", "Mässa & monter", "Rigg & montage", "Logistik & transport", "Bemanning", "3D-monter / mässleverans", "Annat"]
          : ["Event production", "Exhibition & booth", "Rigging & installation", "Logistics & transport", "Staffing", "3D booth / exhibition delivery", "Other"],
        successBody: sv
          ? "Vi har tagit emot er offertförfrågan och återkommer inom 24 timmar."
          : "We have received your quote request and will get back to you within 24 hours.",
      };

  useEffect(() => {
    setForm((current) => ({ ...current, need_type: "" }));
    setError(null);
  }, [intent]);

  useEffect(() => {
    (async () => {
      const nowIso = new Date().toISOString();
      let count: number | null = null;
      try {
        const q = supabase.from("projects").select("id", { count: "exact", head: true }) as unknown as {
          in?: (c: string, v: string[]) => Promise<{ error: unknown; count: number | null }>;
        };
        if (typeof q.in === "function") {
          const r = await q.in("status", ["completed", "finished", "closed", "done", "avslutad", "avslutade", "avslutat", "klar", "genomford", "genomförd", "arkiverad", "past"]);
          if (!r.error) count = r.count ?? 0;
        }
      } catch { /* ignore */ }
      if (count === null) {
        try {
          const q2 = supabase.from("projects").select("id", { count: "exact", head: true }) as unknown as {
            lt?: (c: string, v: string) => Promise<{ error: unknown; count: number | null }>;
          };
          if (typeof q2.lt === "function") {
            const r2 = await q2.lt("ends_at", nowIso);
            if (!r2.error) count = r2.count ?? 0;
          }
        } catch { /* ignore */ }
      }
      setCompletedCount(COMPLETED_BASELINE + (count ?? 0));
    })();
  }, []);


  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.consent_privacy) {
      setError(t.errors.consent);
      return;
    }
    if (!form.email || !form.company || !form.first_name) {
      setError(t.errors.required);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        company_name: form.company.trim(),
        org_number: form.org_number.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        staff_count: form.staff_count,
        start_date: form.start_date,
        end_date: form.end_date,
        category: form.need_type,
        description: form.description.trim(),
      };

      const { data: inserted, error: insertError } = await supabase
        .from("leads")
        .insert(payload)
        .select("id")
        .single();
      if (insertError) {
        console.error("SUPABASE BOOKING ERROR:", insertError);
        const parts = [
          insertError.message,
          (insertError as { details?: string }).details,
          (insertError as { hint?: string }).hint,
          (insertError as { code?: string }).code ? `(code: ${(insertError as { code?: string }).code})` : null,
        ].filter(Boolean);
        setError(parts.join(" - "));
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setForm(INITIAL);
    } catch (err: unknown) {
      console.error("SUPABASE BOOKING ERROR:", err);
      const e = err as { message?: string; details?: string; hint?: string; code?: string };
      const parts = [e?.message, e?.details, e?.hint, e?.code ? `(code: ${e.code})` : null].filter(Boolean);
      setError(parts.length ? parts.join(" - ") : t.errors.generic);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <section
      id="booking"
      data-booking-intent={intent}
      className="allo-anchor-section relative py-20 md:py-24"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="mx-auto max-w-[1080px] px-5 md:px-8">
        <div className="allo-booking-intent-switch mb-7" role="tablist" aria-label={sv ? "Välj typ av förfrågan" : "Choose inquiry type"}>
          <button
            type="button"
            role="tab"
            aria-selected={isStaffing}
            className={isStaffing ? "is-active" : ""}
            onClick={() => onIntentChange?.("staffing")}
          >
            <span>01</span>{sv ? "Boka personal" : "Book staff"}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isStaffing}
            className={!isStaffing ? "is-active" : ""}
            onClick={() => onIntentChange?.("quote")}
          >
            <span>02</span>{sv ? "Be om offert" : "Request a quote"}
          </button>
        </div>
        <div className="grid items-stretch gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          {/* Left: brand panel */}
          <div
            className="allo-booking-brand-panel relative overflow-hidden rounded-[24px] p-8 md:p-9 flex flex-col justify-center items-start min-h-[430px]"
            style={{
              background:
                "linear-gradient(135deg, var(--gold-surface) 0%, var(--surface) 50%, var(--background) 100%)",
              border: "1px solid var(--gold-line)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div
              className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, var(--gold), transparent 70%)" }}
            />
            <div className="relative">
              <span
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] font-semibold"
                style={{
                  color: "var(--gold)",
                  backgroundColor: "color-mix(in srgb, var(--gold) 8%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--gold) 25%, transparent)",
                }}
              >
                <Sparkles className="h-3 w-3" /> {presentation.badge}
              </span>
              <h2
                className="mt-6 text-[clamp(2.8rem,4.3vw,4.7rem)] font-bold leading-[0.92] tracking-tight"
                style={{ color: "var(--foreground)", fontFamily: "Urbanist, sans-serif" }}
              >
                {presentation.headlineTop}
                <br />
                <span style={{ color: "var(--gold)" }}>{presentation.headlineBottom}</span>
              </h2>
              <p className="mt-6 text-base leading-relaxed max-w-md" style={{ color: "var(--muted-foreground)" }}>
                {presentation.body}
              </p>
            </div>
          </div>

          {/* Right: form */}
          <form
            onSubmit={onSubmit}
            className="allo-booking-form-panel rounded-[24px] p-6 md:p-7 lg:p-8"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--surface-line)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <h3 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
              {presentation.formTitle}
            </h3>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              {presentation.formSubtitle}
            </p>

            <div className="mt-6 grid sm:grid-cols-2 gap-x-4 gap-y-3.5">
              <Field label={t.labels.company} value={form.company} onChange={(v) => update("company", v)} />
              <Field label={t.labels.org_number} value={form.org_number} onChange={(v) => update("org_number", v)} />
              <Field label={t.labels.first_name} value={form.first_name} onChange={(v) => update("first_name", v)} />
              <Field label={t.labels.last_name} value={form.last_name} onChange={(v) => update("last_name", v)} />
              <Field label={t.labels.email} type="email" value={form.email} onChange={(v) => update("email", v)} />
              <Field label={t.labels.phone} type="tel" value={form.phone} onChange={(v) => update("phone", v)} />
              <Field label={t.labels.city} value={form.city} onChange={(v) => update("city", v)} />
              <Field
                label={presentation.staffLabel}
                type="number"
                value={form.staff_count}
                onChange={(v) => update("staff_count", v)}
              />
              <Field
                label={t.labels.start_date}
                type="date"
                inputClassName="allo-booking-date-input"
                value={form.start_date}
                onChange={(v) => update("start_date", v)}
              />
              <Field
                label={t.labels.end_date}
                type="date"
                inputClassName="allo-booking-date-input"
                value={form.end_date}
                onChange={(v) => update("end_date", v)}
              />
              <div className="sm:col-span-2">
                <Label>{presentation.needLabel}</Label>
                <Select value={form.need_type || undefined} onValueChange={(value) => update("need_type", value)}>
                  <SelectTrigger
                    className="allo-booking-select-trigger h-10 w-full rounded-md px-3 text-sm shadow-none"
                    aria-label={presentation.needLabel}
                  >
                    <SelectValue placeholder={t.selectCategory} />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={6}
                    className="allo-booking-select-content"
                  >
                    {presentation.options.map((option) => (
                      <SelectItem key={option} value={option} className="allo-booking-select-item">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>{presentation.descriptionLabel}</Label>
                <textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-md text-sm outline-none resize-y transition-colors"
                  style={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--surface-line)",
                    color: "var(--foreground)",
                  }}
                />
              </div>
            </div>

            <div className="mt-5 space-y-2.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
              <CheckboxRow
                checked={form.consent_privacy}
                onChange={(v) => update("consent_privacy", v)}
                label={
                  <>
                    {t.consentPrivacyPrefix}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPrivacyOpen(true); }}
                      className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                      style={{ color: "var(--gold)", fontWeight: 600, background: "none", padding: 0, border: 0, cursor: "pointer" }}
                    >
                      {t.consentPrivacyLink}
                    </button>
                    {t.consentPrivacySuffix}
                  </>
                }
              />
              <CheckboxRow
                checked={form.consent_marketing}
                onChange={(v) => update("consent_marketing", v)}
                label={<>{t.consentMarketing}</>}
              />
            </div>

            {error && (
              <div
                className="mt-5 rounded-lg p-3 text-sm"
                style={{ backgroundColor: "color-mix(in srgb, var(--destructive) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--destructive) 30%, transparent)", color: "var(--destructive)" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-md text-xs font-bold uppercase tracking-[0.2em] transition-all hover:opacity-90 disabled:opacity-60"
              style={{
                backgroundColor: "var(--gold)",
                color: "var(--background)",
                height: "48px",
                boxShadow: "0 10px 30px color-mix(in srgb, var(--gold) 35%, transparent)",
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {t.submitting}
                </>
              ) : (
                <>{t.submit}</>
              )}
            </button>
          </form>
        </div>
      </div>

      {success && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300"
          style={{ backgroundColor: "rgba(5,5,5,0.84)", backdropFilter: "blur(12px)" }}
          onClick={() => setSuccess(false)}
        >
          <div
            className="relative max-w-md w-full rounded-3xl p-10 text-center animate-in zoom-in-95 duration-300"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--gold-line)",
              boxShadow: "0 30px 80px color-mix(in srgb, var(--gold) 20%, transparent)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: "var(--gold)", boxShadow: "0 10px 30px color-mix(in srgb, var(--gold) 40%, transparent)" }}
            >
              <Check className="h-10 w-10" style={{ color: "var(--background)" }} strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
              {t.successTitle}
            </h3>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              {presentation.successBody}
            </p>
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="mt-8 inline-flex items-center justify-center rounded-full px-6 h-11 text-sm font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: "var(--gold)", color: "var(--background)" }}
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-xs uppercase tracking-[0.15em] font-semibold mb-1.5"
      style={{ color: "var(--muted-foreground)" }}
    >
      {children}
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputClassName = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputClassName?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-10 px-3 rounded-md text-sm outline-none transition-colors focus:border-gold ${inputClassName}`}
        style={{
          backgroundColor: "var(--background)",
          border: "1px solid var(--surface-line)",
          color: "var(--foreground)",
        }}
      />
    </div>
  );
}

function CheckboxRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <span
        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded transition-all"
        style={{
          backgroundColor: checked ? "var(--gold)" : "var(--background)",
          border: `1px solid ${checked ? "var(--gold)" : "var(--surface-line)"}`,
        }}
      >
        {checked && <Check className="h-3.5 w-3.5" style={{ color: "var(--background)" }} strokeWidth={3} />}
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
      </span>
      <span className="text-xs leading-relaxed">{label}</span>
    </label>
  );
}

function PrivacyModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ backgroundColor: "rgba(5,5,5,0.84)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--gold-line)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sticky top-0 z-10 flex items-start justify-between px-8 pt-7 pb-5"
          style={{
            background: "linear-gradient(180deg, var(--surface) 0%, var(--surface) 70%, var(--card) 100%)",
            borderBottom: "1px solid var(--surface)",
          }}
        >
          <div>
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold"
              style={{ color: "var(--gold)", backgroundColor: "color-mix(in srgb, var(--gold) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--gold) 25%, transparent)" }}
            >
              GDPR · Allo Event AB
            </span>
            <h3 className="mt-3 text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
              Integritetspolicy
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Stäng"
            className="h-9 w-9 rounded-full inline-flex items-center justify-center transition-colors hover:scale-105"
            style={{ backgroundColor: "var(--background)", border: "1px solid var(--surface-line)", color: "var(--foreground)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-8 pb-8 pt-2 space-y-5 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          <p>
            Allo Event AB (org. nr 559547-6549, "vi", "oss") värnar om din personliga
            integritet. Denna policy beskriver hur vi behandlar personuppgifter i enlighet
            med EU:s dataskyddsförordning (GDPR).
          </p>

          <Section title="1. Personuppgiftsansvarig">
            Allo Event AB, Bjursätragatan 77, 124 63 Bandhagen, Sverige.
            Kontakt: jerry@alloevent.se
          </Section>

          <Section title="2. Vilka uppgifter vi samlar in">
            När du skickar in en bokningsförfrågan via vårt formulär behandlar vi:
            namn, företag, organisationsnummer, e-postadress, telefonnummer, ort,
            datum för uppdraget, antal personal samt fritextbeskrivning av ert behov.
          </Section>

          <Section title="3. Ändamål och rättslig grund">
            Uppgifterna behandlas för att kunna besvara din förfrågan, lämna offert
            och fullgöra ett eventuellt avtal med er (rättslig grund: avtal samt
            berättigat intresse). Marknadsföringsutskick sker endast efter aktivt
            samtycke från dig.
          </Section>

          <Section title="4. Lagring">
            Uppgifterna sparas så länge det behövs för det ändamål de samlades in –
            normalt upp till 24 månader efter senaste kontakt. Bokföringsmaterial
            sparas i 7 år enligt bokföringslagen.
          </Section>

          <Section title="5. Mottagare">
            Vi delar inte dina uppgifter med tredje part utöver våra IT- och
            e-postleverantörer (t.ex. Supabase, Resend, Netlify) som agerar
            personuppgiftsbiträden under tecknade biträdesavtal.
          </Section>

          <Section title="6. Dina rättigheter">
            Du har rätt att begära registerutdrag, rättelse, radering, begränsning
            av behandling, dataportabilitet samt invända mot behandling. Du har
            även rätt att lämna klagomål till Integritetsskyddsmyndigheten (IMY).
          </Section>

          <Section title="7. Säkerhet">
            All data lagras krypterad i transit (TLS) och i vila. Endast behörig
            personal har tillgång till våra system, med rollbaserad åtkomstkontroll
            och tvåfaktorsautentisering.
          </Section>

          <Section title="8. Cookies">
            Vår webbplats använder endast nödvändiga funktionscookies (språk- och
            temaval). Inga marknadsförings- eller spårningscookies sätts utan
            samtycke.
          </Section>

          <p className="text-xs pt-2" style={{ color: "var(--muted-foreground)" }}>
            Senast uppdaterad: {new Date().toLocaleDateString("sv-SE", { year: "numeric", month: "long" })}.
          </p>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full px-6 h-11 text-sm font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: "var(--gold)", color: "var(--background)" }}
            >
              Stäng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-[0.18em] font-semibold mb-1.5" style={{ color: "var(--gold)" }}>
        {title}
      </h4>
      <p>{children}</p>
    </div>
  );
}
