import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { IntlProvider } from "@/i18n/intl-provider";
import enMessages from "../../../messages/en.json";
import { CareersHub } from "./careers-hub";
import type { SettingsData } from "@/features/settings/settings";
import { DEFAULTS } from "@/features/settings/settings";

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const mockSaveSettingsSection = vi.fn();
vi.mock("@/features/settings/api", () => ({
  fetchAdminSettings: vi.fn().mockResolvedValue({}),
  saveSettingsSection: (payload: unknown) => mockSaveSettingsSection(payload),
}));

describe("CareersHub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSettings: SettingsData = {
    ...DEFAULTS,
    careersHiringStatus: "ACTIVELY_HIRING",
    careersEmail: "careers@myjudicial.com",
    careersOpenRoles: [
      {
        id: "role_1",
        title: "Senior Legal Operations Counsel",
        department: "Legal Operations",
        location: "Kigali, Rwanda",
        type: "Full-time",
        applyUrl: "https://apply.myjudicial.com/legal-counsel",
        published: true,
      },
    ],
  };

  it("renders recruitment status, contact email, and active roles correctly", () => {
    render(
      <IntlProvider locale="en" messages={enMessages as never}>
        <CareersHub initialSettings={mockSettings} />
      </IntlProvider>
    );

    expect(
      screen.getByRole("heading", { name: /Careers & Talent Operations/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Actively Hiring")).toBeInTheDocument();
    expect(screen.getByDisplayValue("careers@myjudicial.com")).toBeInTheDocument();
    expect(screen.getByText("Senior Legal Operations Counsel")).toBeInTheDocument();
  });

  it("allows adding a new role and enables save button", async () => {
    render(
      <IntlProvider locale="en" messages={enMessages as never}>
        <CareersHub initialSettings={mockSettings} />
      </IntlProvider>
    );

    const addButtons = screen.getAllByRole("button", { name: /Add Position/i });
    fireEvent.click(addButtons[0]);

    // Save button should now be enabled because state is dirty
    const saveButton = screen.getByRole("button", { name: /Save Changes/i });
    expect(saveButton).toBeEnabled();
  });

  it("triggers save with updated hiring posture and roles", async () => {
    mockSaveSettingsSection.mockResolvedValueOnce({
      ...mockSettings,
      careersEmail: "talent@myjudicial.com",
    });

    const onSavedMock = vi.fn();

    render(
      <IntlProvider locale="en" messages={enMessages as never}>
        <CareersHub initialSettings={mockSettings} onSaved={onSavedMock} />
      </IntlProvider>
    );

    const emailInput = screen.getByDisplayValue("careers@myjudicial.com");
    fireEvent.change(emailInput, { target: { value: "talent@myjudicial.com" } });

    const saveButton = screen.getByRole("button", { name: /Save Changes/i });
    expect(saveButton).toBeEnabled();
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSaveSettingsSection).toHaveBeenCalledWith(
        expect.objectContaining({
          careersEmail: "talent@myjudicial.com",
        })
      );
    });
  });
});
