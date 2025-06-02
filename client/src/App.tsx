import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./lib/auth-context";
import Navigation from "./components/navigation";
import Footer from "./components/footer";
import AuthModals from "./components/auth-modals";
import Home from "./pages/home";
import MailAutomation from "./pages/mail-automation";
import Admin from "./pages/admin";
import WaitingApproval from "./pages/waiting-approval";
import NotFound from "@/pages/not-found";

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgLight">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgLight flex flex-col">
      <Navigation />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          
          <Route path="/automation">
            {user?.approvalStatus === 'approved' ? (
              <MailAutomation />
            ) : user ? (
              <Redirect to="/waiting-approval" />
            ) : (
              <Redirect to="/" />
            )}
          </Route>
          
          <Route path="/admin">
            {user?.role === 'admin' ? (
              <Admin />
            ) : (
              <Redirect to="/" />
            )}
          </Route>
          
          <Route path="/waiting-approval">
            {user && user.approvalStatus === 'pending' ? (
              <WaitingApproval />
            ) : (
              <Redirect to="/" />
            )}
          </Route>
          
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <AuthModals />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
