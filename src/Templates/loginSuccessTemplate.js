const loginSuccessTemplate = (name, device, location) => {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Login Successful</title>
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
<tr>
<td style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:40px;text-align:center;color:#ffffff;">
<h1 style="margin:0;font-size:26px;">Login Successful ✅</h1>
<p style="margin:10px 0 0 0;font-size:15px;opacity:0.9;">Security Notification</p>
</td>
</tr>

<tr>
<td style="padding:40px 35px;color:#374151;font-size:15px;line-height:1.7;">

<h2 style="margin-top:0;">Hello ${name},</h2>

<p>Your account was successfully logged in.</p>

<table width="100%" style="margin:25px 0;font-size:14px;">
<tr>
<td style="padding:8px 0;"><strong>Device:</strong></td>
<td>${device || "Unknown Device"}</td>
</tr>
<tr>
<td style="padding:8px 0;"><strong>Location:</strong></td>
<td>${location || "Unknown Location"}</td>
</tr>
<tr>
<td style="padding:8px 0;"><strong>Time:</strong></td>
<td>${new Date().toLocaleString()}</td>
</tr>
</table>

<div style="background:#fef2f2;border-left:4px solid #ef4444;padding:15px;border-radius:6px;font-size:14px;color:#7f1d1d;">
⚠ If this wasn't you, please reset your password immediately.
</div>

<p style="margin-top:30px;">Stay secure,<br>
<strong style="color:#ef4444;">KIKSTART Security Team</strong></p>

</td>
</tr>

<tr>
<td style="background:#f9fafb;padding:20px;text-align:center;font-size:12px;color:#9ca3af;">
© 2026 KIKSTART. All rights reserved.
</td>
</tr>

</table>
</td>
</tr>
</table>

</body>
</html>
`;
};

export default loginSuccessTemplate;

