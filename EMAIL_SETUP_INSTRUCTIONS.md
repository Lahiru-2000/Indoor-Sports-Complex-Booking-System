# Email Setup Instructions - Quick Start

## Step 1: Install EmailJS Package

Run this command in your project directory:

```bash
npm install @emailjs/browser
```

## Step 2: Sign Up for EmailJS

1. Go to https://www.emailjs.com/
2. Sign up for a free account (200 emails/month free)
3. Verify your email address

## Step 3: Create Email Service

1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions
5. **Copy the Service ID** (you'll need it)

## Step 4: Create Email Template

1. Go to **Email Templates** in EmailJS dashboard
2. Click **Create New Template**
3. Use this template structure:

**Template Name:** Prime Play Confirmation

**Subject:** {{subject}}

**Content (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .info-row { margin: 10px 0; padding: 8px; background-color: white; border-radius: 4px; }
    .info-label { font-weight: bold; color: #10b981; }
    .items-list { background-color: white; padding: 15px; border-radius: 4px; margin: 10px 0; }
    .item { padding: 5px 0; border-bottom: 1px solid #e5e7eb; }
    .item:last-child { border-bottom: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Prime Play</h1>
    </div>
    <div class="content">
      <h2>{{type}}</h2>
      <p>{{message}}</p>
      
      {{#if complex_name}}
      <div class="info-row">
        <span class="info-label">Complex:</span> {{complex_name}}
      </div>
      {{/if}}
      
      {{#if sport}}
      <div class="info-row">
        <span class="info-label">Sport:</span> {{sport}}
      </div>
      {{/if}}
      
      {{#if date}}
      <div class="info-row">
        <span class="info-label">Date:</span> {{date}}
      </div>
      {{/if}}
      
      {{#if time_slot}}
      <div class="info-row">
        <span class="info-label">Time Slot:</span> {{time_slot}}
      </div>
      {{/if}}
      
      {{#if hours}}
      <div class="info-row">
        <span class="info-label">Duration:</span> {{hours}} hour(s)
      </div>
      {{/if}}
      
      {{#if coach}}
      <div class="info-row">
        <span class="info-label">Coach:</span> {{coach}}
      </div>
      {{/if}}
      
      {{#if items}}
      <div class="items-list">
        <strong>Order Items:</strong>
        <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">{{items}}</pre>
      </div>
      {{/if}}
      
      {{#if items_count}}
      <div class="info-row">
        <span class="info-label">Items Count:</span> {{items_count}}
      </div>
      {{/if}}
      
      <div class="info-row" style="background-color: #10b981; color: white; font-size: 18px; font-weight: bold;">
        <span>Total: {{total}}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Status:</span> {{status}}
      </div>
      
      {{#if booking_id}}
      <div class="info-row">
        <span class="info-label">Booking ID:</span> {{booking_id}}
      </div>
      {{/if}}
      
      {{#if order_id}}
      <div class="info-row">
        <span class="info-label">Order ID:</span> {{order_id}}
      </div>
      {{/if}}
    </div>
    <div class="footer">
      <p>© 2025 Prime Play. All rights reserved.</p>
      <p>Thank you for choosing Prime Play!</p>
    </div>
  </div>
</body>
</html>
```

4. **Copy the Template ID** (you'll need it)

## Step 5: Get Your Public Key

1. Go to **Account** → **General** in EmailJS dashboard
2. Find your **Public Key**
3. **Copy the Public Key**

## Step 6: Configure Environment Variables

Create a `.env` file in your project root (if it doesn't exist):

```env
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

**Important:** In Vite, environment variables must start with `VITE_` prefix (not `REACT_APP_`).

Replace:
- `your_service_id_here` with your EmailJS Service ID
- `your_template_id_here` with your EmailJS Template ID
- `your_public_key_here` with your EmailJS Public Key

## Step 7: Restart Your Development Server

After adding the `.env` file:

```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 8: Test the Email Functionality

1. Make a test booking, restaurant purchase, or equipment purchase
2. Check the browser console for email sending logs
3. Check the user's email inbox for the confirmation email

## Troubleshooting

### Emails not sending?
1. Check browser console for errors
2. Verify your EmailJS credentials in `.env` file
3. Make sure you've verified your email service in EmailJS
4. Check EmailJS dashboard → Logs to see if emails are being sent

### Template variables not showing?
- Make sure variable names match exactly (case-sensitive)
- Use `{{variable_name}}` syntax in your template
- Check that you're passing the correct variable names in the code

### Getting "Service not found" error?
- Verify your Service ID is correct
- Make sure the service is active in EmailJS dashboard

## Code Already Integrated

The email functionality has been integrated into:
- ✅ `src/pages/Booking.jsx` - Sends email when booking is created
- ✅ `src/pages/Restaurant.jsx` - Sends email when restaurant order is placed
- ✅ `src/pages/EquipmentShop.jsx` - Sends email when equipment is purchased

All emails are sent automatically after successful payment/booking creation.

