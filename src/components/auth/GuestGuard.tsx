import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface GuestGuardProps {
  children: ReactNode;
}

export function GuestGuard({ children }: GuestGuardProps) {
  const { isAuthenticated, isBootstrapping, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isBootstrapping) return;
    if (isAuthenticated) {
      navigate(user?.onboardedAt ? "/dashboard/beranda" : "/onboarding", { replace: true });
    }
  }, [isAuthenticated, isBootstrapping, user, navigate]);

  if (isBootstrapping) return null;
  if (isAuthenticated) return null;
  return <>{children}</>;
}
