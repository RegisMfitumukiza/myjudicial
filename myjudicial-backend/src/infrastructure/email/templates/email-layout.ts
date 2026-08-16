const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

/**
 * Real MyJudicial logo, white variant for the brand blue header.
 * Hosted with the frontend static assets; overridable via EMAIL_LOGO_URL.
 */
const EMAIL_LOGO_URL =
  process.env.EMAIL_LOGO_URL || `${FRONTEND_URL}/myjudicial-logo-white.png`;

/**
 * Build a full-page branded email layout.
 * Every email wraps its content in this shell for consistent branding.
 */
export const emailLayout = (content: string, options?: { previewText?: string }): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f1f5f9; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .fluid { max-width: 100% !important; height: auto !important; }
      .stack-column { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  ${options?.previewText ? `<div style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${options.previewText}</div>` : ""}
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table class="email-container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;margin:0 auto;">
          ${emailHeader()}
          ${content}
          ${emailFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/**
 * Branded email header with logo.
 */
const emailHeader = (): string => `
<tr>
  <td style="padding:32px 40px 24px;text-align:center;background-color:#24558d;border-radius:12px 12px 0 0;">
    <a href="${FRONTEND_URL}" target="_blank" style="text-decoration:none;">
      <img
        src="${EMAIL_LOGO_URL}"
        alt="MyJudicial"
        width="160"
        height="114"
        style="display:block;margin:0 auto;width:160px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;"
      />
    </a>
    <p style="margin:10px 0 0;font-size:13px;color:#94a3b8;letter-spacing:0.5px;">
      Rwanda Legal Services Platform
    </p>
  </td>
</tr>`;

/**
 * Branded email footer with links and legal text.
 */
const emailFooter = (): string => `
<tr>
  <td style="padding:24px 40px 32px;background-color:#24558d;border-radius:0 0 12px 12px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="text-align:center;padding-bottom:16px;">
          <a href="${FRONTEND_URL}" target="_blank" style="color:#94a3b8;font-size:13px;text-decoration:none;margin:0 8px;">Home</a>
          <span style="color:#475569;">|</span>
          <a href="${FRONTEND_URL}/experts" target="_blank" style="color:#94a3b8;font-size:13px;text-decoration:none;margin:0 8px;">Find Experts</a>
          <span style="color:#475569;">|</span>
          <a href="mailto:support@myjudicial.rw" style="color:#94a3b8;font-size:13px;text-decoration:none;margin:0 8px;">Support</a>
        </td>
      </tr>
      <tr>
          <td style="text-align:center;border-top:1px solid #3a6ea8;padding-top:16px;">
          <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">
            &copy; ${new Date().getFullYear()} MyJudicial. All rights reserved.<br/>
            Kigali, Rwanda
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
