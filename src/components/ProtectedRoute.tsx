import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";

export const ProtectedRoute = ({
  children,
  requireOnboarding = true,
}: {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}) => {
  const { session, loading } = useAuth();
  const { onboardingCompleted, loading: wsLoading } = useWorkspace();
  const location = useLocation();

  if (loading || wsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0b0b]">
        <div className="text-[#F0EAE0]/40 text-sm">Chargement…</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (requireOnboarding && onboardingCompleted === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
