import { lazy, Suspense, Component, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { WorkspaceProvider } from "@/hooks/useWorkspace";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CommandPalette } from "@/components/CommandPalette";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { FavoritesProvider } from "@/hooks/useFavorites";
import { TemplatesProvider } from "@/hooks/useTemplates";
import { TagsProvider } from "@/hooks/useTags";
import { NotificationsProvider } from "@/hooks/useNotifications";
import { PresenceProvider } from "@/hooks/usePresence";
import { CommentsProvider } from "@/hooks/useComments";
import { ShareLinksProvider } from "@/hooks/useShareLinks";
import { DeadlinesProvider } from "@/hooks/useDeadlines";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.tsx"));
const Join = lazy(() => import("./pages/Join.tsx"));
const DashboardLayout = lazy(() => import("./pages/dashboard/DashboardLayout.tsx"));
const Overview = lazy(() => import("./pages/dashboard/Overview.tsx"));
const Render = lazy(() => import("./pages/dashboard/Render.tsx"));
const Agent = lazy(() => import("./pages/dashboard/Agent.tsx"));
const Settings = lazy(() => import("./pages/dashboard/Settings.tsx"));
const Studio = lazy(() => import("./pages/dashboard/Studio.tsx"));
const MiniArchi = lazy(() => import("./pages/dashboard/MiniArchi.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));

// Error Boundary component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center text-[#F0EAE0]">
          <div className="text-center p-8">
            <h1 className="text-2xl mb-4 text-red-400">Une erreur est survenue</h1>
            <p className="text-[#F0EAE0]/60 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#C4A264] text-black rounded"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Loading fallback with skeleton
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0b0b0b] flex flex-col items-center justify-center text-[#F0EAE0]/60">
      <div className="w-12 h-12 border-4 border-[#C4A264]/20 border-t-[#C4A264] rounded-full animate-spin mb-4" />
      <div className="text-sm tracking-wider">Chargement...</div>
      <div className="mt-2 text-xs text-[#F0EAE0]/30">FORMA</div>
    </div>
  );
}

// Single QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <TemplatesProvider>
              <FavoritesProvider>
                <WorkspaceProvider>
                  <NotificationsProvider>
                    <PresenceProvider>
                      <TagsProvider>
                        <CommentsProvider>
                          <ShareLinksProvider>
                            <DeadlinesProvider>
                              <CommandPalette />
                              <OfflineIndicator />
                              <Suspense fallback={<PageLoader />}>
                                <Routes>
                                  <Route path="/" element={<Index />} />
                                  <Route path="/auth" element={<Auth />} />
                                  <Route path="/join/:token" element={<Join />} />
                                  <Route
                                    path="/onboarding"
                                    element={
                                      <ProtectedRoute requireOnboarding={false}>
                                        <Onboarding />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/dashboard/studio/:id"
                                    element={
                                      <ProtectedRoute>
                                        <Studio />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/dashboard"
                                    element={
                                      <ProtectedRoute>
                                        <DashboardLayout />
                                      </ProtectedRoute>
                                    }
                                  >
                                    <Route index element={<Overview />} />
                                    <Route path="render" element={<Render />} />
                                    <Route path="agent" element={<Agent />} />
                                    <Route path="settings" element={<Settings />} />
                                  </Route>
                                  <Route path="/admin" element={<Admin />} />
                                  <Route path="/archi" element={<MiniArchi />} />
                                  <Route path="*" element={<NotFound />} />
                                </Routes>
                              </Suspense>
                            </DeadlinesProvider>
                          </ShareLinksProvider>
                        </CommentsProvider>
                      </TagsProvider>
                    </PresenceProvider>
                  </NotificationsProvider>
                </WorkspaceProvider>
              </FavoritesProvider>
            </TemplatesProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;