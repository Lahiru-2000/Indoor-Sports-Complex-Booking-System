# Contact Form Email Template

This is the EmailJS template code for contact form submissions. Use this template in your EmailJS dashboard.

## Template Setup Instructions

1. Go to [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Navigate to **Email Templates**
3. Click **Create New Template**
4. Name it: **Contact Form Template**
5. Copy the template code below into the template editor

## Template Configuration

### Subject:
```
{{subject}}
```

### Content (HTML):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
    }
    .content {
      padding: 30px 20px;
      background-color: #ffffff;
    }
    .intro-text {
      font-size: 16px;
      color: #666666;
      margin-bottom: 25px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    .info-section {
      margin-bottom: 25px;
    }
    .info-label {
      font-size: 12px;
      font-weight: 600;
      color: #10b981;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .info-value {
      font-size: 16px;
      color: #1f2937;
      font-weight: 500;
      word-break: break-word;
    }
    .message-box {
      background-color: #f9fafb;
      border-left: 4px solid #10b981;
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .message-box .info-label {
      margin-bottom: 10px;
    }
    .message-content {
      font-size: 15px;
      color: #374151;
      line-height: 1.8;
      white-space: pre-wrap;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
      margin-bottom: 25px;
    }
    .info-item {
      padding: 15px;
      background-color: #f9fafb;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    .footer {
      background-color: #1f2937;
      color: #9ca3af;
      padding: 20px;
      text-align: center;
      font-size: 12px;
    }
    .footer p {
      margin: 5px 0;
    }
    .timestamp {
      font-size: 13px;
      color: #6b7280;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }
      .content {
        padding: 20px 15px !important;
      }
      .header {
        padding: 20px 15px !important;
      }
      .header h1 {
        font-size: 24px !important;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <h1>Prime Play</h1>
      <p style="margin-top: 10px; font-size: 14px; opacity: 0.9;">New Contact Form Submission</p>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="intro-text">
        You have received a new message through the Prime Play contact form.
      </div>

      <!-- Contact Information -->
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">From</div>
          <div class="info-value">{{from_name}}</div>
        </div>
        
        <div class="info-item">
          <div class="info-label">Email Address</div>
          <div class="info-value">
            <a href="mailto:{{from_email}}" style="color: #10b981; text-decoration: none;">{{from_email}}</a>
          </div>
        </div>
      </div>

      <!-- Message -->
      <div class="message-box">
        <div class="info-label">Message</div>
        <div class="message-content">{{message}}</div>
      </div>

      <!-- Timestamp -->
      <div class="timestamp">
        <strong>Submitted:</strong> {{submitted_date}} at {{submitted_time}}
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>Prime Play</strong></p>
      <p>Indoor Stadium Booking System</p>
      <p style="margin-top: 10px; font-size: 11px;">This is an automated email from the Prime Play contact form.</p>
    </div>
  </div>
</body>
</html>
```

## Right Side Configuration (Email Settings)

In the EmailJS template editor, configure the right side settings:

- **To Email:** `{{to_email}}`
- **From Name:** `Prime Play Contact Form`
- **From Email:** Use your default email address (or the one configured in your Email Service)
- **Reply To:** `{{from_email}}` (This allows you to reply directly to the user)
- **Bcc:** (Leave empty)
- **Cc:** (Leave empty)

## Environment Variable

After creating the template, add this to your `.env` file:

```env
VITE_EMAILJS_CONTACT_TEMPLATE_ID=your_contact_template_id_here
```

Replace `your_contact_template_id_here` with the actual Template ID from EmailJS (you'll see it after creating the template).

## Template Variables Used

The template uses these variables (all are automatically provided by the code):

- `{{to_email}}` - Admin email address
- `{{subject}}` - Email subject (includes the user's subject)
- `{{from_name}}` - User's name
- `{{from_email}}` - User's email address
- `{{message}}` - User's message content
- `{{submitted_date}}` - Date when the form was submitted
- `{{submitted_time}}` - Time when the form was submitted

## Features

- ✅ Clean, professional design
- ✅ Mobile responsive
- ✅ Easy to read layout
- ✅ Reply-to set to user's email for easy responses
- ✅ Timestamp included
- ✅ Branded with Prime Play colors

## Testing

After setting up the template:

1. Go to your Contact Us page
2. Fill out and submit the form
3. Check the admin email inbox
4. The email should display beautifully with all contact details

