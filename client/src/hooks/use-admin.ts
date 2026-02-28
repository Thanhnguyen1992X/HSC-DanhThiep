import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type AdminLoginInput } from "@shared/routes";
import { setAuthToken } from "@/lib/api";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function useAdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: AdminLoginInput) => {
      const validated = api.admin.login.input.parse(data);
      const res = await fetch(api.admin.login.path, {
        method: api.admin.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Invalid username or password");
        }
        throw new Error("Failed to login");
      }
      
      const json = await res.json();
      return api.admin.login.responses[200].parse(json);
    },
    onSuccess: (data) => {
      setAuthToken(data.token);
      toast({ title: "Login successful", description: "Welcome back." });
      setLocation("/admin");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Login Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });
}
