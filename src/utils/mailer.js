import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.resolve(__dirname, "../Templates/image/image.png");

const transporters = new Map();

const parseBoolean = (value, fallback = false) => {
    if (typeof value !== "string") return fallback;
    return value.trim().toLowerCase() === "true";
};

const parsePort = (value, fallback) => {
    const port = Number(value);
    return Number.isInteger(port) && port > 0 ? port : fallback;
};

const isConnectionError = (error) => {
    const connectionCodes = new Set([
        "ESOCKET",
        "ECONNRESET",
        "ETIMEDOUT",
        "ECONNECTION",
        "EHOSTUNREACH",
        "ENOTFOUND",
        "ECONNREFUSED",
    ]);

    return connectionCodes.has(error?.code);
};

const getTransportConfigs = (user, pass) => {
    const customHost = process.env.EMAIL_HOST?.trim();

    if (customHost) {
        const port = parsePort(process.env.EMAIL_PORT, 587);
        const secure = parseBoolean(process.env.EMAIL_SECURE, port === 465);

        return [
            {
                id: `custom:${customHost}:${port}:${secure}`,
                options: {
                    host: customHost,
                    port,
                    secure,
                    requireTLS: !secure,
                    auth: { user, pass },
                    connectionTimeout: 20000,
                    greetingTimeout: 15000,
                    socketTimeout: 20000,
                },
            },
        ];
    }

    return [
        {
            id: "gmail:587:false",
            options: {
                host: "smtp.gmail.com",
                port: 587,
                secure: false,
                requireTLS: true,
                auth: { user, pass },
                connectionTimeout: 20000,
                greetingTimeout: 15000,
                socketTimeout: 20000,
            },
        },
        {
            id: "gmail:465:true",
            options: {
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: { user, pass },
                connectionTimeout: 20000,
                greetingTimeout: 15000,
                socketTimeout: 20000,
            },
        },
    ];
};

const getTransporter = (config) => {
    if (!transporters.has(config.id)) {
        transporters.set(config.id, nodemailer.createTransport(config.options));
    }

    return transporters.get(config.id);
};

const getTransportCandidates = () => {
    const user = process.env.EMAIL;
    const pass = process.env.EMAIL_PASSWORD;

    if (!user || !pass) {
        throw new Error("Email credentials are missing. Set EMAIL and EMAIL_PASSWORD in .env");
    }

    return getTransportConfigs(user, pass);
};

export const sendEmail = async ({ to, subject, text, html }) => {
    const candidates = getTransportCandidates();
    let lastError;

    for (const candidate of candidates) {
        try {
            const smtp = getTransporter(candidate);
            const info = await smtp.sendMail({
                from: `"No Reply" <${process.env.EMAIL}>`,
                to,
                subject,
                text,
                html,
                attachments: [
                    {
                        filename: "image.png",
                        path: logoPath,
                        cid: "kikstart-logo"
                    }
                ]
            });

            return { info };
        } catch (error) {
            lastError = error;

            if (!isConnectionError(error)) {
                throw error;
            }
        }
    }

    throw new Error(
        `Unable to connect to the email server. Last error: ${lastError?.message || "Unknown mail error"}`
    );
      };
