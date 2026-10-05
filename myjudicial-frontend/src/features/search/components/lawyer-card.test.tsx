import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IntlProvider } from "@/i18n/intl-provider";
import enMessages from "@/../messages/en.json";
import { LawyerCard } from "./lawyer-card";
import type { Lawyer } from "../types";

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const mockLawyer: Lawyer = {
  id: "lawyer-1",
  name: "Alice Karangwa",
  instantConsult: true,
  specialties: ["COMMERCIAL_LAW", "CONTRACT_LAW"],
  specialtyLabel: "COMMERCIAL_LAW",
  verified: true,
  rating: 4.9,
  reviewCount: 24,
  startingRateRwf: 22000,
  yearsExperience: 8,
  distanceKm: 0.7,
  city: "Nyarugenge, Kigali",
  district: "Nyarugenge",
  officeAddress: "Centenary House",
  avatarUrl: null,
  online: true,
  languages: ["en", "rw"],
  lat: -1.9452,
  lng: 30.0611,
};

function renderCard(props: {
  lawyer?: Lawyer;
  selected?: boolean;
  onClick?: () => void;
  onHover?: (id: string | null) => void;
}) {
  return render(
    <IntlProvider locale="en" messages={enMessages as never}>
      <LawyerCard
        lawyer={props.lawyer ?? mockLawyer}
        selected={props.selected}
        onClick={props.onClick}
        onHover={props.onHover}
      />
    </IntlProvider>
  );
}

describe("LawyerCard Component", () => {
  it("renders advocate name, rating, verified badge, and consultation rate", () => {
    renderCard({});

    expect(screen.getByText("Alice Karangwa")).toBeDefined();
    expect(screen.getByText("22,000")).toBeDefined();
    expect(screen.getByText("4.9")).toBeDefined();
    expect(screen.getByText("AK")).toBeDefined();
    expect(screen.getByText(/Book Consult/i)).toBeDefined();
    expect(screen.getByText(/View Profile/i)).toBeDefined();
  });

  it("triggers onClick when the card is clicked", () => {
    const handleClick = vi.fn();
    renderCard({ onClick: handleClick });

    const card = screen.getByRole("button");
    fireEvent.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("triggers onHover with lawyer id on mouse enter and null on mouse leave", () => {
    const handleHover = vi.fn();
    const handleClick = vi.fn();
    renderCard({ onClick: handleClick, onHover: handleHover });

    const card = screen.getByRole("button");
    fireEvent.mouseEnter(card);
    expect(handleHover).toHaveBeenCalledWith("lawyer-1");

    fireEvent.mouseLeave(card);
    expect(handleHover).toHaveBeenCalledWith(null);
  });

  it("applies active selected styling when selected is true", () => {
    const { container } = renderCard({ selected: true });
    const cardEl = container.firstChild as HTMLElement;

    expect(cardEl.className).toContain("border-brand-dark");
    expect(cardEl.className).toContain("ring-2");
  });
});
