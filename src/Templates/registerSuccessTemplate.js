const registerSuccessTemplate = (name) => {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Registration Successful</title>
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
<td style="background:linear-gradient(135deg,#10b981,#059669);padding:40px;text-align:center;color:#ffffff;">
<h1 style="margin:0;font-size:26px;">Welcome to KIKSTART 🚀</h1>
<p style="margin:10px 0 0 0;font-size:15px;opacity:0.9;">Your account has been created</p>
</td>
</tr>

<tr>
<td style="padding:40px 35px;color:#374151;font-size:15px;line-height:1.7;">

<h2 style="margin-top:0;">Hello ${name},</h2>

<p>Congratulations! Your account has been successfully created.</p>

<p>You can now log in and start exploring all the features of our platform.</p>

<div style="text-align:center;margin:35px 0;">
<a href="http://localhost:5100/" style="background:#e5b7fa;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
Go to KIKSTART
</a>
</div>

<p>If you did not create this account, please contact our support immediately.</p>

<p style="margin-top:30px;">Best regards,<br>
<strong style="color:#ef4444;">KIKSTART Team</strong></p>

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

export default registerSuccessTemplate;

