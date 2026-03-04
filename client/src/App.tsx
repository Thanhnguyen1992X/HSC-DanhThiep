import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Pages
import NameCard from "@/pages/public/NameCard";
import Login from "@/pages/admin/Login";
import Dashboard from "@/pages/admin/Dashboard";
import Employees from "@/pages/admin/Employees";

function Router() {
  return (
    <Switch>
      {/* Admin Routes */}
      <Route path="/admin/login" component={Login} />
      <Route path="/admin" component={Dashboard} />
      <Route path="/admin/employees" component={Employees} />
      
      {/* Public Name Card Route - Must be last to not catch /admin */}
      {/* allow optional language segment so /000022/en still renders the card */}
      <Route path="/:id/:lang?" component={NameCard} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
