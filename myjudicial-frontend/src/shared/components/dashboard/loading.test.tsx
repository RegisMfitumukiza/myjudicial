import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import {
  LoadingSpinner,
  SkeletonCard,
  SkeletonList,
  CardGridSkeleton,
  TableSectionSkeleton,
  DetailPageSkeleton,
  FormSectionSkeleton,
  CalendarSkeleton,
  PortalShellSkeleton,
  DashboardSkeleton,
  TableSkeleton,
  AnalyticsSkeleton,
} from "@/shared/components/dashboard/loading";
import { Skeleton } from "@/shared/components/ui/skeleton";

afterEach(cleanup);

describe("Loading Primitives & Design System", () => {
  describe("Skeleton base component", () => {
    it("renders with animate-pulse and motion-reduce:animate-none", () => {
      const { container } = render(<Skeleton className="h-4 w-20" />);
      const el = container.querySelector('[data-slot="skeleton"]');
      expect(el).toBeDefined();
      expect(el?.className).toContain("animate-pulse");
      expect(el?.className).toContain("motion-reduce:animate-none");
    });
  });

  describe("LoadingSpinner", () => {
    it("renders accessible role=status and aria-busy=true", () => {
      render(<LoadingSpinner label="Please wait..." />);
      const statusEl = screen.getByRole("status");
      expect(statusEl).toHaveAttribute("aria-busy", "true");
      expect(statusEl).toHaveTextContent("Please wait...");
    });
  });

  describe("SkeletonCard", () => {
    it("renders card skeleton with role=status and sr-only label", () => {
      render(<SkeletonCard />);
      const statusEl = screen.getByRole("status", { name: "Loading card" });
      expect(statusEl).toHaveAttribute("aria-busy", "true");
    });
  });

  describe("SkeletonList", () => {
    it("renders correct count of skeleton items with role=status", () => {
      const { container } = render(<SkeletonList count={5} />);
      const statusEl = screen.getByRole("status", { name: "Loading list" });
      expect(statusEl).toHaveAttribute("aria-busy", "true");
      const items = container.querySelectorAll('[data-slot="skeleton"]');
      expect(items.length).toBe(5);
    });
  });

  describe("CardGridSkeleton", () => {
    it("renders grid columns and count with role=status", () => {
      const { container } = render(<CardGridSkeleton count={4} columns={2} />);
      const statusEl = screen.getByRole("status", { name: "Loading items" });
      expect(statusEl).toHaveAttribute("aria-busy", "true");
      expect(statusEl.className).toContain("md:grid-cols-2");
    });
  });

  describe("TableSectionSkeleton", () => {
    it("renders dual mobile and desktop placeholders with accessible attributes", () => {
      const { container } = render(<TableSectionSkeleton rows={4} columns={5} />);
      const statusEl = screen.getByRole("status", { name: "Loading table data" });
      expect(statusEl).toHaveAttribute("aria-busy", "true");

      // Verify mobile container exists with md:hidden
      const mobileContainer = container.querySelector(".md\\:hidden");
      expect(mobileContainer).not.toBeNull();

      // Verify desktop container exists with hidden md:block
      const desktopContainer = container.querySelector(".hidden.md\\:block");
      expect(desktopContainer).not.toBeNull();
    });
  });

  describe("DetailPageSkeleton", () => {
    it("renders detail page layout skeleton", () => {
      render(<DetailPageSkeleton />);
      const statusEl = screen.getByRole("status", { name: "Loading details" });
      expect(statusEl).toHaveAttribute("aria-busy", "true");
      expect(statusEl.className).toContain("motion-reduce:animate-none");
    });
  });

  describe("FormSectionSkeleton", () => {
    it("renders form section with configurable fields", () => {
      render(<FormSectionSkeleton fields={6} />);
      const statusEl = screen.getByRole("status", { name: "Loading form" });
      expect(statusEl).toHaveAttribute("aria-busy", "true");
    });
  });

  describe("CalendarSkeleton", () => {
    it("renders 7-column calendar grid placeholder", () => {
      const { container } = render(<CalendarSkeleton />);
      const statusEl = screen.getByRole("status", { name: "Loading calendar" });
      expect(statusEl).toHaveAttribute("aria-busy", "true");
      const grid = container.querySelector(".grid-cols-7");
      expect(grid).not.toBeNull();
    });
  });

  describe("PortalShellSkeleton", () => {
    it("renders complete portal shell with sidebar and top header", () => {
      const { container } = render(<PortalShellSkeleton />);
      const statusEl = screen.getByRole("status", { name: "Loading workspace" });
      expect(statusEl).toHaveAttribute("aria-busy", "true");
      // Check sidebar and header
      expect(container.querySelector("aside")).not.toBeNull();
      expect(container.querySelector("header")).not.toBeNull();
    });
  });

  describe("DashboardSkeleton & TableSkeleton", () => {
    it("renders dashboard skeleton with motion-reduce:animate-none", () => {
      render(<DashboardSkeleton />);
      const statusEl = screen.getByRole("status", { name: "Loading dashboard" });
      expect(statusEl.className).toContain("motion-reduce:animate-none");
    });

    it("renders full-page table skeleton with stats cards and filter bar", () => {
      render(<TableSkeleton statsCount={4} columns={6} rows={5} />);
      const statusEl = screen.getByRole("status", { name: "Loading table page" });
      expect(statusEl.className).toContain("motion-reduce:animate-none");
    });

    it("renders analytics skeleton", () => {
      render(<AnalyticsSkeleton />);
      const statusEl = screen.getByRole("status", { name: "Loading analytics" });
      expect(statusEl.className).toContain("motion-reduce:animate-none");
    });
  });
});
