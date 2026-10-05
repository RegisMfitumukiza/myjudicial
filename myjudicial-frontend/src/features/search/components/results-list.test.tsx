import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IntlProvider } from "@/i18n/intl-provider";
import enMessages from "@/../messages/en.json";
import { ResultsList } from "./results-list";
import type { Lawyer } from "../types";

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const mockLawyers: Lawyer[] = [
  {
    id: "lawyer-1",
    name: "Alice Karangwa",
    instantConsult: true,
    specialties: ["COMMERCIAL_LAW"],
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
  },
  {
    id: "lawyer-2",
    name: "Aline Mukamurera",
    instantConsult: true,
    specialties: ["CONTRACT_LAW"],
    specialtyLabel: "CONTRACT_LAW",
    verified: true,
    rating: 4.8,
    reviewCount: 16,
    startingRateRwf: 20000,
    yearsExperience: 6,
    distanceKm: 0.9,
    city: "Gasabo, Kigali",
    district: "Gasabo",
    officeAddress: "Kigali Heights",
    avatarUrl: null,
    online: false,
    languages: ["en", "fr"],
    lat: -1.953,
    lng: 30.092,
  },
];

describe("ResultsList Component", () => {
  it("renders lawyer cards and header count in split view mode", () => {
    render(
      <IntlProvider locale="en" messages={enMessages as never}>
        <ResultsList
          lawyers={mockLawyers}
          selectedId={null}
          onSelect={vi.fn()}
          isLoading={false}
          viewMode="split"
        />
      </IntlProvider>
    );

    expect(screen.getByText("Alice Karangwa")).toBeDefined();
    expect(screen.getByText("Aline Mukamurera")).toBeDefined();
    expect(screen.getByText(/2 lawyers found/i)).toBeDefined();
  });

  it("propagates selection and hover to callbacks", () => {
    const handleSelect = vi.fn();
    const handleHover = vi.fn();

    render(
      <IntlProvider locale="en" messages={enMessages as never}>
        <ResultsList
          lawyers={mockLawyers}
          selectedId={null}
          onSelect={handleSelect}
          onHover={handleHover}
          isLoading={false}
          viewMode="split"
        />
      </IntlProvider>
    );

    const cards = screen.getAllByRole("button");
    fireEvent.click(cards[0]);
    expect(handleSelect).toHaveBeenCalledWith("lawyer-1");

    fireEvent.mouseEnter(cards[1]);
    expect(handleHover).toHaveBeenCalledWith("lawyer-2");
  });

  it("renders active curation banner and triggers reset", () => {
    const handleReset = vi.fn();

    render(
      <IntlProvider locale="en" messages={enMessages as never}>
        <ResultsList
          lawyers={mockLawyers}
          selectedId={null}
          onSelect={vi.fn()}
          isLoading={false}
          viewMode="split"
          activeContext={{
            title: "Commercial Law Specialists",
            desc: "Showing curated advocates in Commercial Law",
            onReset: handleReset,
          }}
        />
      </IntlProvider>
    );

    expect(screen.getByText("Commercial Law Specialists")).toBeDefined();
    const resetBtn = screen.getByText(/reset/i);
    fireEvent.click(resetBtn);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
