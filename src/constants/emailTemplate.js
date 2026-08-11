export const TEMPLATE_BY_EMAIL_TYPE = {
  order_created: "order_created",
  order_status_update: "shipment_update",
};

export const KYC_TEMPLATE_BY_COMPANY = {
  RGSL: "kyc_rgsl",
  MF: "kyc_mf",
  CAS: "kyc_cas",
};

export const EMAIL_TEMPLATES = {
  order_created: `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Royal Gulf Shipping – Shipment Update</title>
    <style>
      body { margin: 0; background: #f8fafc; font-family: Arial, Helvetica, sans-serif; color: #334155; }
      a { text-decoration: none; }
      .wrap { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 8px 26px rgba(2, 8, 23, 0.06); overflow: hidden; }
      .logo-bar { background: #ffffff; text-align: center; padding: 18px 0; }
      .logo { height: 52px; }
      .brand { padding: 0 22px 14px; text-align: center; }
      .brand h1 { margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: 0.2px; }
      .brand p { margin: 4px 0 0; font-size: 12px; color: #64748b; }
      .accent { height: 4px; background: #faae56; opacity: 0.9; border: 0; }
      .tag-row { position: relative; }
      .tag { position: absolute; right: 18px; top: 18px; background: #fff7ed; border: 1px solid #facc15; color: #9a6700; font-weight: 700; font-size: 12px; padding: 6px 10px; border-radius: 999px; float: right; margin: 22px 20px 0px 0px; }
      .content { padding: 24px 22px; }
      h2.title { margin: 0 0 10px; font-size: 20px; font-weight: 800; color: #0f172a; }
      p { margin: 0 0 10px; line-height: 1.55; }
      .status { background: #ecfdf5; border-left: 5px solid #f97316; border-radius: 10px; padding: 14px 16px; margin: 16px 0; }
      .status .label { font-weight: 800; color: #0f172a; font-size: 16px; }
      .status .msg { margin-top: 6px; color: #475569; font-size: 14px; white-space: pre-line; }
      table.info { width: 100%; border-collapse: collapse; margin-top: 14px; }
      .info td { padding: 7px 0; font-size: 13px; border-bottom: 1px dashed #e5e7eb; }
      .info td:first-child { width: 160px; color: #64748b; text-transform: uppercase; font-size: 11px; letter-spacing: 0.4px; }
      .cta { display: inline-block; margin: 22px 0 6px; background: linear-gradient(135deg, #faae56, #68bb75); color: #ffffff; font-weight: 800; padding: 12px 22px; border-radius: 999px; text-align: center; text-decoration: none; }
      .foot { background: #f1f5f9; padding: 18px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6; }
      .muted { font-size: 12px; color: #94a3b8; margin-top: 14px; }
    </style>
  </head>
  <body style="padding: 16px">
    <div class="wrap">
      <div class="logo-bar">
        <img class="logo" src="https://royalgulfshipping.com/wp-content/uploads/2025/09/royalgulflogo-1.jpeg" alt="Royal Gulf Shipping Logo" />
      </div>
      <div class="brand">
        <h1>Royal Gulf Shipping &amp; Logistics LLC</h1>
        <p>Dubai • London • Karachi • Shenzhen</p>
      </div>
      <hr class="accent" />
      <div class="tag-row">
        <div class="tag">&#128276; Shipment Update</div>
        <div class="content">
          <h2 class="title">Your order has been created.</h2>
          <p>Dear {{recipientName}},</p>
          <p>An order has been generated and is now pending further action.</p>
          <div class="status">
            <div class="label">&#128674; {{statusLabel}}</div>
            <div class="msg">{{statusMsg}}</div>
          </div>
          <div style="display: flex; justify-content: center; gap: 8px; margin: 8px 0 14px;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #68bb75;"></div>
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #faae56; box-shadow: 0 0 0 4px rgba(250, 174, 86, 0.3);"></div>
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #e5e7eb;"></div>
          </div>
          <table class="info" role="presentation">
            <tr><td>Ref ID</td><td><strong>{{refId}}</strong></td></tr>
            <tr><td>Order ID</td><td>{{orderId}}</td></tr>
            <tr><td>ETA</td><td>{{eta}}</td></tr>
            <tr><td>Last Updated</td><td>{{lastUpdated}}</td></tr>
          </table>
          <a class="cta" href="{{trackLink}}" target="_blank" rel="noopener noreferrer">View Live Tracking</a>
          <p class="muted" style="font-size: 10px">
            If the button above is not working, please visit the following link:
            https://trackorder.royalgulfshipping.com/ and paste your reference ID to track your shipment.
          </p>
          <p class="muted">You’re receiving this because you subscribed to shipment notifications on our website.</p>
        </div>
      </div>
      <div class="foot">
        © 2025 Royal Gulf Shipping &amp; Logistics LLC — All rights reserved.<br />
        Need help? Call +971 555 658 321 or email
        <a href="mailto:sales@royalgulfshipping.com" style="color: #68bb75">sales@royalgulfshipping.com</a>
      </div>
    </div>
  </body>
</html>`,

  shipment_update: `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Royal Gulf Shipping – Shipment Update</title>
    <style>
      body { margin: 0; background: #f8fafc; font-family: Arial, Helvetica, sans-serif; color: #334155; }
      a { text-decoration: none; }
      .wrap { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 8px 26px rgba(2, 8, 23, 0.06); overflow: hidden; }
      .logo-bar { background: #ffffff; text-align: center; padding: 18px 0; }
      .logo { height: 52px; }
      .brand { padding: 0 22px 14px; text-align: center; }
      .brand h1 { margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: 0.2px; }
      .brand p { margin: 4px 0 0; font-size: 12px; color: #64748b; }
      .accent { height: 4px; background: #faae56; opacity: 0.9; border: 0; }
      .tag-row { position: relative; }
      .tag { position: absolute; right: 18px; top: 18px; background: #fff7ed; border: 1px solid #facc15; color: #9a6700; font-weight: 700; font-size: 12px; padding: 6px 10px; border-radius: 999px; float: right; margin: 22px 20px 0px 0px; }
      .content { padding: 24px 22px; }
      h2.title { margin: 0 0 10px; font-size: 20px; font-weight: 800; color: #0f172a; }
      p { margin: 0 0 10px; line-height: 1.55; }
      .status { background: #ecfdf5; border-left: 5px solid #f97316; border-radius: 10px; padding: 14px 16px; margin: 16px 0; }
      .status .label { font-weight: 800; color: #0f172a; font-size: 16px; }
      .status .msg { margin-top: 6px; color: #475569; font-size: 14px; white-space: pre-line; }
      table.info { width: 100%; border-collapse: collapse; margin-top: 14px; }
      .info td { padding: 7px 0; font-size: 13px; border-bottom: 1px dashed #e5e7eb; }
      .info td:first-child { width: 160px; color: #64748b; text-transform: uppercase; font-size: 11px; letter-spacing: 0.4px; }
      .cta { display: inline-block; margin: 22px 0 6px; background: linear-gradient(135deg, #faae56, #68bb75); color: #ffffff; font-weight: 800; padding: 12px 22px; border-radius: 999px; text-align: center; text-decoration: none; }
      .foot { background: #f1f5f9; padding: 18px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6; }
      .muted { font-size: 12px; color: #94a3b8; margin-top: 14px; }
    </style>
  </head>
  <body style="padding: 16px">
    <div class="wrap">
      <div class="logo-bar">
        <img class="logo" src="https://royalgulfshipping.com/wp-content/uploads/2025/09/royalgulflogo-1.jpeg" alt="Royal Gulf Shipping Logo" />
      </div>
      <div class="brand">
        <h1>Royal Gulf Shipping &amp; Logistics LLC</h1>
        <p>Dubai • London • Karachi • Shenzhen</p>
      </div>
      <hr class="accent" />
      <div class="tag-row">
        <div class="tag">&#128276; Shipment Update</div>
        <div class="content">
          <h2 class="title">Your shipment status has changed</h2>
          <p>Dear {{recipientName}},</p>
          <p>We’re pleased to inform you that your shipment has a new update.</p>
          <div class="status">
            <div class="label">&#128674; {{statusLabel}}</div>
            <div class="msg">{{statusMsg}}</div>
          </div>
          <div style="display: flex; justify-content: center; gap: 8px; margin: 8px 0 14px;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #68bb75;"></div>
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #faae56; box-shadow: 0 0 0 4px rgba(250, 174, 86, 0.3);"></div>
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #e5e7eb;"></div>
          </div>
          <table class="info" role="presentation">
            <tr><td>Ref ID</td><td><strong>{{refId}}</strong></td></tr>
            <tr><td>Order ID</td><td>{{orderId}}</td></tr>
            <tr><td>Route</td><td>{{route}}</td></tr>
            <tr><td>ETA</td><td>{{eta}}</td></tr>
            <tr><td>Last Updated</td><td>{{lastUpdated}}</td></tr>
          </table>
          <a class="cta" href="{{trackLink}}" target="_blank" rel="noopener noreferrer">View Live Tracking</a>
          <p class="muted" style="font-size: 10px">
            If the button above is not working, please visit the following link:
            https://trackorder.royalgulfshipping.com/ and paste your reference ID to track your shipment.
          </p>
          <p class="muted">You’re receiving this because you subscribed to shipment notifications on our website.</p>
        </div>
      </div>
      <div class="foot">
        © 2025 Royal Gulf Shipping &amp; Logistics LLC — All rights reserved.<br />
        Need help? Call +971 555 658 321 or email
        <a href="mailto:sales@royalgulfshipping.com" style="color: #68bb75">sales@royalgulfshipping.com</a>
      </div>
    </div>
  </body>
</html>`,

  kyc_rgsl: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KYC Request · RGSL</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7fc; margin: 0; padding: 40px 20px; color: #1f2937; }
  .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 40px rgba(9, 125, 118, 0.15), 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eef2f6; }
  .header { background: linear-gradient(135deg, #097D76 0%, #06655f 100%); color: white; padding: 32px; text-align: center; border-bottom: 4px solid #F38120; }
  .logo-area { display: block; text-align: center; margin-bottom: 20px; }
  .logo-plate { display: inline-block; background: #ffffff; border-radius: 12px; padding: 12px 20px; }
  .logo-img { height: 48px; display: block; }
  .header-title { font-size: 24px; font-weight: 700; margin: 0; }
  .header-subtitle { font-size: 15px; margin: 8px 0 0; color: rgba(255,255,255,0.9); line-height: 1.4; }
  .content { padding: 36px 32px; line-height: 1.6; font-size: 15px; color: #334155; }
  .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
  .body-text { margin-bottom: 24px; }
  .btn-wrapper { text-align: center; margin: 32px 0; }
  .btn { display: inline-block; background: #097D76; color: white; text-decoration: none; padding: 14px 36px; border-radius: 40px; font-weight: 600; font-size: 16px; box-shadow: 0 6px 20px rgba(9, 125, 118, 0.3); }
  .btn-icon { margin-right: 8px; }
  .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #F38120; border-radius: 12px; padding: 20px; margin-top: 28px; }
  .info-title { font-size: 15px; font-weight: 600; color: #097D76; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .info-list { margin: 0; padding-left: 20px; color: #475569; }
  .info-list li { margin-bottom: 8px; font-size: 14px; }
  .info-list li::marker { color: #F38120; }
  .security-notice { display: flex; align-items: center; gap: 10px; background: #fff7ed; border: 1px solid #ffedd5; color: #92400e; font-size: 13px; padding: 12px 16px; border-radius: 12px; margin-top: 24px; }
  .security-icon { color: #F38120; font-size: 16px; }
  .footer { background: #0f172a; color: white; padding: 32px; text-align: center; border-top: 1px solid #e2e8f0; }
  .footer-logo { height: 36px; margin-bottom: 16px; opacity: 0.8; }
  .footer-text { font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 16px; }
  .footer-divider { height: 1px; background: #334155; margin: 20px 0; }
  .footer-copyright { font-size: 12px; color: #64748b; }
  @media (max-width: 640px) {
    body { padding: 16px; }
    .card { border-radius: 16px; }
    .header { padding: 24px 20px; }
    .content { padding: 24px 20px; }
    .footer { padding: 24px 20px; }
    .header-title { font-size: 20px; }
  }
</style>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
</head>
<body>
<div class="card">
  <div class="header">
    <div class="logo-area">
        <div class="logo-plate">
            <img src="https://royalgulfshipping.com/wp-content/uploads/2023/08/RGSL-LOGO.png" alt="Royal Gulf Shipping & Logistics" class="logo-img">
        </div>
    </div>
    <h2 class="header-title">KYC Verification Request</h2>
    <p class="header-subtitle">Action required: Please complete your KYC submission to ensure uninterrupted account access.</p>
  </div>
  <div class="content">
    <p class="greeting">Dear {{recipientName}},</p>
    <p class="body-text">We are currently updating our compliance records in accordance with international maritime and financial regulations. To maintain your active account status and ensure seamless operations, we require your updated Know Your Customer (KYC) information.</p>
    <p class="body-text">Please click the secure button below to access the submission portal and provide the necessary details. This process will take approximately 5-10 minutes.</p>
    <div class="btn-wrapper">
        <a class="btn" href="{{formUrl}}" style="display: inline-block; background: #097D76; color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 40px; font-weight: 600; font-size: 16px;">
            <i class="fas fa-shield-alt btn-icon"></i>
            Complete KYC Verification
        </a>
    </div>
    <div class="info-box">
      <div class="info-title">
        <i class="fas fa-clipboard-list"></i>
        Required Documents for Upload
      </div>
      <ul class="info-list">
        <li>Clear scanned copy of your <strong>Passport</strong> (Photo page)</li>
        <li>Scanned copy of your <strong>Emirates ID</strong> (Front and Back)</li>
        <li>Valid <strong>Trade License</strong> (If applicable for corporate accounts)</li>
      </ul>
    </div>
    <div class="security-notice">
      <i class="fas fa-lock security-icon"></i>
      <span>This link is unique to you and will expire after use. Please do not share this link with third parties.</span>
    </div>
  </div>
  <div class="footer">
    <img src="https://royalgulfshipping.com/wp-content/uploads/2023/08/RGSL-LOGO-white.png" alt="RGSL Logo" class="footer-logo">
    <div class="footer-text">
      Royal Gulf Shipping &amp; Logistics LLC<br>
      Providing world-class shipping, clearing, and forwarding solutions.
    </div>
    <div class="footer-divider"></div>
    <div class="footer-copyright">
      © {{year}} Royal Gulf Shipping LLC. All rights reserved.
      <br>
      <span style="color: #64748b; font-size: 11px; margin-top: 4px; display: block;">This is an automated compliance message. Please do not reply directly to this email.</span>
    </div>
  </div>
</div>
</body>
</html>`,

  kyc_cas: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KYC Request · Cargo Aviation System</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; margin: 0; padding: 40px 20px; color: #1f2937; }
  .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 40px rgba(4, 39, 74, 0.15), 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #dde4ed; }
  .header { background: linear-gradient(135deg, #04274a 0%, #03182d 100%); color: white; padding: 32px; text-align: center; border-bottom: 4px solid #d91423; }
  .logo-area { display: block; text-align: center; margin-bottom: 20px; }
  .logo-plate { display: inline-block; background: #ffffff; border-radius: 12px; padding: 12px 20px; }
  .logo-img { height: 48px; display: block; }
  .header-title { font-size: 24px; font-weight: 700; margin: 0; }
  .header-subtitle { font-size: 15px; margin: 8px 0 0; color: rgba(255,255,255,0.9); line-height: 1.4; }
  .content { padding: 36px 32px; line-height: 1.6; font-size: 15px; color: #334155; }
  .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
  .body-text { margin-bottom: 24px; }
  .btn-wrapper { text-align: center; margin: 32px 0; }
  .btn { display: inline-block; background: #04274a; color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 40px; font-weight: 600; font-size: 16px; box-shadow: 0 6px 20px rgba(4, 39, 74, 0.3); }
  .btn-icon { margin-right: 8px; }
  .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #d91423; border-radius: 12px; padding: 20px; margin-top: 28px; }
  .info-title { font-size: 15px; font-weight: 600; color: #04274a; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .info-list { margin: 0; padding-left: 20px; color: #475569; }
  .info-list li { margin-bottom: 8px; font-size: 14px; }
  .info-list li::marker { color: #d91423; }
  .security-notice { display: flex; align-items: center; gap: 10px; background: #fff1f2; border: 1px solid #fecdd3; color: #9f1239; font-size: 13px; padding: 12px 16px; border-radius: 12px; margin-top: 24px; }
  .security-icon { color: #d91423; font-size: 16px; }
  .footer { background: #03182d; color: white; padding: 32px; text-align: center; border-top: 1px solid #1e3a55; }
  .footer-logo { height: 40px; margin-bottom: 16px; opacity: 0.85; }
  .footer-text { font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 16px; }
  .footer-divider { height: 1px; background: #1e3a55; margin: 20px 0; }
  .footer-copyright { font-size: 12px; color: #64748b; }
  @media (max-width: 640px) {
    body { padding: 16px; }
    .card { border-radius: 16px; }
    .header { padding: 24px 20px; }
    .content { padding: 24px 20px; }
    .footer { padding: 24px 20px; }
    .header-title { font-size: 20px; }
  }
</style>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
</head>
<body>
<div class="card">
  <div class="header">
    <div class="logo-area">
      <div class="logo-plate">
        <img src="https://www.cargoas.com/wp-content/uploads/2026/02/Cargo-Avaiation-Logo.png.webp" alt="Cargo Aviation System" class="logo-img">
      </div>
    </div>
    <h2 class="header-title">KYC Verification Request</h2>
    <p class="header-subtitle">Action required: Please complete your KYC submission to ensure uninterrupted account access.</p>
  </div>
  <div class="content">
    <p class="greeting">Dear {{recipientName}},</p>
    <p class="body-text">We are currently updating our compliance records in accordance with international aviation and freight regulations. To maintain your active account status and ensure seamless operations, we require your updated Know Your Customer (KYC) information.</p>
    <p class="body-text">Please click the secure button below to access the submission portal and provide the necessary details. This process will take approximately 5-10 minutes.</p>
    <div class="btn-wrapper">
      <a class="btn" href="{{formUrl}}" style="display: inline-block; background: #04274a; color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 40px; font-weight: 600; font-size: 16px;">
        <i class="fas fa-shield-alt btn-icon"></i>
        Complete KYC Verification
      </a>
    </div>
    <div class="info-box">
      <div class="info-title">
        <i class="fas fa-clipboard-list"></i>
        Required Documents for Upload
      </div>
      <ul class="info-list">
        <li>Clear scanned copy of your <strong>Passport</strong> (Photo page)</li>
        <li>Scanned copy of your <strong>Emirates ID</strong> (Front and Back)</li>
        <li>Valid <strong>Trade License</strong> (If applicable for corporate accounts)</li>
      </ul>
    </div>
    <div class="security-notice">
      <i class="fas fa-lock security-icon"></i>
      <span>This link is unique to you and will expire after use. Please do not share this link with third parties.</span>
    </div>
  </div>
  <div class="footer">
    <img src="https://www.cargoas.com/wp-content/uploads/2026/02/Cargo-Avaiation-Logo.png.webp" alt="Cargo Aviation System" class="footer-logo">
    <div class="footer-text">
      Cargo Aviation System<br>
      Providing world-class air freight and logistics solutions.
    </div>
    <div class="footer-divider"></div>
    <div class="footer-copyright">
      © {{year}} Cargo Aviation System. All rights reserved.
      <br>
      <span style="color: #64748b; font-size: 11px; margin-top: 4px; display: block;">This is an automated compliance message. Please do not reply directly to this email.</span>
    </div>
  </div>
</div>
</body>
</html>`,

  kyc_mf: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KYC Request · Messiah Freight</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f5fb; margin: 0; padding: 40px 20px; color: #1f2937; }
  .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 40px rgba(52, 65, 159, 0.15), 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e0e3f5; }
  .header { background: linear-gradient(135deg, #34419F 0%, #252e7a 100%); color: white; padding: 32px; text-align: center; border-bottom: 4px solid #F46A17; }
  .logo-area { display: block; text-align: center; margin-bottom: 20px; }
  .logo-plate { display: inline-block; background: rgba(255,255,255,0.12); border-radius: 12px; padding: 12px 20px; }
  .logo-img { height: 48px; display: block; }
  .header-title { font-size: 24px; font-weight: 700; margin: 0; }
  .header-subtitle { font-size: 15px; margin: 8px 0 0; color: rgba(255,255,255,0.9); line-height: 1.4; }
  .content { padding: 36px 32px; line-height: 1.6; font-size: 15px; color: #334155; }
  .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
  .body-text { margin-bottom: 24px; }
  .btn-wrapper { text-align: center; margin: 32px 0; }
  .btn { display: inline-block; background: #34419F; color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 40px; font-weight: 600; font-size: 16px; box-shadow: 0 6px 20px rgba(52, 65, 159, 0.35); }
  .btn-icon { margin-right: 8px; }
  .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #F46A17; border-radius: 12px; padding: 20px; margin-top: 28px; }
  .info-title { font-size: 15px; font-weight: 600; color: #34419F; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .info-list { margin: 0; padding-left: 20px; color: #475569; }
  .info-list li { margin-bottom: 8px; font-size: 14px; }
  .info-list li::marker { color: #F46A17; }
  .security-notice { display: flex; align-items: center; gap: 10px; background: #fff7ed; border: 1px solid #ffedd5; color: #92400e; font-size: 13px; padding: 12px 16px; border-radius: 12px; margin-top: 24px; }
  .security-icon { color: #F46A17; font-size: 16px; }
  .footer { background: #1a2060; color: white; padding: 32px; text-align: center; border-top: 1px solid #2d3a8c; }
  .footer-logo { height: 40px; margin-bottom: 16px; opacity: 0.9; }
  .footer-text { font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 16px; }
  .footer-divider { height: 1px; background: #2d3a8c; margin: 20px 0; }
  .footer-copyright { font-size: 12px; color: #64748b; }
  @media (max-width: 640px) {
    body { padding: 16px; }
    .card { border-radius: 16px; }
    .header { padding: 24px 20px; }
    .content { padding: 24px 20px; }
    .footer { padding: 24px 20px; }
    .header-title { font-size: 20px; }
  }
</style>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
</head>
<body>
<div class="card">
  <div class="header">
    <div class="logo-area">
      <div class="logo-plate">
        <img src="https://messiahfreight.co.uk/wp-content/uploads/2023/10/mfd-white.png" alt="Messiah Freight" class="logo-img">
      </div>
    </div>
    <h2 class="header-title">KYC Verification Request</h2>
    <p class="header-subtitle">Action required: Please complete your KYC submission to ensure uninterrupted account access.</p>
  </div>
  <div class="content">
    <p class="greeting">Dear {{recipientName}},</p>
    <p class="body-text">We are currently updating our compliance records in accordance with international freight and customs regulations. To maintain your active account status and ensure seamless operations, we require your updated Know Your Customer (KYC) information.</p>
    <p class="body-text">Please click the secure button below to access the submission portal and provide the necessary details. This process will take approximately 5-10 minutes.</p>
    <div class="btn-wrapper">
      <a class="btn" href="{{formUrl}}" style="display: inline-block; background: #34419F; color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 40px; font-weight: 600; font-size: 16px;">
        <i class="fas fa-shield-alt btn-icon"></i>
        Complete KYC Verification
      </a>
    </div>
    <div class="info-box">
      <div class="info-title">
        <i class="fas fa-clipboard-list"></i>
        Required Documents for Upload
      </div>
      <ul class="info-list">
        <li>Clear scanned copy of your <strong>Passport</strong> (Photo page)</li>
        <li>Scanned copy of your <strong>Emirates ID</strong> (Front and Back)</li>
        <li>Valid <strong>Trade License</strong> (If applicable for corporate accounts)</li>
      </ul>
    </div>
    <div class="security-notice">
      <i class="fas fa-lock security-icon"></i>
      <span>This link is unique to you and will expire after use. Please do not share this link with third parties.</span>
    </div>
  </div>
  <div class="footer">
    <img src="https://messiahfreight.co.uk/wp-content/uploads/2023/10/mfd-white.png" alt="Messiah Freight" class="footer-logo">
    <div class="footer-text">
      Messiah Freight Delivery Ltd<br>
      Reliable freight and delivery solutions across the UK and beyond.
    </div>
    <div class="footer-divider"></div>
    <div class="footer-copyright">
      © {{year}} Messiah Freight Delivery Ltd. All rights reserved.
      <br>
      <span style="color: #64748b; font-size: 11px; margin-top: 4px; display: block;">This is an automated compliance message. Please do not reply directly to this email.</span>
    </div>
  </div>
</div>
</body>
</html>`,
};
