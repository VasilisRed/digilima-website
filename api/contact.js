// Serverless function for handling contact form submissions with Resend
// This file can be deployed to Vercel, Netlify, or similar platforms

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      name, 
      email, 
      phone, 
      company, 
      budget, 
      projectType, 
      message, 
      consent,
      website // honeypot field
    } = req.body;

    // Basic validation
    if (!name || !email || !message || !consent) {
      return res.status(400).json({ 
        error: 'Missing required fields. Please fill in all required information.' 
      });
    }

    // Honeypot check
    if (website) {
      return res.status(400).json({ 
        error: 'Form submission failed. Please try again.' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Please enter a valid email address.' 
      });
    }

    // Prepare email content
    const currentDate = new Date().toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Athens'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission - DigiLima</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: white; padding: 20px; text-align: center; }
          .content { background: #f8f9fa; padding: 30px; }
          .field { margin-bottom: 20px; }
          .field-label { font-weight: bold; color: #2563EB; display: block; margin-bottom: 5px; }
          .field-value { background: white; padding: 10px; border-radius: 5px; border-left: 3px solid #2563EB; }
          .footer { background: #1f2937; color: white; padding: 20px; text-align: center; font-size: 14px; }
          .priority-high { border-left-color: #ef4444; }
          .priority-medium { border-left-color: #f59e0b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 New Contact Form Submission</h1>
            <p>DigiLima.com - ${currentDate}</p>
          </div>
          
          <div class="content">
            <div class="field">
              <label class="field-label">👤 Name</label>
              <div class="field-value">${name}</div>
            </div>
            
            <div class="field">
              <label class="field-label">📧 Email</label>
              <div class="field-value"><a href="mailto:${email}" style="color: #2563EB; text-decoration: none;">${email}</a></div>
            </div>
            
            ${phone ? `
            <div class="field">
              <label class="field-label">📱 Phone</label>
              <div class="field-value"><a href="tel:${phone}" style="color: #2563EB; text-decoration: none;">${phone}</a></div>
            </div>
            ` : ''}
            
            ${company ? `
            <div class="field">
              <label class="field-label">🏢 Company</label>
              <div class="field-value">${company}</div>
            </div>
            ` : ''}
            
            ${budget ? `
            <div class="field">
              <label class="field-label">💰 Budget Range</label>
              <div class="field-value ${budget.includes('10000+') ? 'priority-high' : budget.includes('5000') ? 'priority-medium' : ''}">${budget}</div>
            </div>
            ` : ''}
            
            ${projectType ? `
            <div class="field">
              <label class="field-label">🎯 Project Type</label>
              <div class="field-value">${projectType}</div>
            </div>
            ` : ''}
            
            <div class="field">
              <label class="field-label">💬 Message</label>
              <div class="field-value" style="white-space: pre-wrap;">${message}</div>
            </div>
            
            <div class="field">
              <label class="field-label">✅ GDPR Consent</label>
              <div class="field-value">✓ Customer has provided consent to be contacted</div>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>Next Steps:</strong></p>
            <p>• Respond within 2 hours during business hours</p>
            <p>• Add contact details to CRM system</p>
            <p>• Schedule follow-up call if budget > €5,000</p>
            <hr style="border: 0; border-top: 1px solid #374151; margin: 20px 0;">
            <p>DigiLima - Web Development Services<br>
            📍 Limassol, Cyprus | 📧 hello@digilima.com | 📱 +357 99 123 456</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
New Contact Form Submission - DigiLima.com

Submitted: ${currentDate}

Contact Information:
Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
${company ? `Company: ${company}` : ''}

Project Details:
${budget ? `Budget: ${budget}` : ''}
${projectType ? `Project Type: ${projectType}` : ''}

Message:
${message}

GDPR Consent: ✓ Provided

---
DigiLima - Web Development Services
Limassol, Cyprus
hello@digilima.com | +357 99 123 456
    `;

    // Send email using Resend
    const emailData = await resend.emails.send({
      from: 'DigiLima Contact Form <noreply@digilima.com>',
      to: ['hello@digilima.com'],
      replyTo: email,
      subject: `New Contact: ${name} - ${projectType || 'General Inquiry'} ${budget ? `(${budget})` : ''}`,
      html: htmlContent,
      text: textContent,
      tags: [
        {
          name: 'source',
          value: 'contact_form'
        },
        {
          name: 'budget',
          value: budget || 'not_specified'
        },
        {
          name: 'project_type',
          value: projectType || 'general'
        }
      ],
    });

    // Send auto-reply to the customer
    const autoReplyHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank you for contacting DigiLima</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: white; padding: 20px; text-align: center; }
          .content { background: #f8f9fa; padding: 30px; }
          .cta-button { display: inline-block; background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { background: #1f2937; color: white; padding: 20px; text-align: center; font-size: 14px; }
          .contact-info { background: white; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 3px solid #2563EB; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank you, ${name}!</h1>
            <p>We've received your message</p>
          </div>
          
          <div class="content">
            <p>Dear ${name},</p>
            
            <p>Thank you for reaching out to DigiLima! We've received your inquiry about ${projectType || 'your project'} and we're excited to learn more about how we can help.</p>
            
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>We'll review your project details and requirements</li>
              <li>You'll receive a personal response from our team within 2-4 hours during business hours</li>
              <li>We'll schedule a consultation call to discuss your project in detail</li>
              <li>You'll receive a detailed proposal within 24-48 hours</li>
            </ul>
            
            <div class="contact-info">
              <p><strong>In the meantime, here are a few things you can do:</strong></p>
              <ul>
                <li>📂 Check out our <a href="https://digilima.com/portfolio/" style="color: #2563EB;">recent projects</a> for inspiration</li>
                <li>📖 Read our <a href="https://digilima.com/blog/" style="color: #2563EB;">blog</a> for web development insights</li>
                <li>📱 Connect with us on social media for updates and tips</li>
              </ul>
            </div>
            
            <p>If you have any urgent questions, feel free to reach out directly:</p>
            <p>📧 <a href="mailto:hello@digilima.com" style="color: #2563EB;">hello@digilima.com</a><br>
            📱 <a href="tel:+35799123456" style="color: #2563EB;">+357 99 123 456</a></p>
            
            <p>We look forward to working with you!</p>
            
            <p>Best regards,<br>
            <strong>DigiLima Team</strong><br>
            Web Development Specialists</p>
          </div>
          
          <div class="footer">
            <p>DigiLima - Lightning-fast websites for growing businesses</p>
            <p>📍 Limassol, Cyprus | 🌐 <a href="https://digilima.com" style="color: white;">digilima.com</a></p>
            <p style="font-size: 12px; margin-top: 20px; opacity: 0.8;">
              You're receiving this email because you contacted us through our website. 
              We respect your privacy and follow GDPR guidelines.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const autoReplyText = `
Dear ${name},

Thank you for reaching out to DigiLima! We've received your inquiry about ${projectType || 'your project'} and we're excited to learn more about how we can help.

What happens next?
- We'll review your project details and requirements
- You'll receive a personal response from our team within 2-4 hours during business hours
- We'll schedule a consultation call to discuss your project in detail
- You'll receive a detailed proposal within 24-48 hours

In the meantime, check out our recent projects at https://digilima.com/portfolio/ for inspiration.

If you have any urgent questions, feel free to reach out directly:
📧 hello@digilima.com
📱 +357 99 123 456

We look forward to working with you!

Best regards,
DigiLima Team
Web Development Specialists

---
DigiLima - Lightning-fast websites for growing businesses
Limassol, Cyprus | https://digilima.com
    `;

    // Send auto-reply
    await resend.emails.send({
      from: 'DigiLima <hello@digilima.com>',
      to: [email],
      subject: `Thank you for contacting DigiLima - We'll be in touch soon!`,
      html: autoReplyHtml,
      text: autoReplyText,
      tags: [
        {
          name: 'type',
          value: 'auto_reply'
        }
      ],
    });

    console.log('Email sent successfully:', emailData.id);

    // Return success response
    return res.status(200).json({ 
      success: true, 
      message: 'Thank you! Your message has been sent successfully. We\'ll get back to you within 24 hours.',
      emailId: emailData.id
    });

  } catch (error) {
    console.error('Contact form error:', error);
    
    return res.status(500).json({ 
      error: 'Sorry, there was an error sending your message. Please try again or contact us directly at hello@digilima.com.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}