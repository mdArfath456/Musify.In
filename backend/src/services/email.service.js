// Sends authentication email through EmailJS's REST API (server-side "strict mode"
// call, using the account's private key) instead of raw SMTP or the old
// Brevo/Resend HTTP APIs.
//
// EmailJS is only the delivery mechanism. The backend remains the sole
// authority for generating and verifying authentication credentials.

const EMAILJS_SEND_URL = "https://api.emailjs.com/api/v1.0/email/send";

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);

const WEB_PURPOSE_CONFIG = {
    "verify-email": {
        templateEnvVar: "EMAILJS_VERIFY_TEMPLATE_ID",
        subject: "Verify your Musify account",
        heading: "Verify your email",
        intro: "Use this code to verify your Musify account."
    },
    "first-login": {
        templateEnvVar: "EMAILJS_FIRST_LOGIN_TEMPLATE_ID",
        subject: "Confirm your first Musify login",
        heading: "Confirm it's you",
        intro: "Use this code to finish signing in to Musify for the first time on this device."
    },
};

const MOBILE_PURPOSE_CONFIG = {
    "verify-email": {
        templateEnvVar: "MOBILE_EMAILJS_VERIFY_TEMPLATE_ID",
        subject: "Verify your Musify account",
        heading: "Verify your email",
        intro: "Use this code to verify your Musify account."
    },
    "first-login": {
        templateEnvVar: "MOBILE_EMAILJS_FIRST_LOGIN_TEMPLATE_ID",
        subject: "Confirm your first Musify login",
        heading: "Confirm it's you",
        intro: "Use this code to finish signing in to Musify for the first time on this device."
    },
    "password-reset": {
        templateEnvVar: "MOBILE_EMAILJS_RESET_OTP_TEMPLATE_ID",
        subject: "Reset your Musify password",
        heading: "Reset your password",
        intro: "Use this code to reset your Musify password."
    },
};

function buildPlainBody({ heading, intro, otp }) {
    return `${heading}\n\n${intro}\n\nYour Musify verification code: ${otp}\n\nThis code expires in ${OTP_EXPIRY_MINUTES} minutes. If you didn't request this, you can safely ignore this email — never share this code with anyone, including anyone claiming to be Musify support.`;
}

async function sendViaEmailJs({ serviceId, publicKey, privateKey, templateId, templateParams }) {
    if (!serviceId || !publicKey || !privateKey) {
        throw new Error("EmailJS is not configured: service ID, public key and private key are all required");
    }
    if (!templateId) {
        throw new Error("Missing EmailJS template id for this OTP purpose");
    }

    const response = await fetch(EMAILJS_SEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            service_id: serviceId,
            template_id: templateId,
            user_id: publicKey,
            accessToken: privateKey,
            template_params: templateParams
        })
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`EmailJS request failed (${response.status}): ${errText}`);
    }

    return { delivered: true };
}

async function sendOtpEmail(to, otp, purpose) {
    const config = WEB_PURPOSE_CONFIG[purpose];
    if (!config) throw new Error(`Unknown OTP purpose: ${purpose}`);

    const templateId = process.env[config.templateEnvVar];
    const templateParams = {
        to_email: to,
        username: to.split("@")[0],
        otp,
        expiry_minutes: OTP_EXPIRY_MINUTES,
        subject: config.subject,
        heading: config.heading,
        intro: config.intro
    };

    const hasEmailJsConfig =
        process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_PUBLIC_KEY && process.env.EMAILJS_PRIVATE_KEY;

    if (!hasEmailJsConfig) {
        if (process.env.NODE_ENV !== "production") {
            console.log(
                `[email:dev-fallback] To: ${to} | Purpose: ${purpose} | OTP: ${otp}\n${buildPlainBody({ ...config, otp })}`
            );
            return { devFallback: true };
        }
        throw new Error("Email delivery is not configured");
    }

    return sendViaEmailJs({
        serviceId: process.env.EMAILJS_SERVICE_ID,
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
        templateId,
        templateParams
    });
}

async function sendMobileOtpEmail(to, otp, purpose) {
    const config = MOBILE_PURPOSE_CONFIG[purpose];
    if (!config) throw new Error(`Unknown mobile OTP purpose: ${purpose}`);

    const templateId = process.env[config.templateEnvVar];
    const templateParams = {
        to_email: to,
        username: to.split("@")[0],
        otp,
        expiry_minutes: OTP_EXPIRY_MINUTES,
        subject: config.subject,
        heading: config.heading,
        intro: config.intro
    };

    const hasEmailJsConfig =
        process.env.MOBILE_EMAILJS_SERVICE_ID &&
        process.env.MOBILE_EMAILJS_PUBLIC_KEY &&
        process.env.MOBILE_EMAILJS_PRIVATE_KEY;

    if (!hasEmailJsConfig) {
        if (process.env.NODE_ENV !== "production") {
            console.log(
                `[mobile-email:dev-fallback] To: ${to} | Purpose: ${purpose} | OTP: ${otp}\n${buildPlainBody({ ...config, otp })}`
            );
            return { devFallback: true };
        }
        throw new Error("Mobile EmailJS delivery is not configured");
    }

    return sendViaEmailJs({
        serviceId: process.env.MOBILE_EMAILJS_SERVICE_ID,
        publicKey: process.env.MOBILE_EMAILJS_PUBLIC_KEY,
        privateKey: process.env.MOBILE_EMAILJS_PRIVATE_KEY,
        templateId,
        templateParams
    });
}

async function sendPasswordResetLinkEmail(to, resetToken) {
    const templateId = process.env.EMAILJS_RESET_LINK_TEMPLATE_ID;
    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
    const expiryMinutes = 15;
    const templateParams = {
        to_email: to,
        username: to.split("@")[0],
        reset_url: resetUrl,
        expiry_minutes: expiryMinutes,
        subject: "Reset your Musify password",
        heading: "Reset your password",
        intro: "Use the secure link below to choose a new Musify password."
    };

    const hasEmailJsConfig =
        process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_PUBLIC_KEY && process.env.EMAILJS_PRIVATE_KEY;

    if (!hasEmailJsConfig) {
        if (process.env.NODE_ENV !== "production") {
            console.log(`[email:dev-fallback] Password reset link for ${to}: ${resetUrl}`);
            return { devFallback: true };
        }
        throw new Error("Email delivery is not configured");
    }

    if (!templateId) {
        if (process.env.NODE_ENV !== "production") {
            console.log(`[email:dev-fallback] Password reset link for ${to}: ${resetUrl}`);
            return { devFallback: true };
        }
        throw new Error("Missing EMAILJS_RESET_LINK_TEMPLATE_ID");
    }

    return sendViaEmailJs({
        serviceId: process.env.EMAILJS_SERVICE_ID,
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
        templateId,
        templateParams
    });
}

async function sendMobilePasswordResetOtpEmail(to, otp) {
    return sendMobileOtpEmail(to, otp, "password-reset");
}

module.exports = {
    sendOtpEmail,
    sendPasswordResetLinkEmail,
    sendMobileOtpEmail,
    sendMobilePasswordResetOtpEmail,
    OTP_EXPIRY_MINUTES
};
