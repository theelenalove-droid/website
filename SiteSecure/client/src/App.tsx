import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/useAuth";
import Navigation from "./components/navigation";
import Home from "./pages/home";
import About from "./pages/about";
import Work from "./pages/work";
import Stories from "./pages/stories";
import Recognition from "./pages/recognition";
import Donate from "./pages/donate";
import Contact from "./pages/contact";
import AdminSecretPortal from "./pages/admin-secret-portal";
import OwnerSecretPortal from "./pages/owner-secret-portal";
import AdminDashboard from "./pages/admin-dashboard";
import OwnerDashboard from "./pages/owner-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public pages */}
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/work" component={Work} />
      <Route path="/stories" component={Stories} />
      <Route path="/recognition" component={Recognition} />
      <Route path="/donate" component={Donate} />
      <Route path="/contact" component={Contact} />
      
      {/* Secret portal routes */}
      <Route path="/admin-secret-portal" component={AdminSecretPortal} />
      <Route path="/owner-secret-portal" component={OwnerSecretPortal} />
      
      {/* Protected dashboard routes */}
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/owner-dashboard" component={OwnerDashboard} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Navigation />
            <main>
              <Router />
            </main>
            <Toaster />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
