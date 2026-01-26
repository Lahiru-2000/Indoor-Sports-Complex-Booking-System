import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_vqiq99a';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_roekvto';
const CONTACT_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_CONTACT_TEMPLATE_ID || 'template_ex0pc6k';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'GPPpXYLP1WQZ_YiOe';

export const sendBookingEmail = async (bookingData, userEmail) => {
  try {
    let formattedDate = bookingData.date;
    if (bookingData.date?.toDate) {
      formattedDate = bookingData.date.toDate().toLocaleDateString('en-GB');
    } else if (typeof bookingData.date === 'string') {
      const dateObj = new Date(bookingData.date);
      formattedDate = dateObj.toLocaleDateString('en-GB');
    }

    const templateParams = {
      to_email: userEmail,
      type: 'Booking Confirmation',
      subject: 'Booking Confirmation - Prime Play',
      complex_name: bookingData.complexName || 'Sports Complex',
      sport: bookingData.sport ? bookingData.sport.charAt(0).toUpperCase() + bookingData.sport.slice(1) : 'Pitch',
      date: formattedDate || 'N/A',
      time_slot: bookingData.timeSlot || 'N/A',
      hours: bookingData.hours || 1,
      coach: bookingData.coachRequired ? 'Included' : 'Not Included',
      total: `£${(bookingData.total || 0).toFixed(2)}`,
      status: bookingData.status || 'pending',
      message: `Your booking for ${bookingData.complexName || 'Sports Complex'} on ${formattedDate || 'N/A'} at ${bookingData.timeSlot || 'N/A'} has been confirmed.`,
      booking_id: bookingData.bookingId || 'N/A',
      items: '',
      items_count: '',
      order_id: ''
    };

    if (SERVICE_ID === 'your_service_id' || TEMPLATE_ID === 'your_template_id' || PUBLIC_KEY === 'your_public_key') {
      console.warn('EmailJS not configured. Please set up your .env file with EmailJS credentials.');
      return { success: false, error: 'EmailJS not configured' };
    }

    emailjs.init(PUBLIC_KEY);

    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
    console.log('Booking email sent successfully to:', userEmail, response);
    return { success: true };
  } catch (error) {
    console.error('Error sending booking email:', error);
    console.error('Error details:', {
      status: error.status,
      text: error.text,
      serviceId: SERVICE_ID,
      templateId: TEMPLATE_ID,
      hasPublicKey: !!PUBLIC_KEY && PUBLIC_KEY !== 'your_public_key'
    });
    return { success: false, error };
  }
};

export const sendRestaurantEmail = async (purchaseData, userEmail) => {
  try {
    const itemsList = purchaseData.items
      .map(item => 
        `${item.name || item.itemName} x${item.quantity || 1} - £${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`
      )
      .join('\n');

    const itemsCount = purchaseData.items.reduce((sum, item) => sum + (item.quantity || 1), 0);

    const complexName = purchaseData.complex?.name || 'N/A';
    const complexLocation = purchaseData.complex?.location || 'N/A';
    const complexInfo = complexName !== 'N/A' ? `${complexName}${complexLocation !== 'N/A' ? ` - ${complexLocation}` : ''}` : 'N/A';

    const templateParams = {
      to_email: userEmail,
      type: 'Restaurant Order',
      subject: 'Restaurant Order Confirmation - Prime Play',
      items: itemsList || '',
      items_count: itemsCount || 0,
      total: `£${(purchaseData.total || 0).toFixed(2)}`,
      status: purchaseData.status || 'pending',
      message: `Your restaurant order has been placed successfully at ${complexInfo}. You ordered ${itemsCount} item(s) for a total of £${(purchaseData.total || 0).toFixed(2)}.`,
      order_id: purchaseData.orderId || 'N/A',
      complex_name: complexInfo,
      sport: complexLocation !== 'N/A' ? `Location: ${complexLocation}` : '',
      date: '',
      time_slot: '',
      hours: '',
      coach: '',
      booking_id: ''
    };

    if (SERVICE_ID === 'your_service_id' || TEMPLATE_ID === 'your_template_id' || PUBLIC_KEY === 'your_public_key') {
      console.warn('EmailJS not configured. Please set up your .env file with EmailJS credentials.');
      return { success: false, error: 'EmailJS not configured' };
    }

    emailjs.init(PUBLIC_KEY);

    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
    console.log('Restaurant email sent successfully to:', userEmail, response);
    return { success: true };
  } catch (error) {
    console.error('Error sending restaurant email:', error);
    console.error('Error details:', {
      status: error.status,
      text: error.text,
      serviceId: SERVICE_ID,
      templateId: TEMPLATE_ID
    });
    return { success: false, error };
  }
};

