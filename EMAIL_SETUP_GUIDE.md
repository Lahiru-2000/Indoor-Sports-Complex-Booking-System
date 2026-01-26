# Email Setup Guide for Prime Play

This guide will help you set up email notifications for:
- Court bookings
- Restaurant purchases
- Sport equipment purchases

## Option 1: Firebase Cloud Functions (Recommended)

### Step 1: Install Firebase CLI and Initialize Functions

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase Functions in your project
firebase init functions

# Select:
# - JavaScript (or TypeScript if preferred)
# - Install dependencies with npm
```

### Step 2: Install Required Packages

```bash
cd functions
npm install nodemailer
# OR use a service like SendGrid
npm install @sendgrid/mail
```

### Step 3: Create Email Function

Create `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
// OR for SendGrid:
// const sgMail = require('@sendgrid/mail');

admin.initializeApp();

// Configure email transporter (using Gmail as example)
// For production, use environment variables for credentials
const transporter = nodemailer.createTransport({
  service: 'gmail', // or use SMTP settings
  auth: {
    user: functions.config().email.user, // Set via: firebase functions:config:set email.user="your-email@gmail.com"
    pass: functions.config().email.password // Set via: firebase functions:config:set email.password="your-app-password"
  }
});

// OR for SendGrid:
// sgMail.setApiKey(functions.config().sendgrid.key);

// Email template function
function generateEmailHTML(type, data) {
  let title = '';
  let content = '';
  
  if (type === 'booking') {
    title = 'Booking Confirmation - Prime Play';
    content = `
      <h2>Your Booking Has Been Confirmed!</h2>
      <p><strong>Complex:</strong> ${data.complexName}</p>
      <p><strong>Sport:</strong> ${data.sport}</p>
      <p><strong>Date:</strong> ${data.date}</p>
      <p><strong>Time:</strong> ${data.timeSlot}</p>
      <p><strong>Duration:</strong> ${data.hours} hour(s)</p>
      ${data.coachRequired ? '<p><strong>Coach:</strong> Included</p>' : ''}
      <p><strong>Total:</strong> £${data.total.toFixed(2)}</p>
      <p><strong>Status:</strong> ${data.status}</p>
      <p>Thank you for choosing Prime Play!</p>
    `;
  } else if (type === 'restaurant') {
    title = 'Restaurant Order Confirmation - Prime Play';
    content = `
      <h2>Your Restaurant Order Has Been Placed!</h2>
      <p><strong>Order Items:</strong></p>
      <ul>
        ${data.items.map(item => `<li>${item.name || item.itemName} x${item.quantity} - £${(item.price * item.quantity).toFixed(2)}</li>`).join('')}
      </ul>
      <p><strong>Total:</strong> £${data.total.toFixed(2)}</p>
      <p><strong>Status:</strong> ${data.status}</p>
      <p>Thank you for your order!</p>
    `;
  } else if (type === 'equipment') {
    title = 'Equipment Purchase Confirmation - Prime Play';
    content = `
      <h2>Your Equipment Order Has Been Placed!</h2>
      <p><strong>Order Items:</strong></p>
      <ul>
        ${data.items.map(item => `<li>${item.name || item.itemName} x${item.quantity} - £${(item.price * item.quantity).toFixed(2)}</li>`).join('')}
      </ul>
      <p><strong>Total:</strong> £${data.total.toFixed(2)}</p>
      <p><strong>Status:</strong> ${data.status}</p>
      <p>Thank you for your purchase!</p>
    `;
  }
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Prime Play</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>© 2025 Prime Play. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Cloud Function: Trigger on booking creation
exports.sendBookingEmail = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    const booking = snap.data();
    
    try {
      // Fetch user email
      const userDoc = await admin.firestore().doc(`users/${booking.userId}`).get();
      const userEmail = userDoc.data()?.email || booking.userEmail;
      
      // Fetch complex details
      let complexName = 'Sports Complex';
      if (booking.complexId) {
        const complexDoc = await admin.firestore().doc(`complexes/${booking.complexId}`).get();
        if (complexDoc.exists()) {
          complexName = complexDoc.data().name;
        }
      }
      
      const emailData = {
        complexName,
        sport: booking.sport || 'Pitch',
        date: booking.date,
        timeSlot: booking.timeSlot || 'N/A',
        hours: booking.hours || 1,
        coachRequired: booking.coachRequired || false,
        total: booking.total || 0,
        status: booking.status || 'pending'
      };
      
      const mailOptions = {
        from: 'Prime Play <noreply@primeplay.com>',
        to: userEmail,
        subject: 'Booking Confirmation - Prime Play',
        html: generateEmailHTML('booking', emailData)
      };
      
      await transporter.sendMail(mailOptions);
      console.log('Booking email sent to:', userEmail);
    } catch (error) {
      console.error('Error sending booking email:', error);
    }
  });

