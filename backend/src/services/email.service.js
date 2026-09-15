// Sends transactional email through Brevo or Resend's HTTP APIs instead of raw SMTP.
//
// Why: SMTP (ports 25/465/587) is blocked outbound on many hosting
// platforms' free/hobby tiers as an anti-spam measure — Render included.
// An HTTP-based email API runs over normal HTTPS (443), which is never
// blocked, and needs no domain verification to start sending via Resend's
// shared "onboarding@resend.dev" sender.

const RESEND_URL = "https://api.resend.com/emails";
const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

async function sendViaBrevo({ to, subject, html }) {
    const response = await fetch(BREVO_URL, {
        method: "POST",
        headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            sender: {
                email: process.env.BREVO_SENDER_EMAIL,
                name: process.env.BREVO_SENDER_NAME || "Musify"
            },
            to: [{ email: to }],
            subject,
            htmlContent: html
        })
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Brevo request failed (${response.status}): ${errText}`);
    }

    return response.json();
}

async function sendViaResend({ to, subject, html }) {
    const response = await fetch(RESEND_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from: process.env.RESEND_FROM || "Musify <onboarding@resend.dev>",
            to: [to],
            subject,
            html
        })
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => "");
        if (response.status === 403 && errText.includes("testing emails")) {
            console.log(`[email:sandbox-fallback] To: ${to} | Subject: ${subject}`);
            console.log("Resend sandbox restriction — verify a domain at resend.com/domains to email real recipients.");
            return { sandboxFallback: true };
        }
        throw new Error(`Resend request failed (${response.status}): ${errText}`);
    }

    return response.json();
}

async function sendOtpEmail(to, otp, purpose) {
    const subject =
        purpose === "reset-password" ? "Reset your Musify password" : "Verify your Musify account";
    const heading = purpose === "reset-password" ? "Reset your password" : "Verify your email";
    const body = purpose === "reset-password"
        ? "Use this code to reset your password. It expires in 10 minutes."
        : "Use this code to verify your account. It expires in 10 minutes.";

    const html = `
        <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
            <h2>${heading}</h2>
            <p>${body}</p>
            <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px;">${otp}</p>
            <p style="color: #888; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
    `;

    const hasBrevoSetting = process.env.BREVO_API_KEY || process.env.BREVO_SENDER_EMAIL;
    if (hasBrevoSetting) {
        if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
            throw new Error("BREVO_API_KEY and BREVO_SENDER_EMAIL must be configured together");
        }
        return sendViaBrevo({ to, subject, html });
    }

    if (process.env.RESEND_API_KEY) {
        return sendViaResend({ to, subject, html });
    }

    if (!process.env.RESEND_API_KEY) {
        console.log(`[email:dev-fallback] To: ${to} | Subject: ${subject} | OTP: ${otp}`);
        return { devFallback: true };
    }
}

module.exports = { sendOtpEmail };