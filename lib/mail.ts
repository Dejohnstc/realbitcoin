import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY as string);

// =============================
// ✅ SEND OTP EMAIL
// =============================
export async function sendOTP(email: string, otp: string): Promise<void> {
  const response = await resend.emails.send({
    from: "RealBitcoin <noreply@obiresoffice.com>",
    to: email,
    subject: "Your RealBitcoin Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; background:#0B0F19; color:white; padding:20px;">
        <div style="max-width:500px; margin:auto; background:#131A2A; padding:30px; border-radius:10px;">
          
          <h2 style="color:#f97316; text-align:center;">RealBitcoin</h2>
          
          <p>Hello,</p>
          
          <p style="color:#ccc;">
            Use the verification code below to complete your registration:
          </p>

          <div style="text-align:center; margin:30px 0;">
            <span style="font-size:28px; letter-spacing:5px; font-weight:bold; color:#f97316;">
              ${otp}
            </span>
          </div>

          <p style="font-size:13px; color:#aaa;">
            This code will expire in 10 minutes.
          </p>

          <hr style="border:none; border-top:1px solid #333; margin:20px 0;" />

          <p style="font-size:12px; color:#666; text-align:center;">
            If you didn’t request this, ignore this email.
          </p>

        </div>
      </div>
    `,
  });
}

// =============================
// ✅ WELCOME EMAIL
// =============================
export async function sendWelcomeEmail(email: string): Promise<void> {
  const response = await resend.emails.send({
    from: "RealBitcoin <noreply@obiresoffice.com>",
    to: email,
    subject: "Welcome to RealBitcoin 🚀",
    html: `
      <div style="font-family: Arial, sans-serif; background:#0B0F19; color:white; padding:20px;">
        <div style="max-width:500px; margin:auto; background:#131A2A; padding:30px; border-radius:10px;">
          
          <h2 style="color:#f97316; text-align:center;">Welcome to RealBitcoin</h2>

          <p>Your account has been successfully verified 🎉</p>

          <p style="color:#ccc;">
            Start investing today with our flexible plans.
          </p>

          <div style="text-align:center; margin-top:25px;">
            <a href="http://realbitcoin.obiresoffice.com/dashboard/investments" 
               style="background:#f97316; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">
               Start Investing
            </a>
            <p style="font-size:13px; color:#aaa; text-align:center; margin-top:20px;">
  Explore our investment plans and start trading today.
</p>
          </div>

          <p style="font-size:12px; color:#666; margin-top:30px; text-align:center;">
            RealBitcoin © 2026
          </p>

        </div>
      </div>
    `,
  });
}

// =============================
// ✅ DEPOSIT APPROVED EMAIL
// =============================
export async function sendDepositEmail(
  email: string,
  amount: number
): Promise<void> {
  const response = await resend.emails.send({
    from: "RealBitcoin <noreply@obiresoffice.com>",
    to: email,
    subject: "Deposit Approved ✅",
    html: `
      <div style="font-family: Arial, sans-serif; background:#0B0F19; color:white; padding:20px;">
        <div style="max-width:500px; margin:auto; background:#131A2A; padding:30px; border-radius:10px;">

          <h2 style="color:#22c55e; text-align:center;">Deposit Confirmed</h2>

          <p>Your deposit has been successfully approved.</p>

          <div style="text-align:center; margin:20px 0;">
            <span style="font-size:26px; font-weight:bold; color:#22c55e;">
              $${amount}
            </span>
          </div>

          <p style="color:#ccc;">
            Your balance has been updated. You can now start trading or invest.
          </p>

          <div style="text-align:center; margin-top:25px;">
            <a href="http://realbitcoin.obiresoffice.com/dashboard"
               style="background:#22c55e; color:black; padding:10px 20px; text-decoration:none; border-radius:5px;">
               Go to Dashboard
            </a>
          </div>

        </div>
      </div>
    `,
  });
}

// =============================
// ✅ WITHDRAW APPROVED EMAIL
// =============================
export async function sendWithdrawEmail(
  email: string,
  amount: number
): Promise<void> {
  const response = await resend.emails.send({
    
    from: "RealBitcoin <noreply@obiresoffice.com>",
    to: email,
    subject: "Withdrawal Processed 💸",
    html: `
      <div style="font-family: Arial, sans-serif; background:#0B0F19; color:white; padding:20px;">
        <div style="max-width:500px; margin:auto; background:#131A2A; padding:30px; border-radius:10px;">

          <h2 style="color:#facc15; text-align:center;">Withdrawal Approved</h2>

          <p>Your withdrawal request has been processed successfully.</p>

          <div style="text-align:center; margin:20px 0;">
            <span style="font-size:26px; font-weight:bold; color:#facc15;">
              $${amount}
            </span>
          </div>

          <p style="color:#ccc;">
            Funds will reflect in your wallet shortly depending on network confirmations.
          </p>

          <div style="text-align:center; margin-top:25px;">
            <a href="http://realbitcoin.obiresoffice.com/dashboard"
               style="background:#facc15; color:black; padding:10px 20px; text-decoration:none; border-radius:5px;">
               View Dashboard
            </a>
          </div>

        </div>
      </div>
    `,
  });
}