// Cloud Function: Trigger on restaurant purchase
exports.sendRestaurantEmail = functions.firestore
  .document('restaurantPurchases/{purchaseId}')
  .onCreate(async (snap, context) => {
    const purchase = snap.data();
    
    try {
      // Fetch user email
      const userDoc = await admin.firestore().doc(`users/${purchase.userId}`).get();
      const userEmail = userDoc.data()?.email;
      
      if (!userEmail) {
        console.error('User email not found for purchase:', context.params.purchaseId);
        return;
      }
      
      const emailData = {
        items: purchase.items || [],
        total: purchase.total || 0,
        status: purchase.status || 'pending'
      };
      
      const mailOptions = {
        from: 'Prime Play <noreply@primeplay.com>',
        to: userEmail,
        subject: 'Restaurant Order Confirmation - Prime Play',
        html: generateEmailHTML('restaurant', emailData)
      };
      
      await transporter.sendMail(mailOptions);
      console.log('Restaurant email sent to:', userEmail);
    } catch (error) {
      console.error('Error sending restaurant email:', error);
    }
  });

// Cloud Function: Trigger on equipment purchase
exports.sendEquipmentEmail = functions.firestore
  .document('equipmentPurchases/{purchaseId}')
  .onCreate(async (snap, context) => {
    const purchase = snap.data();
    
    try {
      // Fetch user email
      const userDoc = await admin.firestore().doc(`users/${purchase.userId}`).get();
      const userEmail = userDoc.data()?.email;
      
      if (!userEmail) {
        console.error('User email not found for purchase:', context.params.purchaseId);
        return;
      }
      
      const emailData = {
        items: purchase.items || [],
        total: purchase.total || 0,
        status: purchase.status || 'pending'
      };
      
      const mailOptions = {
        from: 'Prime Play <noreply@primeplay.com>',
        to: userEmail,
        subject: 'Equipment Purchase Confirmation - Prime Play',
        html: generateEmailHTML('equipment', emailData)
      };
      
      await transporter.sendMail(mailOptions);
      console.log('Equipment email sent to:', userEmail);
    } catch (error) {
      console.error('Error sending equipment email:', error);
    }
  });
```

### Step 4: Set Email Credentials

```bash
# For Gmail (use App Password, not regular password)
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.password="your-app-password"

# For SendGrid
firebase functions:config:set sendgrid.key="your-sendgrid-api-key"
```

### Step 5: Deploy Functions

```bash
firebase deploy --only functions
```

---

## Option 2: EmailJS (Simpler, Client-Side)

### Step 1: Install EmailJS

```bash
npm install @emailjs/browser
```

### Step 2: Create Email Service Function

Create `src/utils/emailService.js`:

```javascript
import emailjs from '@emailjs/browser';

// Initialize EmailJS (get these from emailjs.com)
const SERVICE_ID = 'your_service_id';
const TEMPLATE_ID = 'your_template_id';
const PUBLIC_KEY = 'your_public_key';

export const sendBookingEmail = async (bookingData, userEmail) => {
  try {
    const templateParams = {
      to_email: userEmail,
      type: 'Booking',
      subject: 'Booking Confirmation - Prime Play',
      complex_name: bookingData.complexName,
      sport: bookingData.sport,
      date: bookingData.date,
      time_slot: bookingData.timeSlot,
      hours: bookingData.hours,
      coach: bookingData.coachRequired ? 'Included' : 'Not Included',
      total: `£${bookingData.total.toFixed(2)}`,
      status: bookingData.status,
      message: `Your booking for ${bookingData.complexName} on ${bookingData.date} at ${bookingData.timeSlot} has been confirmed.`
    };

    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log('Booking email sent successfully');
  } catch (error) {
    console.error('Error sending booking email:', error);
  }
};

export const sendRestaurantEmail = async (purchaseData, userEmail) => {
  try {
    const itemsList = purchaseData.items.map(item => 
      `${item.name || item.itemName} x${item.quantity} - £${(item.price * item.quantity).toFixed(2)}`
    ).join(', ');

    const templateParams = {
      to_email: userEmail,
      type: 'Restaurant Order',
      subject: 'Restaurant Order Confirmation - Prime Play',
      items: itemsList,
      total: `£${purchaseData.total.toFixed(2)}`,
      status: purchaseData.status,
      message: `Your restaurant order has been placed successfully.`
    };

    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log('Restaurant email sent successfully');
  } catch (error) {
    console.error('Error sending restaurant email:', error);
  }
};

