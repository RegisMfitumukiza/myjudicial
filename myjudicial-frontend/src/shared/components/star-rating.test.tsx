import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { IntlProvider } from "@/i18n/intl-provider";
import enMessages from "../../../messages/en.json";
import frMessages from "../../../messages/fr.json";
import rwMessages from "../../../messages/rw.json";
import { StarRating } from "@/shared/components/star-rating";

afterEach(cleanup);

function renderWithIntl(ui: React.ReactElement, locale = "en") {
  const messages =
    locale === "fr" ? frMessages : locale === "rw" ? rwMessages : enMessages;
  return render(
    <IntlProvider locale={locale} messages={messages as any}>
      {ui}
    </IntlProvider>
  );
}

describe("StarRating", () => {
  it("renders rating with one decimal place", () => {
    renderWithIntl(<StarRating rating={4.5} />);
    expect(screen.getByText("4.5")).toBeInTheDocument();
  });

  it("renders integer rating with one decimal place", () => {
    renderWithIntl(<StarRating rating={5} />);
    expect(screen.getByText("5.0")).toBeInTheDocument();
  });

  it("shows review count in parentheses", () => {
    renderWithIntl(<StarRating rating={4} reviewCount={128} />);
    expect(screen.getByText("(128)")).toBeInTheDocument();
  });

  it("hides count when showCount is false", () => {
    renderWithIntl(<StarRating rating={4} reviewCount={128} showCount={false} />);
    expect(screen.queryByText("(128)")).not.toBeInTheDocument();
  });

  it("shows New badge in English when there are no reviews", () => {
    renderWithIntl(<StarRating rating={null} />, "en");
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("shows Nouveau badge in French when there are no reviews", () => {
    renderWithIntl(<StarRating rating={null} />, "fr");
    expect(screen.getByText("Nouveau")).toBeInTheDocument();
  });

  it("shows Mushya badge in Kinyarwanda when there are no reviews", () => {
    renderWithIntl(<StarRating rating={null} />, "rw");
    expect(screen.getByText("Mushya")).toBeInTheDocument();
  });

  it("prioritizes explicit newBadgeLabel prop over default translation", () => {
    renderWithIntl(<StarRating rating={null} newBadgeLabel="Special" />, "fr");
    expect(screen.getByText("Special")).toBeInTheDocument();
    expect(screen.queryByText("Nouveau")).not.toBeInTheDocument();
  });

  it("renders a star icon when rated", () => {
    const { container } = renderWithIntl(<StarRating rating={4} />);
    expect(container.querySelectorAll("svg").length).toBe(1);
  });

  it("renders empty when unrated and showNewBadge is false", () => {
    const { container } = renderWithIntl(
      <StarRating rating={null} showNewBadge={false} />
    );
    expect(screen.queryByText("New")).not.toBeInTheDocument();
    expect(container.querySelectorAll("svg").length).toBe(0);
  });

  it("applies custom className", () => {
    const { container } = renderWithIntl(
      <StarRating rating={4} className="custom-class" />
    );
    expect(container.firstElementChild).toHaveClass("custom-class");
  });
});
