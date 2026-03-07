import nodemailer from "nodemailer";

let transporter;

const getTransporter = () => {
    const user = process.env.EMAIL;
    const pass = process.env.EMAIL_PASSWORD;

    if (!user || !pass) {
        throw new Error("Email credentials are missing. Set EMAIL and EMAIL_PASSWORD in .env");
    }

    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user, pass }
        });
    }

    return transporter;
};

export const sendEmail = async ({ to, subject, text, html }) => {
    const smtp = getTransporter();
    const info = await smtp.sendMail({
        from: `"No Reply" <${process.env.EMAIL}>`,
        to,
        subject,
        text,
        html
    });
    return { info };
};