export const sendEquipmentEmail = async (purchaseData, userEmail) => {
  try {
    const itemsList = purchaseData.items
      .map(item => 
        `${item.name || item.itemName} x${item.quantity || 1} - £${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`
      )
      .join('\n');

    const itemsCount = purchaseData.items.reduce((sum, item) => sum + (item.quantity || 1), 0);

    const complexName = purchaseData.complex?.name || 'N/A';
    const complexLocation = purchaseData.complex?.location || 'N/A';
    const complexInfo = complexName !== 'N/A' ? `${complexName}${complexLocation !== 'N/A' ? ` - ${complexLocation}` : ''}` : 'N/A';

    const templateParams = {
      to_email: userEmail,
      type: 'Equipment Purchase',
      subject: 'Equipment Purchase Confirmation - Prime Play',
      items: itemsList || '',
      items_count: itemsCount || 0,
      total: `£${(purchaseData.total || 0).toFixed(2)}`,
      status: purchaseData.status || 'pending',
      message: `Your equipment order has been placed successfully at ${complexInfo}. You ordered ${itemsCount} item(s) for a total of £${(purchaseData.total || 0).toFixed(2)}.`,
      order_id: purchaseData.orderId || 'N/A',
      complex_name: complexInfo,
      sport: complexLocation !== 'N/A' ? `Location: ${complexLocation}` : '',
      date: '',
      time_slot: '',
      hours: '',
      coach: '',
      booking_id: ''
    };

    if (SERVICE_ID === 'your_service_id' || TEMPLATE_ID === 'your_template_id' || PUBLIC_KEY === 'your_public_key') {
      console.warn('EmailJS not configured. Please set up your .env file with EmailJS credentials.');
      return { success: false, error: 'EmailJS not configured' };
    }

    emailjs.init(PUBLIC_KEY);

    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
    console.log('Equipment email sent successfully to:', userEmail, response);
    return { success: true };
  } catch (error) {
    console.error('Error sending equipment email:', error);
    console.error('Error details:', {
      status: error.status,
      text: error.text,
      serviceId: SERVICE_ID,
      templateId: TEMPLATE_ID
    });
    return { success: false, error };
  }
};

export const sendContactEmail = async (contactData, adminEmail) => {
  try {
    if (SERVICE_ID === 'your_service_id' || CONTACT_TEMPLATE_ID === 'your_template_id' || PUBLIC_KEY === 'your_public_key') {
      console.warn('EmailJS not configured. Please set up your .env file with EmailJS credentials.');
      return { success: false, error: 'EmailJS not configured' };
    }

    const templateParams = {
      to_email: adminEmail || import.meta.env.VITE_ADMIN_EMAIL || 'futsalindoorstadium@gmail.com',
      subject: `Contact Form: ${contactData.subject || 'New Message'}`,
      from_name: contactData.name || 'Anonymous',
      from_email: contactData.email || 'No email provided',
      message: contactData.message || '',
      submitted_date: new Date().toLocaleDateString('en-GB', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      submitted_time: new Date().toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    emailjs.init(PUBLIC_KEY);

    const response = await emailjs.send(SERVICE_ID, CONTACT_TEMPLATE_ID, templateParams);
    console.log('Contact email sent successfully to:', adminEmail, response);
    return { success: true };
  } catch (error) {
    console.error('Error sending contact email:', error);
    console.error('Error details:', {
      status: error.status,
      text: error.text,
      serviceId: SERVICE_ID,
      templateId: CONTACT_TEMPLATE_ID
    });
    return { success: false, error };
  }
};