export const sendEquipmentEmail = async (purchaseData, userEmail) => {
  try {
    const itemsList = purchaseData.items.map(item => 
      `${item.name || item.itemName} x${item.quantity} - £${(item.price * item.quantity).toFixed(2)}`
    ).join(', ');

    const templateParams = {
      to_email: userEmail,
      type: 'Equipment Purchase',
      subject: 'Equipment Purchase Confirmation - Prime Play',
      items: itemsList,
      total: `£${purchaseData.total.toFixed(2)}`,
      status: purchaseData.status,
      message: `Your equipment order has been placed successfully.`
    };

    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log('Equipment email sent successfully');
  } catch (error) {
    console.error('Error sending equipment email:', error);
  }
};
```

### Step 3: Update Booking.jsx

Add after line 694 (after booking is created):

```javascript
import { sendBookingEmail, sendEquipmentEmail } from '../utils/emailService';

// After: const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
// Add:
try {
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const userEmail = userDoc.data()?.email || user.email;
  
  if (userEmail) {
    const complexDoc = await getDoc(doc(db, 'complexes', complexId));
    const complexName = complexDoc.data()?.name || 'Sports Complex';
    
    await sendBookingEmail({
      complexName,
      sport: bookingData.sport,
      date: bookingData.date,
      timeSlot: bookingData.timeSlot,
      hours: bookingData.hours,
      coachRequired: bookingData.coachRequired,
      total: bookingData.total,
      status: bookingData.status
    }, userEmail);
  }
} catch (emailError) {
  console.error('Error sending booking email:', emailError);
  // Don't fail the booking if email fails
}

// After equipment purchase (line 707):
if (includeItems && formData.items && formData.items.length > 0) {
  // ... existing code ...
  await addDoc(collection(db, 'equipmentPurchases'), equipmentPurchaseData);
  
  // Add email:
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userEmail = userDoc.data()?.email || user.email;
    
    if (userEmail) {
      await sendEquipmentEmail({
        items: formData.items,
        total: equipmentTotal,
        status: 'pending'
      }, userEmail);
    }
  } catch (emailError) {
    console.error('Error sending equipment email:', emailError);
  }
}
```

### Step 4: Update Restaurant.jsx

Add after line 208:

```javascript
import { sendRestaurantEmail } from '../utils/emailService';

// After: await addDoc(collection(db, 'restaurantPurchases'), purchaseData);
// Add:
try {
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const userEmail = userDoc.data()?.email || user.email;
  
  if (userEmail) {
    await sendRestaurantEmail({
      items: cart,
      total: getCartTotal(),
      status: 'pending'
    }, userEmail);
  }
} catch (emailError) {
  console.error('Error sending restaurant email:', emailError);
}
```

### Step 5: Update EquipmentShop.jsx

Add after line 195:

```javascript
import { sendEquipmentEmail } from '../utils/emailService';

// After: await addDoc(collection(db, 'equipmentPurchases'), purchaseData);
// Add:
try {
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const userEmail = userDoc.data()?.email || user.email;
  
  if (userEmail) {
    await sendEquipmentEmail({
      items: cart,
      total: getCartTotal(),
      status: 'pending'
    }, userEmail);
  }
} catch (emailError) {
  console.error('Error sending equipment email:', emailError);
}
```

---

## Email Template Variables

Your single template should support these variables:

**For Bookings:**
- `type`: "Booking"
- `complex_name`: Complex name
- `sport`: Sport type
- `date`: Booking date
- `time_slot`: Time slot
- `hours`: Number of hours
- `coach`: Coach included or not
- `total`: Total amount
- `status`: Booking status

**For Restaurant:**
- `type`: "Restaurant Order"
- `items`: List of items
- `total`: Total amount
- `status`: Order status

**For Equipment:**
- `type`: "Equipment Purchase"
- `items`: List of items
- `total`: Total amount
- `status`: Order status

**Common:**
- `to_email`: User's email
- `subject`: Email subject
- `message`: Custom message

---

## Recommendations

1. **For Production**: Use Firebase Cloud Functions (Option 1) - more secure, server-side
2. **For Quick Setup**: Use EmailJS (Option 2) - easier to implement, client-side
3. **Email Service Providers**:
   - **SendGrid**: Free tier (100 emails/day)
   - **Mailgun**: Free tier (5,000 emails/month)
   - **Gmail SMTP**: Free but limited
   - **AWS SES**: Very cheap for high volume

---

## Next Steps

1. Choose your preferred option
2. Set up email service credentials
3. Create your email template
4. Integrate the email sending code
5. Test with a real booking/purchase

