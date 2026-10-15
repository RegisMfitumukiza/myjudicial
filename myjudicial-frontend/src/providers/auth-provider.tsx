"use client";
import { createContext, useCallback, useContext, useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import type { PublicUser } from "@/features/auth/types";
import { getAuthMe, postAuthLogout } from "@/api/generated";
import { setCachedAuthToken } from "@/lib/api/client";
import { getSignOutRedirectUrl, handleAppSignOut } from "@/lib/auth-signout";

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
      const response = await getAuthMe();
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
          
          // Force sign out and redirect to appropriate login
          const targetUrl = getSignOutRedirectUrl({
            role: (session?.user as any)?.role ?? userData?.role,
          });
          await handleAppSignOut({ callbackUrl: targetUrl });
          
          return null;
        }
      }
      
      return userData;
    } catch (error) {
      console.error("Failed to fetch user data", error);
      throw error;
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
      const targetUrl = getSignOutRedirectUrl({
        role: (session?.user as any)?.role ?? user?.role,
      });

      // Clear local auth provider cache immediately
      queryClient.setQueryData<PublicUser | null>(AUTH_USER_QUERY_KEY, null);
      
      // Clear ALL React Query cache to prevent cross-user data leaks
      queryClient.clear();
      
      await handleAppSignOut({
        role: (session?.user as any)?.role ?? user?.role,
        callbackUrl: targetUrl,
      });
      
      toast.success("Signed out successfully.");
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Failed to sign out. Please try again.");
      
      // Even on error, try to clear local state
      if (typeof window !== "undefined") {
        sessionStorage.clear();
        queryClient.clear();
      }
    }
  }, [queryClient, session, user]);

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