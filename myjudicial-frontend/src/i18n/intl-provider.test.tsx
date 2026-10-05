import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { useTranslations, useTimeZone } from "next-intl";
import { IntlProvider } from "./intl-provider";

function TestConsumer() {
  const t = useTranslations("expertDashboard_auth-shell");
  const timeZone = useTimeZone();

  return (
    <div>
      <span data-testid="timezone">{timeZone}</span>
      <span data-testid="copyright">{t("copyright")}</span>
    </div>
  );
}

describe("IntlProvider", () => {
  const sampleMessages = {
    expertDashboard_auth_shell: {
      copyright: "All rights reserved",
    },
    // Also include dot/hyphen matching next-intl keys
    "expertDashboard_auth-shell": {
      copyright: "All rights reserved",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
    },
  };

  it("provides default timeZone without throwing ENVIRONMENT_FALLBACK", () => {
    render(
      <IntlProvider locale="en" messages={sampleMessages}>
        <TestConsumer />
      </IntlProvider>
    );

    expect(screen.getByTestId("timezone").textContent).toBe("Africa/Kigali");
    expect(screen.getByTestId("copyright").textContent).toBe("All rights reserved");
  });

  it("allows custom timeZone to be passed", () => {
    render(
      <IntlProvider locale="en" messages={sampleMessages} timeZone="UTC">
        <TestConsumer />
      </IntlProvider>
    );

    expect(screen.getByTestId("timezone").textContent).toBe("UTC");
  });
});
