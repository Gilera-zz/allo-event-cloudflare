import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function readEnv(key: string): string | undefined {
  const viteVal = (import.meta.env as Record<string, string | undefined>)[key];
  if (viteVal) return viteVal;
  if (typeof process !== "undefined" && process.env) {
    return process.env[key] || process.env[key.replace(/^VITE_/, "")];
  }
  return undefined;
}

// Publishable (client-safe) credentials for the project's hosted backend.
// Safe to keep in source: these keys are public by design and protected by RLS.
const DEFAULT_SUPABASE_URL = "https://qbgfacgpehqgeuxhxrus.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_1gcxIzSegBkhJuhMw2QJeA_r5urYSMW";

const SUPABASE_URL = readEnv("VITE_SUPABASE_URL") || DEFAULT_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  readEnv("VITE_SUPABASE_PUBLISHABLE_KEY") ||
  readEnv("VITE_SUPABASE_ANON_KEY") ||
  DEFAULT_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigError: string | null = (() => {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY env var.";
  }
  if (!SUPABASE_URL.startsWith("https://")) {
    return "VITE_SUPABASE_URL must start with https://";
  }
  return null;
})();

function makeFallbackClient(): SupabaseClient {
  const err = new Error(supabaseConfigError ?? "Supabase client not initialized");
  const noopSubscription = { unsubscribe: () => {} };
  const stub = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: noopSubscription } }),
      signInWithPassword: async () => ({ data: null, error: err }),
      signInWithOAuth: async () => ({ data: null, error: err }),
      signUp: async () => ({ data: null, error: err }),
      signOut: async () => ({ error: null }),
    },
    from: () => {
      const builder: any = {
        select: () => builder,
        insert: () => builder,
        update: () => builder,
        delete: () => builder,
        upsert: () => builder,
        eq: () => builder,
        neq: () => builder,
        order: () => builder,
        limit: () => builder,
        single: async () => ({ data: null, error: err }),
        maybeSingle: async () => ({ data: null, error: err }),
        then: (resolve: (v: unknown) => unknown) =>
          Promise.resolve({ data: null, error: err }).then(resolve),
      };
      return builder;
    },
    rpc: async () => ({ data: null, error: err }),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: err }),
        download: async () => ({ data: null, error: err }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => noopSubscription }),
      subscribe: () => noopSubscription,
      unsubscribe: () => {},
    }),
    removeChannel: () => {},
  };
  return stub as unknown as SupabaseClient;
}

let _supabase: SupabaseClient | undefined;

function getClient(): SupabaseClient {
  if (_supabase) return _supabase;
  if (supabaseConfigError) {
    console.error("[supabase] " + supabaseConfigError + " Using inert fallback client.");
    _supabase = makeFallbackClient();
    return _supabase;
  }
  try {
    _supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "allo-auth",
      },
    });
  } catch (e) {
    console.error("[supabase] createClient threw, using fallback:", e);
    _supabase = makeFallbackClient();
  }
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
