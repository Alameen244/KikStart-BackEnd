const coachWelcomeTemplate = (name, email, temporaryPassword) => {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Welcome to KIKSTART</title>
</head>

<body style="margin:0;padding:0;background:#f3f4f6;font-family:Segoe UI,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;margin:40px 0;border-radius:12px;overflow:hidden;box-shadow:0 8px 25px rgba(0,0,0,0.05);">

<!-- Logo -->
<tr>
<td style="padding:24px 0 8px;text-align:center;background:#ffffff;">
<img src="cid:kikstart-logo" alt="KIKSTART" style="width:170px;max-width:80%;height:auto;display:block;margin:0 auto;">
</td>
</tr>

<!-- Header -->
<tr>
<td style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:40px;text-align:center;color:#ffffff;">
<h1 style="margin:0;font-size:26px;">Welcome to KIKSTART 🎉</h1>
<p style="margin:10px 0 0 0;font-size:15px;opacity:0.9;">
Your Coach Account Has Been Created
</p>
</td>
</tr>

<!-- Content -->
<tr>
<td style="padding:40px 35px;color:#374151;font-size:15px;line-height:1.7;">

<h2 style="margin-top:0;">Hello ${name},</h2>

<p>
Welcome to <strong>KIKSTART</strong>! Your coach account has been successfully created.
Please use the credentials below to sign in.
</p>

<table width="100%" style="margin:25px 0;font-size:14px;">
<tr>
<td style="padding:8px 0;"><strong>Name:</strong></td>
<td>${name}</td>
</tr>

<tr>
<td style="padding:8px 0;"><strong>Email:</strong></td>
<td>${email}</td>
</tr>

<tr>
<td style="padding:8px 0;"><strong>Temporary Password:</strong></td>
<td><strong>${temporaryPassword}</strong></td>
</tr>
</table>

<div style="background:#fefce8;border-left:4px solid #eab308;padding:15px;border-radius:6px;font-size:14px;color:#713f12;">
🔒 <strong>Security Notice:</strong><br>
This is a temporary password. Please log in and change your password immediately to keep your account secure.
</div>

<p style="margin-top:30px;">
We look forward to having you as part of the KIKSTART coaching team.
</p>

<p>
Best regards,<br>
<strong style="color:#4f46e5;">KIKSTART Team</strong>
</p>

</td>
</tr>

<!-- Footer -->
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

export default coachWelcomeTemplate;