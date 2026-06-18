import * as React from "react";
import type { SafeUser } from "@/lib/types";
import { loginWithCode, loginWithPassword, logout, registerPassword, sendCode } from "@/server/auth";

type AuthContextValue = { user: SafeUser | null; setUser: (user: SafeUser | null) => void; requireLogin: () => boolean; loginCode: (phone: string, code: string) => Promise<void>; loginPassword: (phone: string, password: string) => Promise<void>; register: (phone: string, password: string, code?: string) => Promise<void>; sendCode: (phone: string) => void; logout: () => void };
const AuthContext = React.createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<SafeUser | null>(() => {
    const raw = localStorage.getItem("sfa_user");
    return raw ? JSON.parse(raw) as SafeUser : null;
  });
  React.useEffect(() => { if (user) localStorage.setItem("sfa_user", JSON.stringify(user)); else localStorage.removeItem("sfa_user"); }, [user]);
  const value: AuthContextValue = {
    user,
    setUser,
    requireLogin: () => Boolean(user),
    sendCode: (phone) => { sendCode(phone); },
    loginCode: async (phone, code) => { setUser((await loginWithCode(phone, code)).user); },
    loginPassword: async (phone, password) => { setUser((await loginWithPassword(phone, password)).user); },
    register: async (phone, password, code) => { setUser((await registerPassword(phone, password, code)).user); },
    logout: () => { logout(); setUser(null); },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const ctx = React.useContext(AuthContext); if (!ctx) throw new Error("AuthProvider missing"); return ctx; }
