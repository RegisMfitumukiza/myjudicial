const apiKey = process.env.BREVO_API_KEY;

if (!apiKey) {
  throw new Error("BREVO_API_KEY is missing from environment variables");
}

export const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME ?? "MyJudicial";
export const EMAIL_FROM_ADDRESS =
  process.env.EMAIL_FROM_ADDRESS ?? "noreply@myjudicial.com";
export const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || "support@myjudicial.com";

/**
 * Minimal Brevo transactional email client using native fetch.
 * The @getbrevo/brevo v6 SDK has an ESM/Node.js incompatibility that causes
 * "fetch failed" errors at runtime, so we call the REST API directly.
 */
export const brevo = {
  transactionalEmails: {
    sendTransacEmail: async (payload: {
      to: { email: string; name?: string }[];
      sender: { email: string; name: string };
      subject: string;
      htmlContent?: string;
      textContent?: string;
      templateId?: number;
      params?: Record<string, unknown>;
      replyTo?: { email: string; name?: string };
    }): Promise<{ messageId?: string }> => {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey!,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Brevo API error ${response.status}: ${body}`);
      }

      const body = await response.json().catch(() => ({}));
      return { messageId: body.messageId };
    },
  },
};
