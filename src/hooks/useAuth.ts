import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "@/contexts/AuthContext";

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() harus dipanggil di dalam <AuthProvider>");
  return ctx;
}

export type {
  AuthContextValue,
  LoginCreds,
  RegisterPayload,
} from "@/contexts/AuthContext";
