import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

vi.mock("next-intl/navigation", () => ({
  createNavigation: () => ({
    Link: ({ href, children, prefetch: _prefetch, ...rest }: any) =>
      React.createElement("a", { href, ...rest }, children),
    redirect: vi.fn(),
    usePathname: () => "/en",
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    }),
  }),
}));
