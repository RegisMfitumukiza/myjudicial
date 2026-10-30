import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo } from "./logo";

let mockSettings = {
  platformName: "Myjudicial",
  brandLogoUrl: "",
};

vi.mock("@/features/settings/hooks/useSocialLinks", () => ({
  usePlatformSettings: () => ({
    settings: mockSettings,
    isLoading: false,
  }),
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, className, onClick }: any) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

describe("Logo", () => {
  beforeEach(() => {
    mockSettings = {
      platformName: "Myjudicial",
      brandLogoUrl: "",
    };
  });

  it("renders with correct aspect-ratio dimensions and height style", () => {
    render(<Logo iconSize={24} />);

    const img = screen.getByRole("img", { name: "Myjudicial" });
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

  it("dynamically renders custom uploaded logo and custom platform name from settings", () => {
    mockSettings = {
      platformName: "MyJudicial Rwanda Bar Edition",
      brandLogoUrl: "https://storage.myjudicial.com/custom-logo.svg",
    };

    render(<Logo iconOnly={false} iconSize={32} />);
    
    expect(screen.getByText("MyJudicial Rwanda Bar Edition")).toBeInTheDocument();
    const img = screen.getByRole("img", { name: "MyJudicial Rwanda Bar Edition" });
    expect(img).toHaveAttribute("src", "https://storage.myjudicial.com/custom-logo.svg");
  });
});
