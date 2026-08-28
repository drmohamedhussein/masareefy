"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ADMIN_EMAIL } from "@/lib/constants";
import {
  getSessionRole,
  setSessionRole,
  verifyAdminPin,
  type SessionRole,
} from "@/lib/auth/session";
import { useExpenses } from "@/components/expenses/expenses-provider";
import { getExpenseRepository } from "@/lib/storage/get-repository";

interface AuthContextValue {
  sessionRole: SessionRole;
  isAdmin: boolean;
  loginAdmin: (pin: string) => Promise<boolean>;
  logoutAdmin: () => void;
  elevateIfAdminEmail: (email: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { profile, refresh } = useExpenses();
  const repo = useMemo(() => getExpenseRepository(), []);
  const [sessionRole, setRoleState] = useState<SessionRole>("user");

  useEffect(() => {
    setRoleState(getSessionRole());
  }, []);

  const loginAdmin = useCallback(
    async (pin: string) => {
      const profileEmail = profile?.email?.toLowerCase() ?? null;
      if (
        ADMIN_EMAIL &&
        profileEmail &&
        profileEmail !== ADMIN_EMAIL.toLowerCase()
      ) {
        return false;
      }

      const result = await verifyAdminPin(pin, profile?.adminPinHash ?? null);
      if (!result.ok) return false;

      await repo.updateProfile({
        ...(result.newHash ? { adminPinHash: result.newHash } : {}),
        role: "admin",
        email: ADMIN_EMAIL,
      });
      await refresh();

      setSessionRole("admin");
      setRoleState("admin");
      return true;
    },
    [profile?.adminPinHash, profile?.email, refresh, repo],
  );

  const elevateIfAdminEmail = useCallback(
    async (email: string | null) => {
      if (!email || !ADMIN_EMAIL || email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return;
      await repo.updateProfile({ email: ADMIN_EMAIL, role: "admin" });
      await refresh();
      setSessionRole("admin");
      setRoleState("admin");
    },
    [refresh, repo],
  );

  const logoutAdmin = useCallback(() => {
    setSessionRole("user");
    setRoleState("user");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      sessionRole,
      isAdmin: sessionRole === "admin",
      loginAdmin,
      logoutAdmin,
      elevateIfAdminEmail,
    }),
    [sessionRole, loginAdmin, logoutAdmin, elevateIfAdminEmail],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth يجب استخدامه داخل AuthProvider");
  }
  return ctx;
}
