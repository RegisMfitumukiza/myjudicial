"use client";
import { createContext, useCallback, useContext, useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import type { PublicUser } from "@/features/auth/types";
import { getAuthMe, postAuthLogout } from "@/api/generated";

function getLocale(): string {
  if (typeof window === "undefined") return "en";
  const match = window.location.pathname.match(/^\/(en|fr|rw)(\/|$)/);
  return match ? match[1] : "en";
}

function signinUrl(): string {
  return `/${getLocale()}/sign-in`;
}

type AuthContextType = {
  user: PublicUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AUTH_USER_QUERY_KEY = ["auth", "me"] as const;
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  const accessToken = (session as Record<string, unknown> | null)?.accessToken as string | undefined;

  const fetchCurrentUser = useCallback(async (): Promise<PublicUser | null> => {
    if (!accessToken) return null;

    try {
      const response = await getAuthMe({
        headers: { Authorization: `Bearer ${accessToken}` },
      } as RequestInit);
      const body = response as any;
      const userData = body?.data?.data ?? body?.data ?? null;
      
      // CRITICAL: Detect user mismatch between NextAuth session and backend
      if (userData && session?.user) {
        const sessionUserId = (session.user as any).id;
        const sessionUserRole = (session.user as any).role;
        
        // If user ID or role doesn't match, we have stale session data
        if (userData.id !== sessionUserId || userData.role !== sessionUserRole) {
          console.error("CRITICAL: Session/backend user mismatch detected!", {
            backendUser: { id: userData.id, role: userData.role },
            sessionUser: { id: sessionUserId, role: sessionUserRole }
          });
          
          // Force immediate logout to prevent cross-user data leaks
          toast.error("Session mismatch detected. Signing out for security.");
          
          // Clear all auth state
          if (typeof window !== "undefined") {
            sessionStorage.clear();
            localStorage.clear();
          }
          queryClient.clear();
          
          // Force sign out and redirect to login
          await signOut({ redirect: false });
          window.location.href = signinUrl();
          
          return null;
        }
      }
      
      return userData;
    } catch (error) {
      console.error("Failed to fetch user data", error);
      return null;
    }
  }, [accessToken, session, queryClient]);

  const { data: user = null, isLoading, refetch } = useQuery<PublicUser | null>({
    queryKey: [...AUTH_USER_QUERY_KEY, accessToken],
    queryFn: fetchCurrentUser,
    enabled: status === "authenticated" && !!accessToken,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Invalidate expert search cache when the user becomes available
  useEffect(() => {
    if (user) {
      queryClient.invalidateQueries({ queryKey: ["experts"] });
    }
  }, [user, queryClient]);
  const refreshUser = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const logout = useCallback(async () => {
    try {
      // Clear backend session first
      try {
        await postAuthLogout({
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        } as RequestInit);
      } catch (logoutError) {
        console.warn("Backend logout failed, clearing local session anyway", logoutError);
        // Continue with local cleanup regardless of backend error
      }
      
      // CRITICAL: Clear ALL stored tokens and session data to prevent cross-user contamination
      if (typeof window !== "undefined") {
        // Clear all possible token storage locations
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        
        // Clear all session storage (nuclear option to prevent leaks)
        sessionStorage.clear();
        
        // Optionally clear localStorage (commented out to preserve user preferences)
        // localStorage.clear();
      }

      // Clear local auth provider cache immediately
      queryClient.setQueryData<PublicUser | null>(AUTH_USER_QUERY_KEY, null);
      
      // Clear ALL React Query cache to prevent cross-user data leaks
      queryClient.clear();
      
      // Sign out from NextAuth (this should also clear NextAuth cookies)
      await signOut({ redirect: false, callbackUrl: signinUrl() });
      
      toast.success("Signed out successfully.");
      
      // Force navigation to ensure clean state
      window.location.href = signinUrl();
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Failed to sign out. Please try again.");
      
      // Even on error, try to clear local state
      if (typeof window !== "undefined") {
        sessionStorage.clear();
        queryClient.clear();
      }
    }
  }, [queryClient, accessToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}