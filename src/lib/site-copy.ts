// Texter för den nya startsidan (produktionsspråket), svenska och engelska.
// Samma nycklar måste finnas i båda språken. Partner- och kontakttexter som är
// oförändrade från den gamla sidan ligger kvar i src/lib/i18n.ts (translations).

import type { Lang } from "@/lib/i18n";

const sv = {
  nav: {
    event: "Eventproduktion",
    staffing: "Bemanning",
    cases: "Case",
    about: "Om oss",
    contact: "Kontakt",
    jobs: "Jobba hos oss",
    cta: "Kontakta oss",
    menuOpen: "Öppna meny",
    menuClose: "Stäng meny",
    langSwitch: "Switch to English",
    langLabel: "Byt språk",
    home: "Allo Event – startsida",
    admin: "Admin",
  },
  hero: {
    h1: "Vi bygger och bemannar event.",
    eventNo: "01",
    eventLabel: "Eventproduktion",
    eventLine: "Montrar, scener och rigg – från planritning till sista utlastning.",
    staffingNo: "02",
    staffingLabel: "Bemanning",
    staffingLine: "Erfaren personal till event, mässor, bygg och logistik – ofta med kort varsel.",
    go: "Gå till",
    caseCounter: "Case",
  },
  placeholder: {
    event: { code: "PLAN 01 / EVENT", word: "EVENT", note: "Inbärning 06:00 · Rigg · Scen", scale: "Skala 1:50" },
    staffing: { code: "PLAN 02 / CREW", word: "CREW", note: "Körschema 06:00–23:00", scale: "Pass · Roller · Antal" },
    caseCard: { code: "CASE", word: "ALLO", note: "Bild kommer", scale: "" },
  },
  cases: {
    no: "03",
    label: "Case",
    title: "Utvalda case",
    all: "Alla case",
    view: "Se case",
  },
  studio: {
    no: "04",
    label: "Allo Studio",
    line: "Designa montern i 3D och få ett tydligt underlag innan vi bygger.",
    cta: "Öppna Allo Studio",
  },
  partners: {
    no: "05",
    label: "Partners",
    title: "Samarbetspartners",
    alsoTitle: "Vi samarbetar även med",
    visit: "Besök",
  },
  about: {
    no: "06",
    label: "Om oss",
    title: "Skandinavisk enkelhet möter modern eventteknik",
    body:
      "Allo Event är ett växande svenskt event- och bemanningsföretag. Vi bygger montrar, scener och rigg, och vi bemannar event, mässor, bygg och logistik med personal som kan jobbet. Med Allo Studio, vårt eget 3D-verktyg, planerar och visualiserar vi montern innan vi bygger.",
    facts: [
      ["Bas", "Stockholm · uppdrag i hela Sverige"],
      ["Gör", "Eventproduktion · Bemanning"],
      ["Verktyg", "Allo Studio – eget 3D-verktyg för montrar"],
      ["Bolag", "Allo Event AB · Org.nr 559547-6549"],
    ] as [string, string][],
  },
  contact: {
    no: "07",
    label: "Kontakt",
    title: "Människorna bakom leveransen",
    ceo: "VD / Grundare",
    cto: "CTO / Medgrundare",
    ops: "Operations & Sales Manager",
    company: "Företagsuppgifter",
    org: "Org.nr",
    address: "Adress",
    cta: "Skicka förfrågan",
    ctaNote: "Formuläret finns på bemanningssidan.",
  },
  footer: {
    body: "Allo Event bygger, bemannar och genomför event och mässor – från enstaka personalbehov till större produktions- och logistikleveranser.",
    pages: "Sidor",
    contact: "Kontakt",
    staff: "Personal",
    staffLink: "Jobba hos oss",
    staffNote: "Logga in eller sök jobb på personal.alloevent.se",
    copyright: "© 2026 Allo Event AB. Alla rättigheter förbehållna.",
  },
};

export type SiteCopy = typeof sv;

