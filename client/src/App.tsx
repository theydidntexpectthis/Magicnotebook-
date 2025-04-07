import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth-page";
import UserSettings from "@/pages/user-settings";
import { UserProvider } from "@/context/user-context";
import LandingPage from "@/components/landing-page";
import { AuthProvider } from "@/hooks/use-auth";
import ProtectedRoute from "@/components/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/app" component={Home} />
      <ProtectedRoute path="/settings" component={UserSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <Router />
        <Toaster />
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
