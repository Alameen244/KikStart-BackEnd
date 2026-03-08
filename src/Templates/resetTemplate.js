const resetTemplate = (name) => {
    return `

    <!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Password Reset Successful</title>
</head>

<body style="margin:0;padding:0;background:#f3f4f6;font-family:Segoe UI,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;margin:40px 0;border-radius:12px;overflow:hidden;box-shadow:0 8px 25px rgba(0,0,0,0.05);">

<tr>
<td style="padding:24px 0 8px;text-align:center;background:#ffffff;">
<img src="cid:kikstart-logo" alt="KIKSTART" style="width:170px;max-width:80%;height:auto;display:block;margin:0 auto;">
</td>
</tr>

<!-- Header -->
<tr>
<td style="background:linear-gradient(135deg,#10b981,#059669);padding:40px;text-align:center;color:#ffffff;">
<h1 style="margin:0;font-size:26px;">Password Changed Successfully ✅</h1>
<p style="margin:10px 0 0 0;font-size:15px;opacity:0.9;">
Your account is now secure
</p>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:40px 35px;color:#374151;font-size:15px;line-height:1.7;">

<h2 style="margin-top:0;">Hello ${name}</h2>

<p>
This is a confirmation that your account password has been successfully updated.
</p>

<div style="background:#ecfdf5;border-left:4px solid #10b981;padding:15px;border-radius:6px;font-size:14px;color:#065f46;margin:25px 0;">
🔒 If you made this change, no further action is required.
</div>

<div style="background:#fef2f2;border-left:4px solid #ef4444;padding:15px;border-radius:6px;font-size:14px;color:#991b1b;">
⚠ If you did NOT change your password, please contact our support team immediately.
</div>

<p style="margin-top:30px;">
Thank you for keeping your account secure.
</p>

<p style="margin-top:30px;">
Best regards,<br>
<strong style="color:#ef4444;">Security Team</strong>
</p>

</td>
</tr>

<!-- Footer -->
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
</html>`;
}

export default resetTemplate;
