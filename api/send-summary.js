// /api/send-summary.js - Email summary endpoint
import nodemailer from 'nodemailer';

// Rate limiting for email sending
const emailRateLimitStore = new Map();
const EMAIL_RATE_LIMIT = 3; // 3 emails per hour per IP
const EMAIL_RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function isEmailRateLimited(ip) {
  const now = Date.now();
  let entry = emailRateLimitStore.get(ip);
  if (!entry || now - entry.start > EMAIL_RATE_WINDOW) {
    entry = { count: 1, start: now };
  } else {
    entry.count++;
  }
  emailRateLimitStore.set(ip, entry);
  
  // Cleanup old entries occasionally
  if (Math.random() < 0.1) {
    for (const [key, value] of emailRateLimitStore.entries()) {
      if (now - value.start > EMAIL_RATE_WINDOW) {
        emailRateLimitStore.delete(key);
      }
    }
  }
  
  return entry.count > EMAIL_RATE_LIMIT;
}

// Email configuration for Zoho
function createTransporter() {
  return nodemailer.createTransporter({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // Your Zoho email
      pass: process.env.EMAIL_PASSWORD // Your Zoho password or app-specific password
    }
  });
}

// Convert formatted text to HTML while preserving structure
function textToHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
    .replace(/═{50,}/g, '<hr style="border: 2px solid #333; margin: 20px 0;">')
    .replace(/─{30,}/g, '<hr style="border: 1px solid #666; margin: 15px 0;">')
    .replace(/•/g, '&bull;');
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export default async function handler(req, res) {
  // CORS headers
  const allowedOrigins = [
    'https://www.vetdesk.ai',
    'https://vetdesk.ai',
    'http://localhost:3000',
    'http://localhost:8080',
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*'); // For development
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.removeHeader?.('Server');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', success: false });
  }

  // Get client IP for rate limiting
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  
  // Rate limiting
  if (isEmailRateLimited(clientIP)) {
    return res.status(429).json({ 
      error: 'Too many email requests. Please try again later.', 
      success: false 
    });
  }

  try {
    const { email, subject, content, userName = 'Veteran' } = req.body;

    // Validation
    if (!email || !subject || !content) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, subject, and content are required', 
        success: false 
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format', 
        success: false 
      });
    }

    if (content.length > 50000) { // Increased limit for full conversation
      return res.status(400).json({ 
        error: 'Content too long', 
        success: false 
      });
    }

    if (subject.length > 200) {
      return res.status(400).json({ 
        error: 'Subject too long', 
        success: false 
      });
    }

    // Check if email service is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Email service not configured - missing environment variables');
      return res.status(500).json({ 
        error: 'Email service temporarily unavailable', 
        success: false 
      });
    }

    // Create email transporter
    const transporter = createTransporter();

    // Convert the formatted text content to HTML
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 20px;
      background-color: #f9f9f9;
    }
    .email-container { 
      background-color: white; 
      padding: 30px; 
      border-radius: 8px; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header { 
      color: #1e40af; 
      border-bottom: 2px solid #1e40af; 
      padding-bottom: 15px; 
      margin-bottom: 25px;
    }
    .content { 
      white-space: pre-line; 
      font-size: 14px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
    hr {
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>VetDesk™ - VA Benefits Summary</h1>
    </div>
    <div class="content">
${textToHtml(content)}
    </div>
    <div class="footer">
      <p>This email was generated by VetDesk™ - VA Benefits, Simplified.</p>
      <p>For support or questions, visit <a href="https://va.gov">VA.gov</a> or call 1-800-827-1000.</p>
    </div>
  </div>
</body>
</html>`;

    // Plain text version (fallback)
    const textContent = content;

    // Send email
    const mailOptions = {
      from: {
        name: 'VetDesk',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: subject,
      html: htmlContent,
      text: textContent
    };

    console.log(`Attempting to send email to: ${email}`);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`Email sent successfully: ${info.messageId}`);

    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: info.messageId 
    });

  } catch (error) {
    console.error('Email send error:', error);
    
    // Different error messages based on error type
    let errorMessage = 'Failed to send email. Please try again later.';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email service authentication failed';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Unable to connect to email service';
    } else if (error.responseCode === 550) {
      errorMessage = 'Invalid recipient email address';
    }

    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}
