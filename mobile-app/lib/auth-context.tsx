import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { ensureProfile } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import type { AppRole, Complex, Profile } from "@/types/database";

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  complex: Complex | null;
  loading: boolean;
  isPending: boolean; // Mode Browse-Only
  isApproved: boolean;
  availableRoles: AppRole[];
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email atau kata sandi salah.";
  if (m.includes("email not confirmed")) return "Email belum diverifikasi. Cek kode OTP di email Anda.";
  if (m.includes("network")) return "Koneksi bermasalah. Coba lagi.";
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [complex, setComplex] = useState<Complex | null>(null);
  const [loading, setLoading] = useState(true);
  const activeRole = useAppStore((s) => s.activeRole);
  const setActiveRole = useAppStore((s) => s.setActiveRole);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      setComplex(null);
      return;
    }
    let { data: p } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (!p) {
      // Registrasi terputus sebelum profil dibuat → buat dari user_metadata
      try {
        p = await ensureProfile();
      } catch {
        p = null;
      }
    }
    setProfile((p as Profile | null) ?? null);
    if (p?.complex_id) {
      const { data: c } = await supabase
        .from("complexes")
        .select("*")
        .eq("id", p.complex_id)
        .maybeSingle();
      setComplex((c as Complex | null) ?? null);
    } else {
      setComplex(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      if (mounted) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      // Hindari await di dalam callback auth (cegah deadlock supabase-js)
      setTimeout(() => {
        loadProfile(next?.user.id);
      }, 0);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const isApproved = profile?.verification_status === "approved";
  const isPending = !!profile && !isApproved;

  const availableRoles = useMemo<AppRole[]>(() => {
    if (!profile || !isApproved) return ["customer"];
    const roles: AppRole[] = ["customer"];
    if (profile.is_seller) roles.push("seller");
    if (profile.is_courier) roles.push("courier");
    if (profile.is_admin || profile.is_super_admin) roles.push("admin");
    return roles;
  }, [profile, isApproved]);

  // Pastikan activeRole selalu valid terhadap role yang dimiliki
  useEffect(() => {
    if (!availableRoles.includes(activeRole)) setActiveRole("customer");
  }, [availableRoles, activeRole, setActiveRole]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { error: translateAuthError(error.message) };
    return {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    useAppStore.getState().clearCart();
    useAppStore.getState().setActiveRole("customer");
    setProfile(null);
    setComplex(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(session?.user.id);
  }, [loadProfile, session?.user.id]);

  const value: AuthState = {
    session,
    profile,
    complex,
    loading,
    isPending,
    isApproved,
    availableRoles,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}

export function homeRouteForRole(role: AppRole): string {
  switch (role) {
    case "seller":
      return "/(seller)";
    case "courier":
      return "/(courier)";
    case "admin":
      return "/(admin)";
    default:
      return "/(customer)";
  }
}
