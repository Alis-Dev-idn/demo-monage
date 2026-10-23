import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingWizard } from "@/components/auth/OnboardingWizard";
import { useAuth } from "@/hooks/useAuth";

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isBootstrapping } = useAuth();

  useEffect(() => {
    if (isBootstrapping) return;
    if (!isAuthenticated) {
      navigate("/auth", { replace: true });
    } else if (user?.onboardedAt) {
      navigate("/dashboard/beranda", { replace: true });
    }
  }, [isAuthenticated, isBootstrapping, user, navigate]);

  if (isBootstrapping || !isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-4 py-10">
      <div className="mx-auto mb-6 max-w-2xl text-center">
        <h1 className="text-2xl font-bold text-emerald-900">
          Yuk siapkan Monage Anda
        </h1>
        <p className="text-sm text-emerald-800/70">
          Tiga langkah cepat untuk mulai mengelola uang dengan tenang.
        </p>
      </div>
      <OnboardingWizard
        onComplete={() => navigate("/dashboard/beranda", { replace: true })}
        onSkip={() => navigate("/dashboard/beranda", { replace: true })}
      />
    </main>
  );
};

export default OnboardingPage;
