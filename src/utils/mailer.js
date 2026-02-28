import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text, html }) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    const info = await transporter.sendMail({
        from: `"No Reply" <${process.env.EMAIL}>`,
        to,
        subject,
        text,
        html
    });
// console.log("Email sent to:", to);
// console.log("Info:", info);
    return { info };
};
