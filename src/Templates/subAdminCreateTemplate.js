export const subAdminWelcomeTemplate = (name, password , email) => `
<div style="font-family:Arial,sans-serif;background:#fff8f8;padding:24px;color:#2b2b2b;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #f1d7d7;">
    <h1 style="margin:0 0 12px;font-size:28px;color:#ed1c24;">Welcome to Kikstart Admin</h1>
    <p style="margin:0 0 20px;font-size:16px;">Hi ${name}, your subadmin account has been created.</p>
    <div style="padding:16px;border-radius:12px;background:#fff1f1;">
      <p style="margin:0 0 8px;"><strong>Email:</strong>${email}</p>
      <p style="margin:0;"><strong>Temporary Password:</strong> ${password}</p>
    </div>
    <p style="margin:20px 0 0;font-size:14px;color:#494949;">Please login and change your password as soon as possible.</p>
  </div>
</div>
`;
