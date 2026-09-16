const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

/** Build the base URL for email links */
export const getFrontendUrl = (): string => FRONTEND_URL;

/** Build a full URL from a path */
export const buildUrl = (path: string): string => `${FRONTEND_URL}${path}`;

/**
 * Shared email components used across all templates.
 */

/** CTA Button */
export const button = (label: string, url: string, variant?: "primary" | "danger" | "success"): string => {
  const colors = {
    primary: { bg: "#1d4ed8", hover: "#1e40af" },
    danger: { bg: "#dc2626", hover: "#b91c1c" },
    success: { bg: "#15803d", hover: "#14532d" },
  };
  const c = colors[variant || "primary"];
  return `
    <tr>
      <td style="padding:20px 0;text-align:center;">
        <a href="${url}" target="_blank"
           style="display:inline-block;background:${c.bg};color:#ffffff;padding:14px 32px;
                  border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;
                  letter-spacing:0.3px;">
          ${label}
        </a>
      </td>
    </tr>`;
};

/** Info table row (label + value) */
export const tableRow = (label: string, value: string, options?: { bold?: boolean; color?: string }): string => `
  <tr>
    <td style="color:#64748b;padding:10px 16px;font-size:14px;white-space:nowrap;">${label}</td>
    <td style="font-weight:${options?.bold ? "600" : "400"};color:${options?.color || "#1e293b"};padding:10px 16px;font-size:14px;text-align:right;">
      ${value}
    </td>
  </tr>`;

/** Styled data table (wraps rows in a card) */
export const dataTable = (rows: string): string => `
  <tr>
    <td style="padding:16px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
             style="background-color:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
        ${rows}
      </table>
    </td>
  </tr>`;

/** Alert box (info, warning, error, success) */
export const alertBox = (content: string, variant?: "info" | "warning" | "error" | "success"): string => {
  const styles = {
    info: { bg: "#eff6ff", border: "#3b82f6", text: "#1e40af" },
    warning: { bg: "#fffbeb", border: "#f59e0b", text: "#92400e" },
    error: { bg: "#fef2f2", border: "#dc2626", text: "#991b1b" },
    success: { bg: "#f0fdf4", border: "#15803d", text: "#166534" },
  };
  const s = styles[variant || "info"];
  return `
    <tr>
      <td style="padding:16px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
               style="background-color:${s.bg};border-left:4px solid ${s.border};border-radius:4px;">
          <tr>
            <td style="padding:16px;color:${s.text};font-size:14px;line-height:1.6;">
              ${content}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
};

/** Section heading */
export const heading = (text: string, level?: "h1" | "h2" | "h3"): string => {
  const sizes = { h1: "24px", h2: "20px", h3: "16px" };
  const weights = { h1: "700", h2: "600", h3: "600" };
  const tag = level || "h2";
  return `<${tag} style="margin:0 0 16px;font-size:${sizes[tag]};font-weight:${weights[tag]};color:#24558d;line-height:1.3;">${text}</${tag}>`;
};

/** Body paragraph */
export const paragraph = (text: string, options?: { color?: string; size?: string }): string =>
  `<p style="margin:0 0 12px;color:${options?.color || "#475569"};font-size:${options?.size || "15px"};line-height:1.6;">${text}</p>`;

/** Divider line */
export const divider = (): string => `
  <tr>
    <td style="padding:8px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="border-top:1px solid #e2e8f0;font-size:0;line-height:0;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>`;

/** Content wrapper (adds padding around content block) */
export const contentBlock = (...children: string[]): string => `
<tr>
  <td style="padding:32px 40px;background-color:#ffffff;">
    ${children.join("\n")}
  </td>
</tr>`;

/** Badge / tag */
export const badge = (label: string, variant?: "info" | "warning" | "error" | "success"): string => {
  const colors = {
    info: { bg: "#dbeafe", text: "#1e40af" },
    warning: { bg: "#fef3c7", text: "#92400e" },
    error: { bg: "#fee2e2", text: "#991b1b" },
    success: { bg: "#dcfce7", text: "#166534" },
  };
  const c = colors[variant || "info"];
  return `<span style="display:inline-block;background:${c.bg};color:${c.text};padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600;">${label}</span>`;
};

export const FRONTEND = {
  login: "/sign-in",
  home: "/",
  experts: "/experts",
  expertDashboard: "/expert/dashboard",
  expertProfile: "/expert/dashboard/profile",
  expertDocuments: "/expert/dashboard/documents",
  expertVerification: "/expert/dashboard/verification",
  expertCompliance: "/expert/dashboard/compliance",
  expertCredentials: "/expert/dashboard/compliance",
  expertReviews: "/expert/dashboard/reviews",
  expertBookings: "/expert/dashboard/bookings",
  adminDashboard: "/admin/dashboard",
  adminVerifications: "/admin/dashboard/verifications",
  adminExperts: "/admin/dashboard/experts",
  clientDashboard: "/client/dashboard",
  clientConsultations: "/client/dashboard/consultations",
  clientPayments: "/client/dashboard/payments",
  clientMessages: "/client/dashboard/messages",
  expertMessages: "/expert/dashboard/messages",
  resetPassword: (token: string, locale = "en") => `/${locale}/reset-password/${token}`,
  bookings: (id: string) => `/client/dashboard/consultations/${id}`,
  expertBookingsDetail: (id: string) => `/expert/dashboard/bookings/${id}`,
  joinConsultation: (id: string) => `/bookings/${id}/join`,
  chat: (id: string) => `/client/dashboard/messages?conversation=${id}`,
  review: (id: string) => `/client/dashboard/consultations/${id}/review`,
};
