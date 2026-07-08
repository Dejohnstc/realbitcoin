import { Resend } from "resend";
import { emailTemplate } from "./emailTemplate";
const resend = new Resend(process.env.RESEND_API_KEY as string);

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// =============================
// ✅ SAFE SEND HELPER (FIXED)
// =============================

// 🔥 Proper Resend type (NO any)
type SendEmailPayload = Parameters<
  typeof resend.emails.send
>[0];

async function safeSend(payload: SendEmailPayload) {
  const { data, error } = await resend.emails.send(payload);

  if (error) {
    console.error("❌ Email error:", error);
    throw new Error(JSON.stringify(error));
  }

  

  return data;
}

// =============================
// ✅ SEND OTP EMAIL
// =============================
export const sendOTP = async (
  email: string,
  otp: string
) => {
  try {
    await safeSend({
      from: "CoinlyBitora <noreply@obiresoffice.com>",
      to: [email],
      subject: "Your CoinlyBitora Verification Code",

      html: emailTemplate({
        title: "Verify Your Account",

        customerName: "Investor",

        content: `
          <p>
            Thank you for choosing <strong>CoinlyBitora</strong>.
          </p>

          <p>
            Use the verification code below to complete your account registration.
          </p>

          <div style="
            margin:35px auto;
            width:fit-content;
            background:#111111;
            border:2px solid #D4AF37;
            border-radius:12px;
            padding:18px 40px;
            font-size:34px;
            font-weight:bold;
            letter-spacing:8px;
            color:#D4AF37;
          ">
            ${otp}
          </div>

          <p>
            This verification code will expire in
            <strong>10 minutes</strong>.
          </p>

          <p style="
            color:#888;
            font-size:13px;
          ">
            If you did not request this verification code,
            you can safely ignore this email.
          </p>
        `,

        buttonText: "Verify Account",

        buttonLink: `${BASE_URL}/auth/verify`,
      }),
    });
  } catch (error) {
    console.error("❌ OTP email error:", error);
  }
};

// =============================
// ✅ WELCOME EMAIL
// =============================
export async function sendWelcomeEmail(
  email: string
): Promise<void> {
  try {
    await safeSend({
      from: "CoinlyBitora <noreply@obiresoffice.com>",
      to: [email],
      subject: "Welcome to CoinlyBitora 🚀",

      html: emailTemplate({
        title: "Welcome to CoinlyBitora",

        customerName: "Investor",

        content: `
          <p>
            Congratulations! Your account has been
            successfully verified.
          </p>

          <p>
            Welcome to <strong>CoinlyBitora</strong>,
            your trusted digital asset trading and
            investment platform.
          </p>

          <p>
            You now have full access to your dashboard,
            where you can:
          </p>

          <ul style="
            margin:20px 0;
            padding-left:22px;
            line-height:30px;
            color:#555;
          ">
            <li>Trade digital assets</li>
            <li>Invest in premium plans</li>
            <li>Manage your crypto portfolio</li>
            <li>Deposit and withdraw securely</li>
          </ul>

          <p>
            We're excited to have you join thousands of
            investors building their financial future with
            CoinlyBitora.
          </p>

          <div style="
            margin-top:30px;
            padding:18px;
            border-radius:10px;
            background:#f8fafc;
            border-left:4px solid #D4AF37;
            color:#555;
          ">
            <strong>Getting Started</strong><br><br>

            Complete your first deposit to begin investing
            and unlock all platform features.
          </div>
        `,

        buttonText: "Open Dashboard",

        buttonLink: `${BASE_URL}/dashboard`,
      }),
    });
  } catch (error) {
    console.error("❌ Welcome email FAILED:", error);
  }
}

