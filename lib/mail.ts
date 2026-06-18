import { Resend } from "resend";

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

  console.log("✅ Email sent:", data);

  return data;
}

// =============================
// ✅ SEND OTP EMAIL
// =============================
export const sendOTP = async (email: string, otp: string) => {
  try {
    await safeSend({
      from: "CoinlyBitora <noreply@obiresoffice.com>",
      to: [email],
      subject: "Your  CoinlyBitora Verification Code",

      html: `
      <div style="margin:0;padding:0;background:#0B0F19;font-family:Arial,Helvetica,sans-serif;">
        
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
          <tr>
            <td align="center">

              <table width="420" cellpadding="0" cellspacing="0" style="background:#131A2A;border-radius:16px;padding:30px;color:white;">
                
                <!-- LOGO -->
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <h2 style="margin:0;color:#FFD700;"> CoinlyBitora</h2>
                  </td>
                </tr>

                <!-- TITLE -->
                <tr>
                  <td align="center" style="padding-bottom:10px;">
                    <h3 style="margin:0;">Verify Your Account</h3>
                  </td>
                </tr>

                <!-- TEXT -->
                <tr>
                  <td align="center" style="padding:10px 0;color:#9CA3AF;font-size:14px;">
                    Use the code below to complete your registration
                  </td>
                </tr>

                <!-- OTP BOX -->
                <tr>
                  <td align="center" style="padding:20px 0;">
                    <div style="
                      background:#0B0F19;
                      padding:15px 25px;
                      border-radius:10px;
                      font-size:28px;
                      letter-spacing:6px;
                      font-weight:bold;
                      color:#FFD700;
                      display:inline-block;
                    ">
                      ${otp}
                    </div>
                  </td>
                </tr>

                <!-- INFO -->
                <tr>
                  <td align="center" style="color:#9CA3AF;font-size:13px;">
                    This code will expire in 10 minutes
                  </td>
                </tr>

                <!-- WARNING -->
                <tr>
                  <td align="center" style="padding-top:20px;color:#6B7280;font-size:12px;">
                    If you didn’t request this, you can safely ignore this email
                  </td>
                </tr>

              </table>

              <!-- FOOTER -->
              <div style="margin-top:20px;color:#6B7280;font-size:12px;">
                © ${new Date().getFullYear()}  CoinlyBitora. All rights reserved.
              </div>

            </td>
          </tr>
        </table>

      </div>
      `,
    });

    console.log("✅ Premium OTP email sent");
  } catch (error) {
    console.error("❌ OTP email error:", error);
  }
};

// =============================
// ✅ WELCOME EMAIL
// =============================
export async function sendWelcomeEmail(email: string): Promise<void> {
  try {
    const response = await safeSend({
      from: "CoinlyBitora <noreply@obiresoffice.com>",
      to: [email],
      subject: "Welcome to  CoinlyBitora 🚀",
      html: `
      <div style="font-family: Arial, sans-serif; background:#0B0F19; color:white; padding:20px;">
        <div style="max-width:500px; margin:auto; background:#131A2A; padding:30px; border-radius:10px;">
          
          <h2 style="color:#f97316; text-align:center;">Welcome to  CoinlyBitora</h2>

          <p>Your account has been successfully verified 🎉</p>

          <p style="color:#ccc;">
            Start investing today with our flexible plans.
          </p>

          <div style="text-align:center; margin-top:25px;">
            <a href="${BASE_URL}/auth/login"
   style="background:#f97316; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">
   Login & Start Investing
</a>

            <p style="font-size:13px; color:#aaa; text-align:center; margin-top:20px;">
              Explore our investment plans and start trading today.
            </p>
          </div>

          <p style="font-size:12px; color:#666; margin-top:30px; text-align:center;">
             CoinlyBitora © 2026
          </p>

        </div>
      </div>
      `,
    });

    console.log("✅ Welcome email sent:", response);
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
    const response = await safeSend({
      from: "CoinlyBitora <noreply@obiresoffice.com>",
      to: [email],
      subject: "Deposit Approved ✅",

      html: `
      <div style="margin:0;padding:0;background:#0B0F19;font-family:Arial,Helvetica,sans-serif;">
        
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
          <tr>
            <td align="center">

              <table width="420" cellpadding="0" cellspacing="0" style="background:#131A2A;border-radius:16px;padding:30px;color:white;">
                
                <!-- LOGO -->
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <h2 style="margin:0;color:#FFD700;"> CoinlyBitora</h2>
                  </td>
                </tr>

                <!-- TITLE -->
                <tr>
                  <td align="center" style="padding-bottom:10px;">
                    <h3 style="margin:0;color:#22c55e;">Deposit Successful</h3>
                  </td>
                </tr>

                <!-- MESSAGE -->
                <tr>
                  <td align="center" style="padding:10px 0;color:#9CA3AF;font-size:14px;">
                    Your deposit has been successfully approved
                  </td>
                </tr>

                <!-- AMOUNT BOX -->
                <tr>
                  <td align="center" style="padding:20px 0;">
                    <div style="
                      background:#0B0F19;
                      padding:18px 28px;
                      border-radius:12px;
                      font-size:32px;
                      font-weight:bold;
                      color:#22c55e;
                      display:inline-block;
                      letter-spacing:1px;
                    ">
                      $${amount.toLocaleString()}
                    </div>
                  </td>
                </tr>

                <!-- INFO -->
                <tr>
                  <td align="center" style="color:#9CA3AF;font-size:14px;">
                    Your account balance has been updated.<br/>
                    You can now start trading or investing.
                  </td>
                </tr>

                <!-- CTA BUTTON -->
                <tr>
                  <td align="center" style="padding-top:30px;">
                     <a href="${BASE_URL}/auth/login"
                       style="
                         background:linear-gradient(90deg,#22c55e,#16a34a);
                         color:black;
                         padding:14px 28px;
                         text-decoration:none;
                         border-radius:999px;
                         font-weight:bold;
                         font-size:14px;
                         display:inline-block;
                         box-shadow:0 5px 20px rgba(34,197,94,0.4);
                       ">
                      Login & Go To Dashboard →
                    </a>
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td align="center" style="padding-top:25px;color:#6B7280;font-size:12px;">
                    If you did not initiate this deposit, contact support immediately.
                  </td>
                </tr>

              </table>

              <!-- COPYRIGHT -->
              <div style="margin-top:20px;color:#6B7280;font-size:12px;">
                © ${new Date().getFullYear()}  CoinlyBitora. All rights reserved.
              </div>

            </td>
          </tr>
        </table>

      </div>
      `,
    });

    console.log("✅ Premium deposit email sent:", response);
  } catch (error) {
    console.error("❌ Deposit email FAILED:", error);
  }
}

