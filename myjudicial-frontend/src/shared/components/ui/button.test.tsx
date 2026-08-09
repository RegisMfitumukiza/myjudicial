import { describe, it, expect, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { afterEach } from "vitest";

import { Button } from "@/shared/components/ui/button";

afterEach(cleanup);

describe("Button", () => {
  it("renders a button with data attributes", () => {
    render(<Button>Click</Button>);
    const button = screen.getByRole("button", { name: "Click" });
    expect(button).toHaveAttribute("data-slot", "button");
    expect(button).toHaveAttribute("data-variant", "default");
    expect(button).toHaveAttribute("data-size", "default");
  });

  it("applies variant and size data attributes", () => {
    render(
      <Button variant="outline" size="sm">
        Save
      </Button>
    );
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("data-variant", "outline");
    expect(button).toHaveAttribute("data-size", "sm");
  });

  it("includes base classes", () => {
    render(<Button>Click</Button>);
    const button = screen.getByRole("button", { name: "Click" });
    expect(button.className).toContain("inline-flex");
  });

  it("merges custom className via tailwind-merge", () => {
    render(<Button className="px-10">Click</Button>);
    const button = screen.getByRole("button", { name: "Click" });
    expect(button.className).toContain("px-10");
  });

  it("is disabled and blocks clicks", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Click
      </Button>
    );
    const button = screen.getByRole("button", { name: "Click" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders as child element when asChild is set", () => {
    render(
      <Button asChild>
        <a href="https://example.com">Browse</a>
      </Button>
    );
    const link = screen.getByRole("link", { name: "Browse" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("data-slot", "button");
  });
});
