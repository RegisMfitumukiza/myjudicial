import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { IntlProvider } from "@/i18n/intl-provider";
import enMessages from "../../../messages/en.json";
import { ContactEmailPopover } from "./contact-email-popover";

const messages = enMessages as never;

const renderPopover = (props = {}) =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <ContactEmailPopover
        email="support@myjudicial.com"
        subject="Test Subject"
        body="Test Body"
        {...props}
      />
    </IntlProvider>
  );

describe("ContactEmailPopover", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders trigger link with mailto href", () => {
    renderPopover();

    const trigger = screen.getByRole("link", { name: /support@myjudicial.com/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger.getAttribute("href")).toContain("mailto:support@myjudicial.com");
  });

  it("opens popover with Gmail, Outlook, and Default App on click", () => {
    renderPopover();

    const trigger = screen.getByRole("link", { name: /support@myjudicial.com/i });
    fireEvent.click(trigger);

    // Dialog content should appear
    expect(screen.getByText("Gmail (Web)")).toBeInTheDocument();
    expect(screen.getByText("Outlook (Web)")).toBeInTheDocument();
    expect(screen.getByText("Default Mail App")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy email address/i })).toBeInTheDocument();

    // Verify Gmail URL
    const gmailLink = screen.getByRole("link", { name: /gmail \(web\)/i });
    expect(gmailLink.getAttribute("href")).toContain("mail.google.com");
    expect(gmailLink.getAttribute("href")).toContain("support%40myjudicial.com");
    expect(gmailLink.getAttribute("target")).toBe("_blank");

    // Verify Outlook URL
    const outlookLink = screen.getByRole("link", { name: /outlook \(web\)/i });
    expect(outlookLink.getAttribute("href")).toContain("outlook.live.com");
    expect(outlookLink.getAttribute("target")).toBe("_blank");
  });

  it("copies email to clipboard on copy button click", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    renderPopover();

    const trigger = screen.getByRole("link", { name: /support@myjudicial.com/i });
    fireEvent.click(trigger);

    const copyBtn = screen.getByRole("button", { name: /copy email address/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith("support@myjudicial.com");
    });

    await waitFor(() => {
      expect(screen.getByText("Copied to clipboard!")).toBeInTheDocument();
    });
  });
});
