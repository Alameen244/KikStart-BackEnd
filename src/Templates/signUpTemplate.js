const userTemplate = (name) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome</title>
    </head>

    <body style="margin:0;padding:0;background:#f3f4f6;font-family:Segoe UI,Arial,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
    <td align="center">

    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;margin:40px 0;border-radius:12px;overflow:hidden;box-shadow:0 8px 25px rgba(0,0,0,0.05);">

    <tr>
    <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px;text-align:center;color:#ffffff;">
    <h1 style="margin:0;font-size:28px;">Welcome Aboard 🚀</h1>
    <p style="margin:10px 0 0 0;font-size:16px;opacity:0.9;">Your account is ready</p>
    </td>
    </tr>

    <tr>
    <td style="padding:40px 35px;color:#374151;font-size:15px;line-height:1.7;">
    <h2 style="margin-top:0;">Hello ${name},</h2>
    <p>Thank you for registering with us. Your account has been successfully created.</p>

    <div style="text-align:center;margin:35px 0;">
    <a href="#" style="background:#6366f1;color:#fff;text-decoration:none;padding:14px 30px;border-radius:8px;font-weight:600;display:inline-block;">
    Go to Dashboard
    </a>
    </div>

    <p>If you have any questions, our support team is always here to help.</p>

    <p style="margin-top:30px;">Warm regards,<br><strong>The Team</strong></p>
    </td>
    </tr>

    <tr>
    <td style="background:#f9fafb;padding:20px;text-align:center;font-size:12px;color:#9ca3af;">
    © 2026 Your Company. All rights reserved.
    </td>
    </tr>

    </table>
    </td>
    </tr>
    </table>

    </body>
    </html>`
}

export default userTemplate;