const en: SiteCopy = {
  nav: {
    event: "Event production",
    staffing: "Staffing",
    cases: "Cases",
    about: "About us",
    contact: "Contact",
    jobs: "Work with us",
    cta: "Contact us",
    menuOpen: "Open menu",
    menuClose: "Close menu",
    langSwitch: "Byt till svenska",
    langLabel: "Switch language",
    home: "Allo Event – home",
    admin: "Admin",
  },
  hero: {
    h1: "We build and staff events.",
    eventNo: "01",
    eventLabel: "Event production",
    eventLine: "Booths, stages and rigging – from floor plan to final load-out.",
    staffingNo: "02",
    staffingLabel: "Staffing",
    staffingLine: "Experienced crew for events, fairs, builds and logistics – often at short notice.",
    go: "Go to",
    caseCounter: "Case",
  },
  placeholder: {
    event: { code: "PLAN 01 / EVENT", word: "EVENT", note: "Load-in 06:00 · Rig · Stage", scale: "Scale 1:50" },
    staffing: { code: "PLAN 02 / CREW", word: "CREW", note: "Run sheet 06:00–23:00", scale: "Shifts · Roles · Headcount" },
    caseCard: { code: "CASE", word: "ALLO", note: "Image coming", scale: "" },
  },
  cases: {
    no: "03",
    label: "Cases",
    title: "Selected cases",
    all: "All cases",
    view: "View case",
  },
  studio: {
    no: "04",
    label: "Allo Studio",
    line: "Design the booth in 3D and get a clear brief before we build.",
    cta: "Open Allo Studio",
  },
  partners: {
    no: "05",
    label: "Partners",
    title: "Partners",
    alsoTitle: "We also work with",
    visit: "Visit",
  },
  about: {
    no: "06",
    label: "About us",
    title: "Scandinavian simplicity meets modern event tech",
    body:
      "Allo Event is a growing Swedish event and staffing company. We build booths, stages and rigging, and we staff events, fairs, builds and logistics with crew who know the job. With Allo Studio, our own 3D tool, we plan and visualize the booth before we build it.",
    facts: [
      ["Base", "Stockholm · projects across Sweden"],
      ["Work", "Event production · Staffing"],
      ["Tool", "Allo Studio – our own 3D booth tool"],
      ["Company", "Allo Event AB · Org. no. 559547-6549"],
    ],
  },
  contact: {
    no: "07",
    label: "Contact",
    title: "The people behind the delivery",
    ceo: "CEO / Founder",
    cto: "CTO / Co-founder",
    ops: "Operations & Sales Manager",
    company: "Company details",
    org: "Org. no.",
    address: "Address",
    cta: "Send a request",
    ctaNote: "The form is on the staffing page.",
  },
  footer: {
    body: "Allo Event builds, staffs and delivers events and exhibitions – from individual staffing needs to larger production and logistics assignments.",
    pages: "Pages",
    contact: "Contact",
    staff: "Staff",
    staffLink: "Work with us",
    staffNote: "Log in or apply at personal.alloevent.se",
    copyright: "© 2026 Allo Event AB. All rights reserved.",
  },
};

export const siteCopy: Record<Lang, SiteCopy> = { sv, en };

export const SITE_LINKS = {
  event: "/eventproduktion",
  staffing: "/bemanning",
  cases: "/case",
  about: "#om-oss",
  contact: "#kontakt",
  request: "/bemanning#formular",
  portal: "https://personal.alloevent.se",
  studio: "https://studio.alloevent.se",
} as const;

export const CONTACT_PEOPLE = [
  { name: "Jerry Fors", roleKey: "ceo", email: "Jerry@alloevent.se", phone: "+46 70 223 96 80", tel: "tel:+46702239680" },
  { name: "Jacob Karlestedt", roleKey: "cto", email: "Jacob@alloevent.se", phone: "+46 70 730 96 27", tel: "tel:+46707309627" },
  { name: "Sanna Sigalit", roleKey: "ops", email: "Sanna@alloevent.se", phone: "+46 76 005 18 82", tel: "tel:+46760051882" },
] as const;

export const COMPANY = {
  name: "Allo Event AB",
  orgNo: "559547-6549",
  street: "Surbrunnsgatan 30",
  postal: "113 27 Stockholm",
} as const;
