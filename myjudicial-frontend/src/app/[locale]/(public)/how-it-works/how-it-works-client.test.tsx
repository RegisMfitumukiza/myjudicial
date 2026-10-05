import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IntlProvider } from "@/i18n/intl-provider";
import enMessages from "../../../../../messages/en.json";
import HowItWorksClient from "./how-it-works-client";

const messages = enMessages as never;
const hiw = enMessages.howItWorksPage;

const renderHowItWorks = (props: { initialTab?: "clients" | "advocates" } = {}) =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <HowItWorksClient {...props} />
    </IntlProvider>
  );

describe("HowItWorksClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders hero section with badge, title, and subtitle", () => {
    renderHowItWorks();

    expect(screen.getByText(hiw.hero.badge)).toBeInTheDocument();
    expect(screen.getByText(hiw.hero.title)).toBeInTheDocument();
    expect(screen.getByText(hiw.hero.subtitle)).toBeInTheDocument();
  });

  it("renders the 4-stage client journey by default", () => {
    renderHowItWorks();

    expect(screen.getByText(hiw.clientJourney.title)).toBeInTheDocument();
    expect(screen.getByText(hiw.clientJourney.step1.title)).toBeInTheDocument();
    expect(screen.getByText(hiw.clientJourney.step2.title)).toBeInTheDocument();
    expect(screen.getByText(hiw.clientJourney.step3.title)).toBeInTheDocument();
    expect(screen.getByText(hiw.clientJourney.step4.title)).toBeInTheDocument();
  });

  it("switches perspective to Advocates on tab click", () => {
    renderHowItWorks();

    const advocateTab = screen.getByRole("tab", { name: new RegExp(hiw.tabs.advocates, "i") });
    fireEvent.click(advocateTab);

    // Should now show advocate journey stages
    expect(screen.getByText(hiw.advocateJourney.title)).toBeInTheDocument();
    expect(screen.getByText(hiw.advocateJourney.step1.title)).toBeInTheDocument();
    expect(screen.getByText(hiw.advocateJourney.step2.title)).toBeInTheDocument();
    expect(screen.getByText(hiw.advocateJourney.step3.title)).toBeInTheDocument();
    expect(screen.getByText(hiw.advocateJourney.step4.title)).toBeInTheDocument();
  });

  it("supports keyboard arrow navigation on perspective tabs", () => {
    renderHowItWorks();

    const clientTab = screen.getByRole("tab", { name: new RegExp(hiw.tabs.clients, "i") });
    clientTab.focus();

    // Press ArrowRight to switch to Advocates
    fireEvent.keyDown(clientTab, { key: "ArrowRight" });
    expect(screen.getByText(hiw.advocateJourney.title)).toBeInTheDocument();

    const advocateTab = screen.getByRole("tab", { name: new RegExp(hiw.tabs.advocates, "i") });
    // Press ArrowLeft to switch back to Clients
    fireEvent.keyDown(advocateTab, { key: "ArrowLeft" });
    expect(screen.getByText(hiw.clientJourney.title)).toBeInTheDocument();
  });

  it("interactively toggles mic and camera in the consultation room demo dock", () => {
    renderHowItWorks();

    // Toggle Mic Mute
    const micBtn = screen.getByTitle(hiw.controls.micTitle);
    fireEvent.click(micBtn);

    // Mic should now be muted
    expect(screen.getByTitle(hiw.micMuted)).toBeInTheDocument();

    // Toggle Camera Off
    const camBtn = screen.getByTitle(hiw.controls.camTitle);
    fireEvent.click(camBtn);

    // Camera should now be off
    expect(screen.getByTitle(hiw.camOff)).toBeInTheDocument();
  });

  it("expands and collapses FAQ items and supports Expand All / Collapse All", () => {
    renderHowItWorks();

    // Initially FAQs are closed
    expect(screen.queryByText(hiw.faqs.clientA1)).not.toBeInTheDocument();

    // Click single FAQ
    const faq1Btn = screen.getByText(hiw.faqs.clientQ1);
    fireEvent.click(faq1Btn);
    expect(screen.getByText(hiw.faqs.clientA1)).toBeInTheDocument();

    // Click Expand All
    const expandAllBtn = screen.getByRole("button", { name: new RegExp(hiw.expandAll, "i") });
    fireEvent.click(expandAllBtn);

    // All answers should be visible
    expect(screen.getByText(hiw.faqs.clientA1)).toBeInTheDocument();
    expect(screen.getByText(hiw.faqs.clientA2)).toBeInTheDocument();
    expect(screen.getByText(hiw.faqs.clientA3)).toBeInTheDocument();

    // Click Collapse All
    const collapseAllBtn = screen.getByRole("button", { name: new RegExp(hiw.collapseAll, "i") });
    fireEvent.click(collapseAllBtn);

    expect(screen.queryByText(hiw.faqs.clientA1)).not.toBeInTheDocument();
    expect(screen.queryByText(hiw.faqs.clientA2)).not.toBeInTheDocument();
  });
});
