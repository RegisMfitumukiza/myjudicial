import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo } from "./logo";

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, className, onClick }: any) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

describe("Logo", () => {
  it("renders with correct aspect-ratio dimensions and height style", () => {
    render(<Logo iconSize={24} />);

    const img = screen.getByRole("img", { name: "MyJudicial" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("width", "491");
    expect(img).toHaveAttribute("height", "351");
    expect(img).toHaveStyle({ height: "24px", width: "auto" });
  });

  it("renders text when iconOnly is false", () => {
    render(<Logo iconOnly={false} />);
    expect(screen.getByText("Myjudicial")).toBeInTheDocument();
  });

  it("hides text when iconOnly is true", () => {
    render(<Logo iconOnly={true} />);
    expect(screen.queryByText("Myjudicial")).not.toBeInTheDocument();
  });
});
