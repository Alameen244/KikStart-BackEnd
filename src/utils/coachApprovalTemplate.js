export const coachApprovalTemplate = ({
  name,
  actionLabel,
  approveUrl,
  rejectUrl,
  expiresAt,
}) => {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Coach Approval Required</title>
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
<h1 style="margin:0;font-size:26px;">Approval Required ✋</h1>
<p style="margin:10px 0 0;font-size:15px;opacity:0.9;">
A change has been requested for your coach account.
</p>
</td>
</tr>

<!-- Content -->
<tr>
<td style="padding:40px 35px;color:#374151;font-size:15px;line-height:1.7;">

<h2 style="margin-top:0;">Hello ${name},</h2>

<p>
An administrator has requested the following change to your
<strong>KIKSTART Coach Account</strong>.
</p>

<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:18px;margin:25px 0;">
<strong>Requested Action</strong>
<p style="margin:10px 0 0;font-size:15px;color:#111827;">
${actionLabel}
</p>
</div>

<p>
Please review the request and choose one of the options below.
</p>

<table cellpadding="0" cellspacing="0" style="margin:30px auto;">
<tr>

<td align="center" style="padding-right:10px;">
<a href="${approveUrl}"
style="background:#16a34a;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:600;display:inline-block;">
Approve
</a>
</td>

<td align="center">
<a href="${rejectUrl}"
style="background:#dc2626;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:600;display:inline-block;">
Reject
</a>
</td>

</tr>
</table>

<div style="background:#fefce8;border-left:4px solid #eab308;padding:15px;border-radius:6px;font-size:14px;color:#713f12;">
⏳ <strong>Important:</strong><br>
If no action is taken before
<strong>${expiresAt}</strong>,
the administrator will be able to apply this change automatically.
</div>

<p style="margin-top:30px;">
Thank you for helping us keep your account secure.
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