// =============================
// ✅ DEPOSIT APPROVED EMAIL
// =============================
export async function sendDepositEmail(
  email: string,
  amount: number
): Promise<void> {
  try {
    await safeSend({
      from: "CoinlyBitora <noreply@obiresoffice.com>",
      to: [email],
      subject: "Deposit Approved ✅",

      html: emailTemplate({
        title: "Deposit Approved",

        customerName: "Investor",

        content: `
          <p>
            Great news! Your recent deposit has been
            successfully approved and credited to your
            CoinlyBitora account.
          </p>

          <div style="
            margin:35px auto;
            max-width:320px;
            background:#f8fafc;
            border:2px solid #22c55e;
            border-radius:14px;
            padding:24px;
            text-align:center;
          ">

            <div style="
              font-size:13px;
              color:#777;
              margin-bottom:10px;
            ">
              Deposit Amount
            </div>

            <div style="
              font-size:34px;
              font-weight:700;
              color:#16a34a;
            ">
              $${amount.toLocaleString()}
            </div>

          </div>

          <p>
            Your account balance has been updated and the
            funds are now available for trading,
            investing, or purchasing digital assets.
          </p>

          <div style="
            margin-top:30px;
            padding:18px;
            border-radius:10px;
            background:#ECFDF5;
            border-left:4px solid #22c55e;
            color:#166534;
          ">
            <strong>Deposit Status</strong><br><br>

            ✔ Funds Successfully Credited<br>
            ✔ Ready for Trading<br>
            ✔ Available Immediately
          </div>

          <p style="
            margin-top:30px;
            color:#777;
            font-size:13px;
          ">
            If you did not authorize this deposit,
            please contact our support team immediately.
          </p>
        `,

        buttonText: "Open Dashboard",

        buttonLink: `${BASE_URL}/dashboard`,
      }),
    });
  } catch (error) {
    console.error("❌ Deposit email FAILED:", error);
  }
}

/// =============================
// ✅ WITHDRAW APPROVED EMAIL
// =============================
export async function sendWithdrawEmail(
  email: string,
  amount: number,
  transactionId: string,
  method: string,
  accountName?: string,
  bankName?: string,
  accountNumber?: string
): Promise<void> {
  try {
    await safeSend({
      from: "CoinlyBitora <noreply@obiresoffice.com>",
      to: [email],
      subject: "Withdrawal Approved 💸",

      html: emailTemplate({
        title: "Withdrawal Approved",

        customerName: accountName || "Investor",

        content: `
          <p>
            Your withdrawal request has been successfully approved
            and is now being processed.
          </p>

          <div style="
            margin:35px auto;
            background:#f8fafc;
            border:1px solid #e5e7eb;
            border-radius:14px;
            overflow:hidden;
          ">

            <table
              width="100%"
              cellpadding="14"
              cellspacing="0"
              style="font-size:15px;color:#444;">

              <tr>
                <td style="font-weight:bold;">Amount</td>
                <td align="right">
                  <strong style="color:#16a34a;font-size:20px;">
                    $${amount.toLocaleString()}
                  </strong>
                </td>
              </tr>

              <tr>
                <td style="font-weight:bold;">Method</td>
                <td align="right">${method}</td>
              </tr>

              <tr>
                <td style="font-weight:bold;">Account Holder</td>
                <td align="right">${accountName || "N/A"}</td>
              </tr>

              <tr>
                <td style="font-weight:bold;">Bank</td>
                <td align="right">${bankName || "N/A"}</td>
              </tr>

              <tr>
                <td style="font-weight:bold;">Account</td>
                <td align="right">
                  ${
                    accountNumber
                      ? "****" + accountNumber.slice(-4)
                      : "N/A"
                  }
                </td>
              </tr>

              <tr>
                <td style="font-weight:bold;">Status</td>
                <td align="right">
                  <span style="
                    color:#16a34a;
                    font-weight:bold;
                  ">
                    Processing
                  </span>
                </td>
              </tr>

              <tr>
                <td style="font-weight:bold;">Reference</td>
                <td align="right"
                  style="font-family:monospace;">
                  ${transactionId}
                </td>
              </tr>

              <tr>
                <td style="font-weight:bold;">Date</td>
                <td align="right">
                  ${new Date().toLocaleString()}
                </td>
              </tr>

            </table>

          </div>

          <div style="
            margin-top:30px;
            padding:18px;
            border-radius:10px;
            background:#ECFDF5;
            border-left:4px solid #22c55e;
            color:#166534;
          ">

            <strong>Processing Information</strong>

            <br><br>

            Your withdrawal has entered our payment queue
            and is expected to arrive within
            <strong>1–24 hours</strong>,
            depending on your selected payment method and
            banking network.

          </div>

          <p style="
            margin-top:30px;
            color:#777;
            font-size:13px;
          ">

            If you did not request this withdrawal,
            please contact our support team immediately.

          </p>
        `,

        buttonText: "View Dashboard",

        buttonLink: `${BASE_URL}/dashboard`,
      }),
    });
  } catch (error) {
    console.error("❌ Withdraw email FAILED:", {
      email,
      amount,
      transactionId,
      method,
      error,
    });
  }
}