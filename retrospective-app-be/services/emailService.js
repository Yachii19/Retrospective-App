const nodemailer = require("nodemailer");
const dns = require("dns"); // ← add this
require("dotenv").config();

dns.setDefaultResultOrder('ipv4first'); // ← force IPv4 before IPv6

const userMail = process.env.EMAIL_USER;
const password = process.env.EMAIL_PASS;

// ← replace the transporter with this
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',  // ← explicit host instead of service: 'gmail'
    port: 587,               // ← 587 instead of 465
    secure: false,           // ← false for port 587
    family: 4,               // ← force IPv4 only
    auth: { 
        user: userMail, 
        pass: password 
    },
    tls: {
        rejectUnauthorized: false
    }
});

// ← add this to verify on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('Mailer connection failed:', error.message);
    } else {
        console.log('Mailer ready ✓');
    }
});

// everything below stays exactly the same
exports.sendEmail = async ({ to, subject, html }) => {
    if (!to) throw new Error("Email 'to' is required");
    return transporter.sendMail({
        from: `"RetroFlow" <${userMail}>`,
        to,
        subject,
        html,
    });
};

exports.sendOTPEmail = async (to, otp) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0;">Retrospect</h1>
                <p style="color: #6b7280; margin-top: 4px; font-size: 14px;">Email Verification</p>
            </div>
            <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
                <p style="color: #374151; font-size: 15px; margin: 0 0 24px 0;">
                    Hi there! Use the OTP below to verify your email address. It expires in <strong>10 minutes</strong>.
                </p>
                <div style="text-align: center; margin: 24px 0;">
                    <span style="font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #007aff; background: #eff6ff; padding: 16px 24px; border-radius: 10px; display: inline-block;">
                        ${otp}
                    </span>
                </div>
                <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 24px 0 0 0;">
                    If you didn't create a Retrospect account, you can safely ignore this email.
                </p>
            </div>
        </div>
    `;
    return exports.sendEmail({ to, subject: "Your Retrospect OTP Code", html });
};

exports.sendMagicLinkEmail = async (to, resetLink) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0;">Retrospect</h1>
                <p style="color: #6b7280; margin-top: 4px; font-size: 14px;">Password Reset</p>
            </div>
            <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
                <p style="color: #374151; font-size: 15px; margin: 0 0 24px 0;">
                    We received a request to reset your password. Click the button below — the link expires in <strong>30 minutes</strong>.
                </p>
                <div style="text-align: center; margin: 24px 0;">
                    <a href="${resetLink}"
                        style="background: #007aff; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
                        Reset My Password
                    </a>
                </div>
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 24px 0 0 0;">
                    Or copy this link: <a href="${resetLink}" style="color: #007aff;">${resetLink}</a>
                </p>
                <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 16px 0 0 0;">
                    If you didn't request a password reset, you can safely ignore this email.
                </p>
            </div>
        </div>
    `;
    return exports.sendEmail({ to, subject: "Reset Your Retrospect Password", html });
};

exports.sendMail = exports.sendEmail;