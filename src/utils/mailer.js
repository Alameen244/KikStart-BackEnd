import nodemailer from "nodemailer";

// Create transporter once at module level (singleton) to avoid
// creating a new connection pool on every email send
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

export const sendEmail = async ({ to, subject, text, html }) => {
    const info = await transporter.sendMail({
        from: `"No Reply" <${process.env.EMAIL}>`,
        to,
        subject,
        text,
        html
    });
    return { info };
};
