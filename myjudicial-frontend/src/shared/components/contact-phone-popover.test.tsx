import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { IntlProvider } from "@/i18n/intl-provider";
import enMessages from "../../../messages/en.json";
import { ContactPhonePopover } from "./contact-phone-popover";

const messages = enMessages as never;

const renderPopover = (props = {}) =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <ContactPhonePopover phone="+250 788 312 456" {...props} />
    </IntlProvider>
  );

describe("ContactPhonePopover", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders trigger link with tel href and formatted phone number", () => {
    renderPopover();

    const trigger = screen.getByRole("link", { name: /\+250 788 312 456/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger.getAttribute("href")).toContain("tel:+250788312456");
  });

  it("opens popover with WhatsApp and Direct Call options on click", () => {
    renderPopover();

    const trigger = screen.getByRole("link", { name: /\+250 788 312 456/i });
    fireEvent.click(trigger);

    // Popover content should appear
    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Direct Call")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy number/i })).toBeInTheDocument();

    // Verify WhatsApp link format (clean digits only)
    const whatsappLink = screen.getByRole("link", { name: /whatsapp/i });
    expect(whatsappLink.getAttribute("href")).toBe("https://wa.me/250788312456");
    expect(whatsappLink.getAttribute("target")).toBe("_blank");

    // Verify Direct Call link format
    const directCallLink = screen.getByRole("link", { name: /direct call/i });
    expect(directCallLink.getAttribute("href")).toBe("tel:+250788312456");
  });

  it("copies phone number to clipboard when copy button is clicked", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    renderPopover();

    const trigger = screen.getByRole("link", { name: /\+250 788 312 456/i });
    fireEvent.click(trigger);

    const copyBtn = screen.getByRole("button", { name: /copy number/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith("+250 788 312 456");
    });

    await waitFor(() => {
      expect(screen.getByText("Copied to clipboard!")).toBeInTheDocument();
    });
  });
});