// =============================
// ✅ WITHDRAW APPROVED EMAIL
// =============================
export async function sendWithdrawEmail(
  email: string,
  amount: number,
  transactionId: string,
  method: string
): Promise<void> {
  try {
    const response = await safeSend({
      from: "CoinlyBitora <noreply@obiresoffice.com>",
      to: [email],
      subject: "Withdrawal Approved 💸",
      html: `
      <div style="margin:0;padding:0;background:#0B0F19;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:600px;margin:auto;background:#131A2A;border-radius:12px;padding:30px;color:white;">

          <div style="text-align:center;margin-bottom:25px;">
            <h1 style="margin:0;color:#facc15;">CoinlyBitora</h1>
            <p style="color:#9ca3af;margin-top:5px;">Withdrawal Processing Notice</p>
          </div>

          <h2 style="text-align:center;color:#22c55e;margin:0 0 15px;">✅ Withdrawal Approved</h2>

          <p style="color:#d1d5db;font-size:15px;text-align:center;">
            Your withdrawal request has been approved and is currently being processed.
          </p>

          <div style="background:#0B0F19;padding:20px;border-radius:10px;margin:20px 0;">
            <table style="width:100%;border-collapse:collapse;color:white;font-size:14px;">
              <tr>
                <td style="padding:10px 0;color:#9ca3af;width:42%;vertical-align:top;">Amount</td>
                <td style="padding:10px 0;text-align:right;width:58%;vertical-align:top;font-weight:bold;color:#facc15;">
                  $${amount.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#9ca3af;width:42%;vertical-align:top;">Transaction ID</td>
                <td style="padding:10px 0;text-align:right;width:58%;vertical-align:top;font-family:monospace;font-size:13px;word-break:break-all;">
                  ${transactionId}
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#9ca3af;width:42%;vertical-align:top;">Method</td>
                <td style="padding:10px 0;text-align:right;width:58%;vertical-align:top;">${method}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#9ca3af;width:42%;vertical-align:top;">Status</td>
                <td style="padding:10px 0;text-align:right;width:58%;vertical-align:top;color:#22c55e;">Processing</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#9ca3af;width:42%;vertical-align:top;">Date</td>
                <td style="padding:10px 0;text-align:right;width:58%;vertical-align:top;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div style="background:#052e16;border:1px solid #166534;padding:15px;border-radius:10px;margin-bottom:20px;">
            <p style="margin:0;color:#bbf7d0;font-size:14px;">
              Your funds are being transferred through the selected withdrawal method and may take between 1–24 hours to arrive depending on processing requirements.
            </p>
          </div>

          <div style="text-align:center;margin-top:25px;">
            <a href="${BASE_URL}/dashboard"
              style="display:inline-block;background:#facc15;color:black;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;">
              View Dashboard
            </a>
          </div>

          <hr style="margin:30px 0;border-color:#1f2937;" />

          <p style="text-align:center;color:#6b7280;font-size:12px;">
            CoinlyBitora Trading Platform<br/>
            Transaction Reference: ${transactionId}
          </p>

        </div>
      </div>
      `,
    });

    console.log("✅ Withdraw email sent:", {
      email,
      amount,
      transactionId,
      method,
      response,
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