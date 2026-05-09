import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export type AccessStatus = "pending" | "approved" | "rejected";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  loading: boolean;
  accessStatus: AccessStatus | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error?: string; needsVerification?: boolean }>;
  resendVerification: (email: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Set listener BEFORE getSession (per Lovable Cloud guidance)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load access_status + admin role whenever the user changes
  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) {
      setAccessStatus(null);
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const [{ data: prof }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("access_status").eq("id", uid).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
      ]);
      if (cancelled) return;
      const status = (prof as { access_status?: AccessStatus } | null)?.access_status ?? "pending";
      setAccessStatus(status);
      setIsAdmin((roles ?? []).some((r) => r.role === "admin"));
    })();
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  const value: AuthCtx = {
    session,
    user: session?.user ?? null,
    loading,
    accessStatus,
    isAdmin,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message };
    },
    signUp: async (email, password, displayName) => {
      if (!isValidEmail(email)) {
        return { error: "Please enter a valid email address." };
      }
      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl, data: { display_name: displayName } },
      });
      if (error) return { error: error.message };
      // If email confirmation is required, there is no session yet.
      const needsVerification = !data.session;
      return { needsVerification };
    },
    resendVerification: async (email) => {
      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: redirectUrl },
      });
      return { error: error?.message };
    },
    signInWithGoogle: async () => {
      const redirect_uri = typeof window !== "undefined" ? window.location.origin : undefined;
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri,
        extraParams: { prompt: "select_account" },
      });
      if (result.error) {
        const msg = result.error instanceof Error ? result.error.message : String(result.error);
        return { error: msg };
      }
      return {};
    },
    sendPasswordReset: async (email) => {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      return { error: error?.message };
    },
    updatePassword: async (password) => {
      const { error } = await supabase.auth.updateUser({ password });
      return { error: error?.message };
    },
    signOut: async () => { await supabase.auth.signOut(); },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
