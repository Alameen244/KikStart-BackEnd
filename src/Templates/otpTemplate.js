const otpTemplate = (generateOtp) => {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>OTP Verification</title>
</head>

<body style="margin:0;padding:0;background:#f3f4f6;font-family:Segoe UI,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;margin:40px 0;border-radius:12px;overflow:hidden;box-shadow:0 8px 25px rgba(0,0,0,0.05);">

<tr>
<td style="background:linear-gradient(135deg,#ef4444,#f97316);padding:40px;text-align:center;color:#ffffff;">
<h1 style="margin:0;font-size:26px;">Verify Your Account 🔐</h1>
<p style="margin:10px 0 0 0;font-size:15px;opacity:0.9;">One-Time Password</p>
</td>
</tr>

<tr>
<td style="padding:40px 35px;color:#374151;font-size:15px;line-height:1.7;">

<h2 style="margin-top:0;">Hello User,</h2>

<p>Please use the OTP below to complete your verification process.</p>

<div style="text-align:center;margin:35px 0;">
<div style="display:inline-block;padding:18px 35px;background:#f3f4f6;border-radius:10px;font-size:32px;font-weight:bold;letter-spacing:8px;color:#111827;">
${generateOtp}
</div>
</div>

<div style="background:#fff7ed;border-left:4px solid #f97316;padding:15px;border-radius:6px;font-size:14px;color:#92400e;">
⚠ This OTP is valid for 3 minutes. Do not share it with anyone.
</div>

<p style="margin-top:25px;">If you didn’t request this, you can safely ignore this email.</p>

<p style="margin-top:30px;">Stay secure,<br><strong style="color:#ef4444;"push>KIKSTART Team</strong></p>

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
</html>
`;
};

export default otpTemplate;
