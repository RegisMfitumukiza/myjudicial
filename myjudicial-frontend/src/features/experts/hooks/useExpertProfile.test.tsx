import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useExpertProfile, useExpertPhotoUrl } from "./useExpertProfile";
import * as nextAuth from "next-auth/react";
import * as generatedApi from "@/api/generated";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock("@/api/generated", () => ({
  getExpertsProfileMe: vi.fn(),
}));

describe("useExpertProfile and useExpertPhotoUrl", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("does NOT query expert profile when logged in as ADMIN", async () => {
    vi.mocked(nextAuth.useSession).mockReturnValue({
      data: {
        user: { role: "ADMIN", id: "admin-1" },
        accessToken: "admin-token",
      } as any,
      status: "authenticated",
      update: vi.fn(),
    });

    const { result } = renderHook(() => useExpertProfile(), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(generatedApi.getExpertsProfileMe).not.toHaveBeenCalled();
  });

  it("does NOT query photo url when logged in as ADMIN", async () => {
    vi.mocked(nextAuth.useSession).mockReturnValue({
      data: {
        user: { role: "ADMIN", id: "admin-1" },
        accessToken: "admin-token",
      } as any,
      status: "authenticated",
      update: vi.fn(),
    });

    const { result } = renderHook(() => useExpertPhotoUrl(), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(generatedApi.getExpertsProfileMe).not.toHaveBeenCalled();
  });

  it("queries expert profile when logged in as EXPERT", async () => {
    vi.mocked(nextAuth.useSession).mockReturnValue({
      data: {
        user: { role: "EXPERT", id: "expert-1" },
        accessToken: "expert-token",
      } as any,
      status: "authenticated",
      update: vi.fn(),
    });

    vi.mocked(generatedApi.getExpertsProfileMe).mockResolvedValue({
      status: 200,
      data: { data: { id: "profile-1" } },
    } as any);

    const { result } = renderHook(() => useExpertProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(generatedApi.getExpertsProfileMe).toHaveBeenCalledTimes(1);
  });
});
