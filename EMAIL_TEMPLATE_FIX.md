# Email Template Fix - Remove Handlebars Conditionals

The error "One or more dynamic variables are corrupted" is caused by Handlebars conditionals ({{#if}}) in your EmailJS template. EmailJS has issues with complex Handlebars syntax.

## Solution: Use Simple Template

Replace your current EmailJS template content with this simplified version that doesn't use conditionals:

### Subject:
```
{{subject}}
```

### Content (HTML):
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
      
      <div class="info-row">
        <span class="info-label">Complex:</span> {{complex_name}}
      </div>
      
      <div class="info-row">
        <span class="info-label">Sport:</span> {{sport}}
      </div>
      
      <div class="info-row">
        <span class="info-label">Date:</span> {{date}}
      </div>
      
      <div class="info-row">
        <span class="info-label">Time Slot:</span> {{time_slot}}
      </div>
      
      <div class="info-row">
        <span class="info-label">Duration:</span> {{hours}} hour(s)
      </div>
      
      <div class="info-row">
        <span class="info-label">Coach:</span> {{coach}}
      </div>
      
      <div class="items-list">
        <strong>Order Items:</strong>
        <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">{{items}}</pre>
      </div>
      
      <div class="info-row">
        <span class="info-label">Items Count:</span> {{items_count}}
      </div>
      
      <div class="info-row" style="background-color: #10b981; color: white; font-size: 18px; font-weight: bold;">
        <span>Total: {{total}}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Status:</span> {{status}}
      </div>
      
      <div class="info-row">
        <span class="info-label">Booking ID:</span> {{booking_id}}
      </div>
      
      <div class="info-row">
        <span class="info-label">Order ID:</span> {{order_id}}
      </div>
    </div>
    <div class="footer">
      <p>© 2025 Prime Play. All rights reserved.</p>
      <p>Thank you for choosing Prime Play!</p>
    </div>
  </div>
</body>
</html>
```

## Important Notes:

1. **Removed all {{#if}} conditionals** - EmailJS has issues with Handlebars conditionals
2. **All variables are always sent** - The code now sends all variables (empty strings for unused ones)
3. **Empty fields will show** - For bookings, restaurant/equipment fields will be empty, and vice versa. This is fine - the email will still be readable.

## Steps to Fix:

1. Go to your EmailJS dashboard
2. Open your template (template_roekvto)
3. Replace the entire Content section with the HTML above
4. Make sure the Subject field has: `{{subject}}`
5. Click "Save"
6. Test by making a booking

The template will now work without the "corrupted variables" error!

