const COMPANY = {
  name: "CoinlyBitora",
  supportEmail: "support@coinlybitora.com",
  phone: "+1 (329) 238-0365",
  website: "https://www.coinlybitora.com",
  logo: "https://www.coinlybitora.com/icon.png",
};

interface EmailTemplateProps {
  title: string;
  subtitle?: string;
  customerName?: string;
  content: string;
  summary?: string;
  buttonText: string;
  buttonLink: string;
}
export function emailTemplate({
  title,
  subtitle = "",
  customerName = "Customer",
  content,
  summary = "",
  buttonText,
  buttonLink,
}: EmailTemplateProps) {
  return `
<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width,initial-scale=1.0">

<title>${title}</title>

</head>

<body style="
margin:0;
padding:40px 0;
background:#edf2f7;
font-family:Arial,Helvetica,sans-serif;
">
<div
style="
display:none;
font-size:1px;
color:#fff;
line-height:1px;
max-height:0;
max-width:0;
opacity:0;
overflow:hidden;
">

${subtitle || title}

</div>
<table
width="100%"
cellpadding="0"
cellspacing="0"
role="presentation">

<tr>

<td align="center">

<table
role="presentation"
style="
max-width:680px;
width:100%;
background:#ffffff;
border-radius:16px;
overflow:hidden;
border:1px solid #e6e6e6;
">

<tr>

<td style="height:6px;background:#C9A227;"></td>

</tr>

<tr>

<td
align="center"
style="
padding:45px 40px;
background:#111111;
">

<img
src="${COMPANY.logo}"
width="110"
alt="${COMPANY.name}"
style="display:block;border:0;">

<div
style="
margin-top:20px;
font-size:38px;
font-weight:700;
color:#D4AF37;
">

${COMPANY.name}

</div>

<div
style="
margin-top:10px;
font-size:13px;
letter-spacing:6px;
color:white;
">

Digital Asset Exchange

</div>

<div
style="
width:80px;
height:2px;
background:#D4AF37;
margin:25px auto;
">

</div>

<div
style="
font-size:12px;
color:#b7b7b7;
letter-spacing:2px;
">

SECURE • TRUSTED • PROFESSIONAL

</div>

</td>

</tr>

<tr>

<td style="padding:45px 55px 10px;">

<div
style="
font-size:34px;
font-weight:bold;
color:#111;
">

${title}

</div>

<div
style="
margin-top:14px;
width:70px;
height:4px;
background:#D4AF37;
border-radius:2px;
">

</div>

</td>

</tr>

<tr>

<td
style="
padding:25px 55px 50px;
font-size:16px;
line-height:30px;
color:#555;
">

Dear <strong>${customerName}</strong>,

<br><br>

${content}

<br><br>

<table
align="center"
cellpadding="0"
cellspacing="0">

<tr>

<td
style="
background:linear-gradient(90deg,#06B6D4,#22D3EE);
border-radius:8px;
">

<a
href="${buttonLink}"
style="
display:inline-block;
padding:16px 42px;
text-decoration:none;
font-weight:bold;
font-size:15px;
color:white;
">

${buttonText}

</a>

</td>

</tr>

</table>

<br><br><br>

Warm Regards,

<br><br>

<strong
style="
font-size:17px;
">

${COMPANY.name} Support Team

</strong>

</td>

</tr>

<tr>

<td style="padding:0 55px 40px;">

<table
width="100%"
style="
background:#fafafa;
border:1px solid #ececec;
border-radius:10px;
">

<tr>

<td style="padding:25px;">

<div
style="
font-size:18px;
font-weight:bold;
color:#C9A227;
">

Need Help?

</div>

<div
style="
margin-top:12px;
font-size:14px;
color:#666;
">

Our support team is available 24/7 to assist you.

</div>

<div
style="
margin-top:18px;
font-size:14px;
line-height:30px;
color:#555;
">

Email

<br>

<strong>${COMPANY.supportEmail}</strong>

<br><br>

Phone

<br>

<strong>${COMPANY.phone}</strong>

<br><br>

Website

<br>

<strong>${COMPANY.website}</strong>

</div>

</td>

<td
width="150"
align="center">

<img
src="${COMPANY.logo}"
width="80"
alt="${COMPANY.name}">

</td>

</tr>

</table>

</td>

</tr>

<tr>

<td
style="
background:#111111;
padding:35px;
text-align:center;
">

<div
style="
color:white;
font-size:13px;
">

© ${new Date().getFullYear()} ${COMPANY.name}

</div>

<div
style="
margin-top:10px;
font-size:12px;
letter-spacing:2px;
color:#D4AF37;
">

SECURE • TRUSTED • PROFESSIONAL

</div>

<div
style="
margin-top:22px;
font-size:11px;
line-height:20px;
color:#999;
">

This email and any attachments may contain confidential information intended only for the recipient. If you received this message in error, please notify the sender immediately and permanently delete it.

</div>

</td>

</tr>

</table>

</td>

</tr>

</table>

</body>

</html>
`;
}