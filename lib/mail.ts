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
// ✅ DEPOSIT RECEIVED EMAIL
// =============================
export async function sendDepositReceivedEmail(
  email: string,
  amount: number
): Promise<void> {
  try {
    await safeSend({
      from: "CoinlyBitora <noreply@obiresoffice.com>",
      to: [email],
      subject: "Deposit Received ⏳",

      html: emailTemplate({
        title: "Deposit Received",

        customerName: "Investor",

        content: `
          <p>
            We've received your deposit request.
          </p>

          <div style="
            margin:35px auto;
            max-width:320px;
            background:#fff7ed;
            border:2px solid #f59e0b;
            border-radius:12px;
            padding:22px;
            text-align:center;
          ">

            <div style="color:#777;">
              Submitted Amount
            </div>

            <div style="
              font-size:34px;
              color:#f59e0b;
              font-weight:bold;
            ">
              $${amount.toLocaleString()}
            </div>

          </div>

          <p>
            Our finance team is verifying your payment.
            Once approved, your account balance will
            automatically update.
          </p>

          <p>
            Estimated review time:
            <strong>5 minutes to 2 hours.</strong>
          </p>
        `,

        buttonText: "View Deposits",

        buttonLink: `${BASE_URL}/dashboard/deposit`,
      }),
    });
  } catch (error) {
    console.error(error);
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
// =============================
// ✅ WITHDRAWAL REQUESTED EMAIL
// =============================
export async function sendWithdrawalRejectedEmail(
  email: string,
  amount: number,
  transactionId: string,
  method: string
): Promise<void> {
  try {
    await safeSend({
      from: "CoinlyBitora <noreply@obiresoffice.com>",
      to: [email],
      subject: "Withdrawal Request Received",

      html: emailTemplate({
        title: "Withdrawal Submitted",

        customerName: "Investor",

        content: `
          <p>
            Your withdrawal request has been received.
          </p>

          <div style="
            margin:30px auto;
            text-align:center;
            padding:20px;
            background:#eff6ff;
            border:2px solid #3b82f6;
            border-radius:12px;
          ">

            <div>Requested Amount</div>

            <div style="
              font-size:34px;
              font-weight:bold;
              color:#2563eb;
            ">
              $${amount.toLocaleString()}
            </div>

          </div>

          <p>
            Your request is currently awaiting approval
            from our finance department.
          </p>

          <p>
            You'll receive another email immediately after
            approval.
          </p>
        `,

        buttonText: "View Withdrawal",

        buttonLink: `${BASE_URL}/dashboard/withdraw`,
      }),
    });
  } catch (error) {
    console.error(error);
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

// =============================
// ✅ PASSWORD RESET EMAIL
// =============================
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<void> {
  try {
    await safeSend({
      from: "CoinlyBitora <noreply@obiresoffice.com>",
      to: [email],
      subject: "Reset Your CoinlyBitora Password 🔐",

      html: emailTemplate({
        title: "Password Reset Request",

        customerName: "Investor",

        content: `
          <p>
            We received a request to reset the password
            for your <strong>CoinlyBitora</strong> account.
          </p>

          <p>
            If you requested this password reset,
            click the button below to create a new password.
          </p>

          <div style="
            margin-top:30px;
            padding:18px;
            background:#FEFCE8;
            border-left:4px solid #D4AF37;
            border-radius:10px;
            color:#555;
          ">

            <strong>Security Notice</strong>

            <br><br>

            • This reset link expires in <strong>30 minutes</strong>.<br>
            • It can only be used once.<br>
            • If you didn't request this, simply ignore this email.

          </div>

          <p style="
            margin-top:25px;
            color:#777;
            font-size:13px;
          ">
            For your security, never share your password
            or this reset link with anyone.
          </p>
        `,

        buttonText: "Reset Password",

        buttonLink: resetLink,
      }),
    });
  } catch (error) {
    console.error("❌ Password reset email FAILED:", error);
  }
}

// =============================
// ✅ PASSWORD CHANGED EMAIL
// =============================
export async function sendPasswordChangedEmail(
  email: string
): Promise<void> {
  try {
    await safeSend({
      from: "CoinlyBitora <noreply@obiresoffice.com>",
      to: [email],
      subject: "Password Successfully Updated 🔐",

      html: emailTemplate({
        title: "Password Updated",

        customerName: "Investor",

        content: `
          <p>
            Your CoinlyBitora account password has been
            successfully changed.
          </p>

          <div style="
            margin:30px 0;
            padding:20px;
            background:#ECFDF5;
            border-left:4px solid #22c55e;
            border-radius:10px;
            color:#166534;
          ">

            ✔ Password Updated Successfully

          </div>

          <p>
            If you made this change, no further action
            is required.
          </p>

          <p style="
            color:#777;
            font-size:13px;
          ">
            If you did NOT change your password,
            secure your account immediately and
            contact CoinlyBitora Support.
          </p>
        `,

        buttonText: "Open Dashboard",

        buttonLink: `${BASE_URL}/dashboard`,
      }),
    });
  } catch (error) {
    console.error("Password changed email FAILED:", error);
  }
}

// =============================
// ✅ LOGIN ALERT EMAIL
// =============================
export async function sendLoginAlertEmail(
  email: string,
  device: string,
  ip: string,
  location: string
): Promise<void> {
  try {
    await safeSend({
      from: "CoinlyBitora <noreply@obiresoffice.com>",
      to: [email],
      subject: "New Login Detected 🔒",

      html: emailTemplate({
        title: "Security Alert",

        customerName: "Investor",

        content: `
          <p>
            We detected a new login to your CoinlyBitora account.
          </p>

          <table
            width="100%"
            cellpadding="10"
            style="
              margin:30px 0;
              background:#f8fafc;
              border-radius:10px;
              border:1px solid #e5e7eb;
            ">

            <tr>
              <td><strong>Device</strong></td>
              <td align="right">${device}</td>
            </tr>

            <tr>
              <td><strong>IP Address</strong></td>
              <td align="right">${ip}</td>
            </tr>

            <tr>
              <td><strong>Location</strong></td>
              <td align="right">${location}</td>
            </tr>

            <tr>
              <td><strong>Time</strong></td>
              <td align="right">${new Date().toLocaleString()}</td>
            </tr>

          </table>

          <p>
            If this was you, no action is required.
          </p>

          <p style="color:#dc2626;font-size:13px;">
            If you don't recognize this login,
            change your password immediately.
          </p>
        `,

        buttonText: "Secure My Account",

        buttonLink: `${BASE_URL}/dashboard/security`,
      }),
    });
  } catch (error) {
    console.error(error);
  }
}

// =============================
// ✅ INVESTMENT CREATED
// =============================
export async function sendInvestmentStartedEmail(
  email: string,
  amount: number,
  plan: string,
  roi: number,
  duration: Date
): Promise<void> {
  try {
    await safeSend({
      from: "CoinlyBitora <noreply@obiresoffice.com>",
      to: [email],
      subject: "Investment Confirmed 📈",

      html: emailTemplate({
        title: "Investment Started",

        customerName: "Investor",

        content: `
          <p>
            Your investment has been successfully activated.
          </p>

          <table
            width="100%"
            cellpadding="12"
            style="
              margin:30px 0;
              background:#f8fafc;
              border-radius:10px;
              border:1px solid #e5e7eb;
            ">

            <tr><td><strong>Plan</strong></td><td align="right">${plan}</td></tr>
            <tr><td><strong>Investment</strong></td><td align="right">$${amount.toLocaleString()}</td></tr>
            <tr><td><strong>ROI</strong></td><td align="right">${roi}%</td></tr>
            <tr><td><strong>Duration</strong></td><td align="right">${duration}</td></tr>

          </table>

          <p>
            Your investment is now earning returns.
          </p>
        `,

        buttonText: "View Investment",

        buttonLink: `${BASE_URL}/dashboard/investments`,
      }),
    });
  } catch (error) {
    console.error(error);
  }
}

// =============================
// ✅ INVESTMENT COMPLETED
// =============================
export async function sendInvestmentCompletedEmail(
  email: string,
  amount: number,
  profit: number,
  total: number,
  plan: string
): Promise<void> {
  try {
    await safeSend({
      from: "CoinlyBitora <noreply@obiresoffice.com>",
      to: [email],
      subject: "Investment Completed 🎉",

      html: emailTemplate({
        title: "Investment Completed",

        customerName: "Investor",

        content: `
          <p>
            Congratulations!
            Your investment has matured successfully.
          </p>

          <table
            width="100%"
            cellpadding="12"
            style="
              margin:30px 0;
              background:#f8fafc;
              border-radius:10px;
              border:1px solid #e5e7eb;
            ">

            <tr>
              <td><strong>Principal</strong></td>
              <td align="right">$${amount.toLocaleString()}</td>
            </tr>

            <tr>
              <td><strong>Profit</strong></td>
              <td align="right">$${profit.toLocaleString()}</td>
            </tr>

            <tr>
              <td><strong>Total Returned</strong></td>
              <td align="right">
                <strong style="color:#16a34a;">
                  $${(amount + profit).toLocaleString()}
                </strong>
              </td>
            </tr>

          </table>

          <p>
            Your earnings have been credited
            to your account.
          </p>
        `,

        buttonText: "View Portfolio",

        buttonLink: `${BASE_URL}/dashboard/assets`,
      }),
    });
  } catch (error) {
    console.error(error);
  }
}

// =============================
// ✅ KYC APPROVED EMAIL
// =============================
export async function sendKYCApprovedEmail(
  email: string
): Promise<void> {
  try {
    await safeSend({
      from: "CoinlyBitora <noreply@obiresoffice.com>",
      to: [email],
      subject: "Identity Verification Approved ✅",

      html: emailTemplate({
        title: "Identity Verified",

        customerName: "Investor",

        content: `
          <p>
            Congratulations! Your identity verification has
            been successfully approved.
          </p>

          <div style="
            margin:30px 0;
            padding:20px;
            background:#ECFDF5;
            border-left:4px solid #22c55e;
            border-radius:10px;
            color:#166534;
          ">
            ✔ KYC Approved Successfully
          </div>

          <p>
            Your account now has full access to deposits,
            withdrawals and all trading features.
          </p>
        `,

        buttonText: "Go To Dashboard",

        buttonLink: `${BASE_URL}/dashboard`,
      }),
    });
  } catch (error) {
    console.error(error);
  }
}

// =============================
// ✅ KYC REJECTED EMAIL
// =============================
export async function sendKYCRejectedEmail(
  email: string,
  reason: string
): Promise<void> {
  try {
    await safeSend({
      from: "CoinlyBitora <noreply@obiresoffice.com>",
      to: [email],
      subject: "Identity Verification Update",

      html: emailTemplate({
        title: "Verification Needs Attention",

        customerName: "Investor",

        content: `
          <p>
            Unfortunately we couldn't approve your
            identity verification.
          </p>

          <div style="
            margin:30px 0;
            padding:20px;
            background:#FEF2F2;
            border-left:4px solid #DC2626;
            border-radius:10px;
            color:#991B1B;
          ">

            <strong>Reason</strong>

            <br><br>

            ${reason}

          </div>

          <p>
            Please upload clearer documents and submit
            your verification again.
          </p>
        `,

        buttonText: "Resubmit Verification",

        buttonLink: `${BASE_URL}/dashboard/profile`,
      }),
    });
  } catch (error) {
    console.error(error);
  }
}

// =============================
// ✅ SUPPORT REPLY EMAIL
// =============================
export async function sendSupportReplyEmail(
  email: string,
  message: string
): Promise<void> {
  try {
    await safeSend({
      from: "CoinlyBitora Support <support@obiresoffice.com>",
      to: [email],
      subject: "Support Response",

      html: emailTemplate({
        title: "Support Team Response",

        customerName: "Investor",

        content: `
          <p>
            Our support team has replied to your request.
          </p>

          <div style="
            margin:30px 0;
            padding:20px;
            background:#F8FAFC;
            border-radius:10px;
            border:1px solid #E5E7EB;
            line-height:30px;
          ">

            ${message}

          </div>

          <p>
            If you have additional questions,
            simply reply to this email.
          </p>
        `,

        buttonText: "Contact Support",

        buttonLink: `${BASE_URL}/support`,
      }),
    });
  } catch (error) {
    console.error(error);
  }
}

// =============================
// ✅ ACCOUNT LOCKED EMAIL
// =============================
export async function sendAccountLockedEmail(
  email: string
): Promise<void> {
  try {
    await safeSend({
      from: "CoinlyBitora Security <security@obiresoffice.com>",
      to: [email],
      subject: "Account Temporarily Locked",

      html: emailTemplate({
        title: "Security Protection",

        customerName: "Investor",

        content: `
          <p>
            Your account has been temporarily locked
            after multiple unsuccessful login attempts.
          </p>

          <div style="
            margin:30px 0;
            padding:20px;
            background:#FEF2F2;
            border-left:4px solid #DC2626;
            border-radius:10px;
          ">

            This is an automatic security measure to
            protect your account.

          </div>

          <p>
            If this was not you,
            change your password immediately.
          </p>
        `,

        buttonText: "Secure Account",

        buttonLink: `${BASE_URL}/forgot-password`,
      }),
    });
  } catch (error) {
    console.error(error);
  }
}

// =============================
// ✅ EMAIL CHANGED
// =============================
export async function sendEmailChangedEmail(
  email: string
): Promise<void> {
  try {
    await safeSend({
      from: "CoinlyBitora Security <security@obiresoffice.com>",
      to: [email],
      subject: "Email Address Updated",

      html: emailTemplate({
        title: "Email Updated",

        customerName: "Investor",

        content: `
          <p>
            Your account email address has been
            successfully updated.
          </p>

          <p>
            Future account notifications will be
            sent to this email address.
          </p>

          <p style="color:#dc2626;">
            If you did not make this change,
            contact support immediately.
          </p>
        `,

        buttonText: "Review Security",

        buttonLink: `${BASE_URL}/dashboard/security`,
      }),
    });
  } catch (error) {
    console.error(error);
  }
}