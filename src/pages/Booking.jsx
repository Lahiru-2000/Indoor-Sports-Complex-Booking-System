import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, updateDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Swal from 'sweetalert2';
import { sendBookingEmail, sendEquipmentEmail } from '../utils/emailService';

const Booking = () => {
  const { complexId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [complex, setComplex] = useState(null);
  const [userPackage, setUserPackage] = useState('normal');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [originalHours, setOriginalHours] = useState(0);
  const [originalTotal, setOriginalTotal] = useState(0);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    sport: '',
    date: '',
    selectedTimeSlots: [],
    coachRequired: false,
    coachId: '',
    items: []
  });
  const [coaches, setCoaches] = useState([]);
  const [sportsItems, setSportsItems] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  const [pendingBookingType, setPendingBookingType] = useState(null);
  const [pendingBookingUpdate, setPendingBookingUpdate] = useState(null);
  const generateHourlySlots = () => {
    const slots = [];
    for (let hour = 9; hour < 21; hour++) {
      const startHour = hour.toString().padStart(2, '0');
      const endHour = (hour + 1).toString().padStart(2, '0');
      slots.push(`${startHour}:00 - ${endHour}:00`);
    }
    return slots;
  };

  const allTimeSlots = generateHourlySlots();
  const [availableStartTimes, setAvailableStartTimes] = useState(allTimeSlots);
  const [fetchingSlots, setFetchingSlots] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const editBookingId = searchParams.get('edit');
    
    if (editBookingId) {
      setIsEditMode(true);
      setEditingBookingId(editBookingId);
    }

    const fetchData = async () => {
      try {
        const complexDoc = await getDoc(doc(db, 'complexes', complexId));
        if (complexDoc.exists()) {
          setComplex({ id: complexDoc.id, ...complexDoc.data() });
        }

        if (user) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const packageValue = userData.package || 'normal';
              setUserPackage(packageValue);
              console.log('User package fetched:', packageValue);
            } else {
              console.warn('User document not found');
              setUserPackage('normal');
            }
          } catch (err) {
            console.error('Error fetching user package:', err);
            setUserPackage('normal');
          }
        } else {
          setUserPackage('normal');
        }

        if (editBookingId && user) {
          try {
            const bookingDoc = await getDoc(doc(db, 'bookings', editBookingId));
            if (bookingDoc.exists()) {
              const bookingData = bookingDoc.data();
              
              if (bookingData.userId === user.uid) {
                if (bookingData.status !== 'pending') {
                  Swal.fire({
                    icon: 'error',
                    title: 'Cannot Edit Booking',
                    text: 'Only pending bookings can be edited.',
                    confirmButtonColor: '#10b981'
                  });
                  navigate('/user/dashboard');
                  return;
                }
                
                const originalHoursPaid = bookingData.hours || bookingData.selectedTimeSlots?.length || 0;
                setOriginalHours(originalHoursPaid);
                setOriginalTotal(bookingData.total || 0);
                
                setFormData({
                  sport: bookingData.sport || '',
                  date: bookingData.date || '',
                  selectedTimeSlots: [], // Don't pre-select time slots
                  coachRequired: bookingData.coachRequired || false,
                  coachId: bookingData.coachId || '',
                  items: bookingData.items || []
                });
              } else {
                Swal.fire({
                  icon: 'error',
                  title: 'Access Denied',
                  text: 'You can only edit your own bookings.',
                  confirmButtonColor: '#10b981'
                });
                navigate('/user/dashboard');
                return;
              }
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Booking Not Found',
                text: 'The booking you are trying to edit does not exist.',
                confirmButtonColor: '#10b981'
              });
              navigate('/user/dashboard');
              return;
            }
          } catch (error) {
            console.error('Error fetching booking:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to load booking details.',
              confirmButtonColor: '#10b981'
            });
            navigate('/user/dashboard');
            return;
          }
        }

        const coachesQuery = query(collection(db, 'coaches'), where('complexId', '==', complexId));
        const coachesSnapshot = await getDocs(coachesQuery);
        setCoaches(coachesSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(coach => coach.status !== 'deleted'));

        const itemsSnapshot = await getDocs(collection(db, 'sportsItems'));
        setSportsItems(itemsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(item => item.status !== 'deleted'));

        const drinksSnapshot = await getDocs(collection(db, 'drinks'));
        setDrinks(drinksSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(item => item.status !== 'deleted'));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [complexId, user, location.search, navigate]);

  const getHourFromSlot = (slot) => {
    if (!slot) return null;
    const match = slot.match(/^(\d{2}):00/);
    return match ? parseInt(match[1]) : null;
  };

  const getHoursFromBooking = (booking) => {
    if (booking.startTime && booking.hours) {
      const startHour = getHourFromSlot(booking.startTime);
      if (startHour !== null) {
        const hours = [];
        for (let i = 0; i < booking.hours; i++) {
          hours.push(startHour + i);
        }
        return hours;
      }
    }
    if (booking.timeSlot) {
      const match = booking.timeSlot.match(/^(\d{2}):00 - (\d{2}):00/);
      if (match) {
        const start = parseInt(match[1]);
        const end = parseInt(match[2]);
        const hours = [];
        for (let h = start; h < end; h++) {
          hours.push(h);
        }
        return hours;
      }
    }
    return [];
  };

  const isToday = (dateString) => {
    if (!dateString) return false;
    try {
      const today = new Date();
      const todayYear = today.getFullYear();
      const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
      const todayDay = String(today.getDate()).padStart(2, '0');
      const todayString = `${todayYear}-${todayMonth}-${todayDay}`;
      
      return dateString === todayString;
    } catch (error) {
      console.error('Error in isToday:', error, 'dateString:', dateString);
      return false;
    }
  };

  const getCurrentHour = () => {
    return new Date().getHours();
  };

  const isSlotPast = (slot) => {
    if (!slot) return true;
    const match = slot.match(/^(\d{2}):00/);
    if (!match) return true;
    
    const slotHour = parseInt(match[1]);
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    if (slotHour < currentHour) {
      return true;
    }
    
    if (slotHour === currentHour) {
      const isPast = currentMinute > 0;
      return isPast;
    }
    
    return false;
  };

  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!formData.date || !complexId) {
        setAvailableStartTimes(allTimeSlots);
        return;
      }

      setFetchingSlots(true);
      try {
        const normalizedSelectedSport = formData.sport ? formData.sport.toLowerCase().trim() : null;
        
        let bookingsQuery;
        if (normalizedSelectedSport) {
          bookingsQuery = query(
          collection(db, 'bookings'),
          where('complexId', '==', complexId),
            where('date', '==', formData.date)
          );
        } else {
          // If no sport selected yet, don't filter by sport (will show all available slots)
          bookingsQuery = query(
            collection(db, 'bookings'),
            where('complexId', '==', complexId),
            where('date', '==', formData.date)
        );
        }
        
        const bookingsSnapshot = await getDocs(bookingsQuery);
        const bookedHours = new Set();
        
        console.log(`Fetching bookings: complexId=${complexId}, date=${formData.date}, sport=${formData.sport} (normalized: ${normalizedSelectedSport})`);
        console.log(`Found ${bookingsSnapshot.docs.length} bookings`);
        
        bookingsSnapshot.docs.forEach(doc => {
          const bookingData = doc.data();
          // Only count bookings that are not cancelled
          if (bookingData.status !== 'cancelled') {
            // Normalize stored sport for comparison
            const normalizedStoredSport = bookingData.sport ? bookingData.sport.toLowerCase().trim() : '';
            
            // Double-check sport match (case-insensitive comparison)
            if (!normalizedSelectedSport || normalizedStoredSport === normalizedSelectedSport) {
            const hours = getHoursFromBooking(bookingData);
              console.log(`Booking ${doc.id}: sport="${bookingData.sport}" (normalized: "${normalizedStoredSport}"), hours:`, hours);
            hours.forEach(hour => bookedHours.add(hour));
            } else {
              console.log(`Skipping booking ${doc.id}: sport mismatch - stored="${bookingData.sport}" (normalized: "${normalizedStoredSport}"), selected="${formData.sport}" (normalized: "${normalizedSelectedSport}")`);
            }
          }
        });
        
        console.log(`Booked hours for sport "${formData.sport}":`, Array.from(bookedHours).sort());
        
        // Filter out slots where any hour is booked OR past time slots if booking for today
        const isBookingToday = isToday(formData.date);
        const available = allTimeSlots.filter(slot => {
          const hour = getHourFromSlot(slot);
          if (hour === null) return false;
          
          // If booking for today, exclude time slots that have already started
          if (isBookingToday && isSlotPast(slot)) {
            console.log(`Excluding past slot: ${slot}`);
            return false;
          }
          
          // Exclude booked slots
          if (bookedHours.has(hour)) {
            return false;
          }
          
          return true;
        });
        
        console.log(`Available slots for ${formData.date} (isToday: ${isBookingToday}):`, available);
        setAvailableStartTimes(available);

        // If any selected time slot is no longer available or is past, remove it
        if (formData.selectedTimeSlots && formData.selectedTimeSlots.length > 0) {
          const validSlots = formData.selectedTimeSlots.filter(slot => {
            // Check if slot is in available list
            const isAvailable = available.includes(slot);
            // Check if slot is not past (for today's bookings)
            const isNotPast = !isBookingToday || !isSlotPast(slot);
            return isAvailable && isNotPast;
          });
          
          if (validSlots.length !== formData.selectedTimeSlots.length) {
            console.log('Removing invalid/past slots from selection');
            setFormData(prev => ({
              ...prev,
              selectedTimeSlots: validSlots
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching booked slots:', error);
        // On error, show all slots as available
        setAvailableStartTimes(allTimeSlots);
      } finally {
        setFetchingSlots(false);
      }
    };

    fetchBookedSlots();
  }, [formData.date, formData.sport, complexId]);

  // Periodically check and remove past slots if booking for today
  useEffect(() => {
    if (!formData.date || !isToday(formData.date)) return;

    const checkPastSlots = () => {
      if (formData.selectedTimeSlots && formData.selectedTimeSlots.length > 0) {
        const pastSlots = formData.selectedTimeSlots.filter(slot => isSlotPast(slot));
        if (pastSlots.length > 0) {
          console.log('Removing past slots:', pastSlots);
          setFormData(prev => ({
            ...prev,
            selectedTimeSlots: prev.selectedTimeSlots.filter(slot => !isSlotPast(slot))
          }));
        }
      }
    };

    // Check immediately
    checkPastSlots();

    // Check every minute
    const interval = setInterval(checkPastSlots, 60000);
    return () => clearInterval(interval);
  }, [formData.date, formData.selectedTimeSlots]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Check if selected slots are consecutive
  const checkConsecutiveSlots = (slots) => {
    if (slots.length === 0) return true;
    if (slots.length === 1) return true;
    
    const sortedSlots = [...slots].sort();
    for (let i = 0; i < sortedSlots.length - 1; i++) {
      const currentHour = getHourFromSlot(sortedSlots[i]);
      const nextHour = getHourFromSlot(sortedSlots[i + 1]);
      if (currentHour === null || nextHour === null || nextHour !== currentHour + 1) {
        return false;
      }
    }
    return true;
  };

  const handleTimeSlotToggle = (slot) => {
    setFormData(prev => {
      const currentSlots = prev.selectedTimeSlots || [];
      const slotIndex = currentSlots.indexOf(slot);
      
      if (slotIndex > -1) {
        // Remove slot if already selected
        return {
          ...prev,
          selectedTimeSlots: currentSlots.filter(s => s !== slot)
        };
      } else {
        // Add slot if not selected, but only if it's consecutive
        const sortedSlots = [...currentSlots, slot].sort();
        const isConsecutive = checkConsecutiveSlots(sortedSlots);
        
        if (isConsecutive) {
          return {
            ...prev,
            selectedTimeSlots: sortedSlots
          };
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Invalid Selection',
            text: 'Please select consecutive time slots only.',
            confirmButtonColor: '#10b981'
          });
          return prev;
        }
      }
    });
  };

  const calculateTotal = (includeCoach = true, includeItems = true) => {
    // Use complex pricePerHour, fallback to 50 if not available
    const pricePerHour = complex?.pricePerHour || 50;
    const hours = formData.selectedTimeSlots?.length || 0;
    
    // In edit mode, calculate only for additional hours beyond original hours paid
    let billableHours = hours;
    if (isEditMode && originalHours > 0) {
      // Original hours are free, only charge for additional hours
      billableHours = Math.max(0, hours - originalHours);
    }
    
    let courtTotal = pricePerHour * billableHours;
    
    // Apply package discount for all complex bookings (pitch/court bookings)
    // Discount applies to the court/pitch price, not coach or equipment
    if (userPackage && userPackage !== 'normal') {
      const discountPercent = userPackage === 'package2' ? 2 : userPackage === 'package3' ? 5 : 0;
      if (discountPercent > 0) {
        const discount = (courtTotal * discountPercent) / 100;
        courtTotal = courtTotal - discount;
      }
    }
    
    let total = courtTotal;
    
    // In edit mode, don't charge for coach if it was already included
    // For simplicity, we'll assume coach is not included in edit mode
    if (includeCoach && formData.coachRequired && formData.coachId && !isEditMode) {
      const coach = coaches.find(c => c.id === formData.coachId);
      if (coach) total += (coach.price || 30) * hours; // Coach fee per hour
    }
    
    // Add sport items prices (not applicable in edit mode)
    if (includeItems && formData.items && formData.items.length > 0 && !isEditMode) {
      formData.items.forEach(item => {
        total += (item.price || 0) * (item.quantity || 1);
      });
    }
    
    return total;
  };

  // Calculate discount amount for display
  const getDiscountAmount = () => {
    if (!userPackage || userPackage === 'normal') return 0;
    
    const pricePerHour = complex?.pricePerHour || 50;
    const hours = formData.selectedTimeSlots?.length || 0;
    const courtTotal = pricePerHour * hours;
    const discountPercent = userPackage === 'package2' ? 2 : userPackage === 'package3' ? 5 : 0;
    return discountPercent > 0 ? (courtTotal * discountPercent) / 100 : 0;
  };

  // Get discount percentage for display
  const getDiscountPercent = () => {
    if (!userPackage || userPackage === 'normal') return 0;
    return userPackage === 'package2' ? 2 : userPackage === 'package3' ? 5 : 0;
  };

  // Get start and end time from selected slots
  const getTimeRange = () => {
    const slots = formData.selectedTimeSlots || [];
    if (slots.length === 0) return { start: '', end: '' };
    
    const sortedSlots = [...slots].sort();
    const firstSlot = sortedSlots[0];
    const lastSlot = sortedSlots[sortedSlots.length - 1];
    
    const startHour = getHourFromSlot(firstSlot);
    const endHour = getHourFromSlot(lastSlot);
    
    if (startHour === null || endHour === null) return { start: '', end: '' };
    
    return {
      start: firstSlot.split(' - ')[0],
      end: `${(endHour + 1).toString().padStart(2, '0')}:00`
    };
  };

  const createBooking = async (includeCoach = false, includeItems = false, skipNavigation = false) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmitting(true);

    try {
      const slots = formData.selectedTimeSlots || [];
      if (slots.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'No Time Slots Selected',
          text: 'Please select at least one time slot',
          confirmButtonColor: '#10b981'
        });
        setSubmitting(false);
        return;
      }
      
      // Validate that no past time slots are selected (for today's bookings)
      if (isToday(formData.date)) {
        const pastSlots = slots.filter(slot => isSlotPast(slot));
        if (pastSlots.length > 0) {
          Swal.fire({
            icon: 'error',
            title: 'Invalid Time Slot',
            text: 'You cannot book time slots that have already passed. Please select available future time slots.',
            confirmButtonColor: '#10b981'
          });
          setSubmitting(false);
          // Remove past slots from selection
          setFormData(prev => ({
            ...prev,
            selectedTimeSlots: prev.selectedTimeSlots.filter(slot => !isSlotPast(slot))
          }));
          return;
        }
      }

      const timeRange = getTimeRange();
      const timeSlotDisplay = timeRange.start && timeRange.end 
        ? `${timeRange.start} - ${timeRange.end}`
        : '';

      // Calculate court/coach total (without items)
      const courtCoachTotal = calculateTotal(includeCoach, false);
      
      // If in edit mode, update the existing booking
      if (isEditMode && editingBookingId) {
        // Calculate the new total: original total + additional hours cost (if any)
        // If fewer hours selected, total remains the same (they already paid)
        const newHours = slots.length;
        let newTotal = originalTotal; // Start with original total
        let additionalCost = 0;
        
        if (newHours > originalHours) {
          // Calculate cost for additional hours only
          const additionalHours = newHours - originalHours;
          const pricePerHour = complex?.pricePerHour || 50;
          additionalCost = pricePerHour * additionalHours;
          
          // Apply package discount to additional hours
          if (userPackage && userPackage !== 'normal') {
            const discountPercent = userPackage === 'package2' ? 2 : userPackage === 'package3' ? 5 : 0;
            if (discountPercent > 0) {
              const discount = (additionalCost * discountPercent) / 100;
              additionalCost = additionalCost - discount;
            }
          }
          
          newTotal = originalTotal + additionalCost;
        }
        // If newHours <= originalHours, newTotal stays as originalTotal (no additional charge)
        
        const bookingData = {
          date: formData.date,
          selectedTimeSlots: slots,
          hours: slots.length,
          startTime: slots.length > 0 ? slots[0] : null,
          timeSlot: timeSlotDisplay,
          total: newTotal,
          updatedAt: serverTimestamp(),
        };

        // If there are additional charges, show payment modal
        if (newHours > originalHours && additionalCost > 0) {
          setPendingBookingUpdate({
            bookingId: editingBookingId,
            bookingData: bookingData,
            additionalCost: additionalCost,
            additionalHours: newHours - originalHours,
            newTotal: newTotal
          });
          setPendingBookingType('update');
          setShowPaymentModal(true);
          setSubmitting(false);
          return;
        }
        
        // No additional charges, update directly
        await updateDoc(doc(db, 'bookings', editingBookingId), bookingData);
        
        let successMessage = 'Your booking has been successfully updated.';
        if (newHours < originalHours) {
          successMessage = `Your booking has been updated. ${originalHours - newHours} ${(originalHours - newHours) === 1 ? 'hour' : 'hours'} ${(originalHours - newHours) === 1 ? 'has' : 'have'} been credited to your account.`;
        }
        
        await Swal.fire({
          icon: 'success',
          title: 'Booking Updated!',
          text: successMessage,
          confirmButtonColor: '#10b981'
        });
        
        navigate('/user/dashboard');
        return;
      }
      
      // Save court/coach booking to 'bookings' collection (without items)
      const bookingData = {
        userId: user.uid,
        complexId: complexId,
        sport: (formData.sport || 'pitch').toLowerCase().trim(), // Use selected sport (normalized) or default to 'pitch'
        date: formData.date,
        selectedTimeSlots: slots,
        hours: slots.length,
        startTime: slots.length > 0 ? slots[0] : null,
        timeSlot: timeSlotDisplay,
        coachRequired: includeCoach ? formData.coachRequired : false,
        coachId: includeCoach && formData.coachRequired ? formData.coachId : null,
        items: [], // Don't save items in bookings collection
        total: courtCoachTotal,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);

      // Send booking confirmation email
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userEmail = userDoc.data()?.email || user.email;
        
        if (userEmail) {
          const complexDoc = await getDoc(doc(db, 'complexes', complexId));
          const complexName = complexDoc.data()?.name || 'Sports Complex';
          
          await sendBookingEmail({
            bookingId: bookingRef.id,
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

      // If items are included, save equipment purchase separately to 'equipmentPurchases' collection
      if (includeItems && formData.items && formData.items.length > 0) {
        const equipmentTotal = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const equipmentPurchaseData = {
          userId: user.uid,
          bookingId: bookingRef.id, // Link to the court booking if applicable
          items: formData.items,
          total: equipmentTotal,
          status: 'pending',
          createdAt: serverTimestamp()
        };
        const equipmentPurchaseRef = await addDoc(collection(db, 'equipmentPurchases'), equipmentPurchaseData);
        
        // Send equipment purchase confirmation email
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userEmail = userDoc.data()?.email || user.email;
          
          if (userEmail) {
            await sendEquipmentEmail({
              orderId: equipmentPurchaseRef.id,
              items: formData.items,
              total: equipmentTotal,
              status: 'pending'
            }, userEmail);
          }
        } catch (emailError) {
          console.error('Error sending equipment email:', emailError);
          // Don't fail the purchase if email fails
        }
      }

      if (!skipNavigation) {
        navigate('/user/dashboard');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      Swal.fire({
        icon: 'error',
        title: isEditMode ? 'Update Failed' : 'Booking Failed',
        text: isEditMode ? 'Error updating booking. Please try again.' : 'Error creating booking. Please try again.',
        confirmButtonColor: '#10b981'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookNow = async (e) => {
    e.preventDefault();
    // Validate required fields
    if (!formData.sport || !formData.date || !formData.selectedTimeSlots || formData.selectedTimeSlots.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please select a sport, date, and at least one time slot',
        confirmButtonColor: '#10b981'
      });
      return;
    }
    
    // Validate that no past time slots are selected (for today's bookings)
    if (isToday(formData.date)) {
      const pastSlots = formData.selectedTimeSlots.filter(slot => isSlotPast(slot));
      if (pastSlots.length > 0) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Time Slot',
          text: 'You cannot book time slots that have already passed. Please select available future time slots.',
          confirmButtonColor: '#10b981'
        });
        // Remove past slots from selection
        setFormData(prev => ({
          ...prev,
          selectedTimeSlots: prev.selectedTimeSlots.filter(slot => !isSlotPast(slot))
        }));
        return;
      }
    }
    
    // If in edit mode, update the booking directly without payment
    if (isEditMode) {
      await createBooking(false, false);
      return;
    }
    
    if (step === 1) {
      // Book court only - show payment modal
      setPendingBookingType('court');
      setShowPaymentModal(true);
    } else if (step === 2) {
      // Book court + coach - show payment modal
      setPendingBookingType('court+coach');
      setShowPaymentModal(true);
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    // Validate required fields
    if (!formData.sport || !formData.date || !formData.selectedTimeSlots || formData.selectedTimeSlots.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please select a sport, date, and at least one time slot',
        confirmButtonColor: '#10b981'
      });
      return;
    }
    
    if (step === 1) {
    setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleFinish = async (e) => {
    e.preventDefault();
    // Book court + coach + items - show payment modal
    setPendingBookingType('court+coach+items');
    setShowPaymentModal(true);
  };

  // Card formatting functions
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setPaymentData({ ...paymentData, cardNumber: formatted });
    }
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    if (value.length <= 5) {
      setPaymentData({ ...paymentData, expiryDate: value });
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    // Validate payment data
    if (!paymentData.cardNumber || !paymentData.cardName || !paymentData.expiryDate || !paymentData.cvv) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Payment Details',
        text: 'Please fill in all payment details',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    // Validate card number
    const cardNumberDigits = paymentData.cardNumber.replace(/\s/g, '');
    if (cardNumberDigits.length !== 16 || !/^\d+$/.test(cardNumberDigits)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Card Number',
        text: 'Please enter a valid 16-digit card number',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    // Validate CVV
    if (!/^\d{3,4}$/.test(paymentData.cvv)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid CVV',
        text: 'Please enter a valid CVV (3-4 digits)',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    setSubmitting(true);

    try {
      // Process booking based on type
      if (pendingBookingType === 'court') {
        await createBooking(false, false, true);
        // Show success message
        await Swal.fire({
          icon: 'success',
          title: 'Payment Successful!',
          text: 'Your booking has been confirmed. You will be redirected to your dashboard.',
          confirmButtonColor: '#10b981'
        });
        // Close modal and reset payment data
        setShowPaymentModal(false);
        setPaymentData({ cardNumber: '', cardName: '', expiryDate: '', cvv: '' });
        setPendingBookingType(null);
        setPendingBookingUpdate(null);
        navigate('/user/dashboard');
      } else if (pendingBookingType === 'court+coach') {
        await createBooking(true, false, true);
        // Show success message
        await Swal.fire({
          icon: 'success',
          title: 'Payment Successful!',
          text: 'Your booking with coach has been confirmed. You will be redirected to your dashboard.',
          confirmButtonColor: '#10b981'
        });
        // Close modal and reset payment data
        setShowPaymentModal(false);
        setPaymentData({ cardNumber: '', cardName: '', expiryDate: '', cvv: '' });
        setPendingBookingType(null);
        setPendingBookingUpdate(null);
        navigate('/user/dashboard');
      } else if (pendingBookingType === 'court+coach+items') {
        await createBooking(true, true, true);
        // Show success message
        await Swal.fire({
          icon: 'success',
          title: 'Payment Successful!',
          text: 'Your booking with coach and equipment has been confirmed. You will be redirected to your dashboard.',
          confirmButtonColor: '#10b981'
        });
        // Close modal and reset payment data
        setShowPaymentModal(false);
        setPaymentData({ cardNumber: '', cardName: '', expiryDate: '', cvv: '' });
        setPendingBookingType(null);
        setPendingBookingUpdate(null);
        navigate('/user/dashboard');
      } else if (pendingBookingType === 'update' && pendingBookingUpdate) {
        // Update existing booking after payment
        const { bookingId, bookingData, additionalHours } = pendingBookingUpdate;
        
        // Ensure updatedAt is set
        const updateData = {
          ...bookingData,
          updatedAt: serverTimestamp()
        };
        
        await updateDoc(doc(db, 'bookings', bookingId), updateData);
        
        await Swal.fire({
          icon: 'success',
          title: 'Payment Successful!',
          text: `Your booking has been updated. You have been charged £${pendingBookingUpdate.additionalCost.toFixed(2)} for ${additionalHours} additional ${additionalHours === 1 ? 'hour' : 'hours'}.`,
          confirmButtonColor: '#10b981'
        });
        
        // Close modal and reset payment data
        setShowPaymentModal(false);
        setPaymentData({ cardNumber: '', cardName: '', expiryDate: '', cvv: '' });
        setPendingBookingType(null);
        setPendingBookingUpdate(null);
        
        navigate('/user/dashboard');
        return;
      }
    } catch (error) {
      // Error handling is done in createBooking, modal stays open
      console.error('Payment processing error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleItemToggle = (item) => {
    setFormData(prev => {
      const existingItemIndex = prev.items.findIndex(i => i.itemId === item.id);
      
      if (existingItemIndex > -1) {
        // Remove item if already in cart
        return {
          ...prev,
          items: prev.items.filter(i => i.itemId !== item.id)
        };
      } else {
        // Add item to cart
        return {
          ...prev,
          items: [...prev.items, {
            itemId: item.id,
            name: item.name,
            price: item.price || 0,
            quantity: 1
          }]
        };
      }
    });
  };

  const handleItemQuantityChange = (itemId, quantity) => {
    if (quantity < 1) return;
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.itemId === itemId 
          ? { ...item, quantity: parseInt(quantity) }
          : item
      )
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header user={user} />
      
      <div className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">
            {isEditMode ? 'Edit Booking' : `Book ${complex?.name || 'Sports Complex'}`}
          </h1>

          {/* Step Indicator - Hide in edit mode */}
          {!isEditMode && (
          <div className="mb-6 flex items-center justify-center">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 1 ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-20 h-1 ${step >= 2 ? 'bg-primary' : 'bg-gray-300'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 2 ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
                <div className={`w-20 h-1 ${step >= 3 ? 'bg-primary' : 'bg-gray-300'}`}></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= 3 ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  3
            </div>
          </div>
            </div>
          )}

          <form onSubmit={isEditMode ? (e) => { e.preventDefault(); handleBookNow(e); } : (step === 3 ? handleFinish : handleNext)} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
            {/* Step 1: Court/Time Slot Selection */}
            {(step === 1 || isEditMode) && (
              <>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Sport *</label>
                  <select
                    name="sport"
                    value={formData.sport}
                    onChange={handleChange}
                    required
                    disabled={isEditMode}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">Select a sport</option>
                    {complex?.sports && Array.isArray(complex.sports) && complex.sports.length > 0 ? (
                      complex.sports.map((sport, index) => (
                        <option key={index} value={sport.toLowerCase()}>
                          {sport.charAt(0).toUpperCase() + sport.slice(1)}
                        </option>
                      ))
                    ) : (
                      <option value="pitch">Pitch (Default)</option>
                    )}
                  </select>
                  {complex?.sports && Array.isArray(complex.sports) && complex.sports.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">No specific sports available for this complex</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Select Time Slots
                    {formData.date && fetchingSlots && (
                      <span className="ml-2 text-sm text-gray-500">(Checking availability...)</span>
                    )}
                    {formData.selectedTimeSlots && formData.selectedTimeSlots.length > 0 && (
                      <span className="ml-2 text-sm text-green-600">
                        ({formData.selectedTimeSlots.length} {formData.selectedTimeSlots.length === 1 ? 'slot' : 'slots'} selected)
                      </span>
                    )}
                  </label>
                  {!formData.date ? (
                    <p className="text-sm text-gray-500 py-4">Please select a date first</p>
                  ) : fetchingSlots ? (
                    <p className="text-sm text-gray-500 py-4">Loading available slots...</p>
                  ) : availableStartTimes.length === 0 ? (
                    <p className="text-sm text-red-600 py-4">
                      All time slots are booked for this date. Please select a different date.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 border border-gray-300 rounded-lg bg-gray-50 max-h-64 overflow-y-auto">
                      {(() => {
                        // Calculate once outside the map for better performance
                        const isBookingToday = isToday(formData.date);
                        return availableStartTimes.map(slot => {
                        const isSelected = formData.selectedTimeSlots?.includes(slot) || false;
                          const isPast = isBookingToday && isSlotPast(slot);
                          const isConsecutive = !isPast && (formData.selectedTimeSlots?.length === 0 || 
                            checkConsecutiveSlots([...formData.selectedTimeSlots, slot]));
                          const canSelect = !isPast && (isConsecutive || isSelected);
                        
                        return (
                          <label
                            key={slot}
                            onClick={(e) => {
                              e.preventDefault();
                              if (canSelect) {
                                handleTimeSlotToggle(slot);
                              }
                            }}
                            className={`flex items-center justify-center space-x-2 p-3 border-2 rounded-lg transition-all duration-200 ${
                              isPast
                                ? 'bg-red-50 border-red-200 cursor-not-allowed opacity-50'
                                : isSelected
                                ? 'bg-green-500 border-green-600 text-white shadow-md cursor-pointer'
                                : isConsecutive
                                ? 'bg-white border-gray-300 hover:border-green-500 hover:bg-green-50 hover:shadow-sm cursor-pointer'
                                : 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (canSelect) {
                                  handleTimeSlotToggle(slot);
                                }
                              }}
                              disabled={!canSelect}
                              className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                              style={{ accentColor: isSelected ? '#ffffff' : '#22c55e', cursor: canSelect ? 'pointer' : 'not-allowed' }}
                            />
                            <span className={`text-sm font-medium ${isSelected ? 'text-white' : isPast ? 'text-red-600' : 'text-gray-700'}`}>
                              {slot}
                              {isSelected && <span className="ml-1">✓</span>}
                            </span>
                          </label>
                        );
                      });
                      })()}
                    </div>
                  )}
                  {formData.selectedTimeSlots && formData.selectedTimeSlots.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Selected:</strong> {formData.selectedTimeSlots.sort().join(', ')}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        <strong>Duration:</strong> {formData.selectedTimeSlots.length} {formData.selectedTimeSlots.length === 1 ? 'hour' : 'hours'}
                        {(() => {
                          const range = getTimeRange();
                          return range.start && range.end ? ` (${range.start} - ${range.end})` : '';
                        })()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Booking Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Price Per Hour</span>
                      <span>£{(complex?.pricePerHour || 50).toFixed(2)}</span>
                    </div>
                    {formData.selectedTimeSlots && formData.selectedTimeSlots.length > 0 && (
                      <>
                      <div className="flex justify-between">
                          <span>Total Hours Selected</span>
                        <span>{formData.selectedTimeSlots.length} {formData.selectedTimeSlots.length === 1 ? 'hour' : 'hours'}</span>
                        </div>
                        {isEditMode && originalHours > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Free Hours (Already Paid)</span>
                            <span>{originalHours} {originalHours === 1 ? 'hour' : 'hours'} (Free)</span>
                      </div>
                    )}
                        {isEditMode && originalHours > 0 && formData.selectedTimeSlots.length > originalHours && (
                          <div className="flex justify-between">
                            <span>Additional Hours</span>
                            <span>{formData.selectedTimeSlots.length - originalHours} {(formData.selectedTimeSlots.length - originalHours) === 1 ? 'hour' : 'hours'}</span>
                          </div>
                        )}
                        {isEditMode && originalHours > 0 && formData.selectedTimeSlots.length < originalHours && (
                          <div className="flex justify-between text-blue-600">
                            <span>Reduced Hours</span>
                            <span>{originalHours - formData.selectedTimeSlots.length} {(originalHours - formData.selectedTimeSlots.length) === 1 ? 'hour' : 'hours'} less</span>
                          </div>
                        )}
                      </>
                    )}
                    {!isEditMode && (
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>£{((complex?.pricePerHour || 50) * (formData.selectedTimeSlots?.length || 0)).toFixed(2)}</span>
                    </div>
                    )}
                    {isEditMode && originalHours > 0 && formData.selectedTimeSlots.length > originalHours && (
                      <div className="flex justify-between">
                        <span>Subtotal (Additional Hours Only)</span>
                        <span>£{((complex?.pricePerHour || 50) * (formData.selectedTimeSlots.length - originalHours)).toFixed(2)}</span>
                      </div>
                    )}
                    {getDiscountAmount() > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Package Discount ({getDiscountPercent()}%)</span>
                        <span>-£{getDiscountAmount().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between text-lg font-bold">
                      <span>{isEditMode && originalHours > 0 && formData.selectedTimeSlots.length <= originalHours ? 'Total (No Additional Charge)' : 'Total'}</span>
                      <span>£{calculateTotal(false, false).toFixed(2)}</span>
                    </div>
                    {isEditMode && originalHours > 0 && formData.selectedTimeSlots.length < originalHours && (
                      <div className="text-sm text-blue-600 mt-2">
                        <p>Note: You selected fewer hours than originally paid. The difference will be credited to your account.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  {isEditMode ? (
                    <>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Updating...' : 'Update Booking'}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/user/dashboard')}
                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold"
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    onClick={handleBookNow}
                        disabled={submitting || !formData.sport || !formData.date || !formData.selectedTimeSlots || formData.selectedTimeSlots.length === 0}
                    className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Processing...' : 'Book Now'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Step 2: Coach Selection */}
            {step === 2 && !isEditMode && (
              <>
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Selected Booking Details</h3>
                  <p className="text-sm text-blue-700"><strong>Date:</strong> {formData.date}</p>
                  {(() => {
                    const range = getTimeRange();
                    return (
                      <>
                        <p className="text-sm text-blue-700">
                          <strong>Time:</strong> {range.start && range.end ? `${range.start} - ${range.end}` : '-'}
                        </p>
                        <p className="text-sm text-blue-700">
                          <strong>Duration:</strong> {formData.selectedTimeSlots?.length || 0} {formData.selectedTimeSlots?.length === 1 ? 'hour' : 'hours'}
                        </p>
                      </>
                    );
                  })()}
                </div>

                <div>
                  <label className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      name="coachRequired"
                      checked={formData.coachRequired}
                      onChange={handleChange}
                      className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-gray-700 font-semibold text-lg">Hire a Professional Coach (Optional)</span>
                  </label>
                  
                  {formData.coachRequired && (
                    <div className="mt-4">
                      <label className="block text-gray-700 font-semibold mb-2">Select Coach</label>
                    <select
                      name="coachId"
                      value={formData.coachId}
                      onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select a coach</option>
                      {coaches.map(coach => (
                        <option key={coach.id} value={coach.id}>
                            {coach.name} - £{coach.price || 30}/hour
                        </option>
                      ))}
                    </select>
                      {coaches.length === 0 && (
                        <p className="text-sm text-gray-500 mt-2">No coaches available for this complex.</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Booking Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Court Booking</span>
                      <span>£{((complex?.pricePerHour || 50) * (formData.selectedTimeSlots?.length || 0)).toFixed(2)}</span>
                    </div>
                    {getDiscountAmount() > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Package Discount ({getDiscountPercent()}%)</span>
                        <span>-£{getDiscountAmount().toFixed(2)}</span>
                      </div>
                    )}
                    {formData.coachRequired && formData.coachId && (
                    <div className="flex justify-between">
                        <span>Coach Fee ({formData.selectedTimeSlots?.length || 0} {formData.selectedTimeSlots?.length === 1 ? 'hour' : 'hours'})</span>
                        <span>£{((coaches.find(c => c.id === formData.coachId)?.price || 30) * (formData.selectedTimeSlots?.length || 0)).toFixed(2)}</span>
                    </div>
                    )}
                    <div className="border-t pt-2 flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>£{calculateTotal(true, false).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold"
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    onClick={handleBookNow}
                    disabled={submitting}
                    className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Processing...' : 'Book Now'}
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Sport Items Selection */}
            {step === 3 && !isEditMode && (
              <>
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Selected Booking Details</h3>
                  <p className="text-sm text-blue-700"><strong>Date:</strong> {formData.date}</p>
                  {(() => {
                    const range = getTimeRange();
                    return (
                      <>
                        <p className="text-sm text-blue-700">
                          <strong>Time:</strong> {range.start && range.end ? `${range.start} - ${range.end}` : '-'}
                        </p>
                        <p className="text-sm text-blue-700">
                          <strong>Duration:</strong> {formData.selectedTimeSlots?.length || 0} {formData.selectedTimeSlots?.length === 1 ? 'hour' : 'hours'}
                        </p>
                        {formData.coachRequired && formData.coachId && (
                          <p className="text-sm text-blue-700">
                            <strong>Coach:</strong> {coaches.find(c => c.id === formData.coachId)?.name || 'Selected'}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Select Sport Items (Optional)</h3>
                  {sportsItems.length === 0 ? (
                    <p className="text-gray-600 py-4">No sport items available at the moment.</p>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">Select Equipment</label>
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              const selectedItem = sportsItems.find(item => item.id === e.target.value);
                              if (selectedItem) {
                                handleItemToggle(selectedItem);
                                e.target.value = ''; // Reset dropdown
                              }
                            }
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="">Select equipment to add</option>
                          {sportsItems.map(item => {
                            const isAlreadySelected = formData.items.some(i => i.itemId === item.id);
                            return (
                              <option 
                                key={item.id} 
                                value={item.id}
                                disabled={isAlreadySelected}
                              >
                                {item.name} - £{item.price?.toFixed(2) || '0.00'}
                                {item.description ? ` (${item.description.substring(0, 50)}${item.description.length > 50 ? '...' : ''})` : ''}
                                {isAlreadySelected ? ' (Already added)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      
                      {formData.items.length > 0 && (
                        <div className="mt-4 space-y-3">
                          <h4 className="font-semibold text-gray-800 mb-2">Selected Items:</h4>
                          {formData.items.map(item => {
                            const fullItem = sportsItems.find(i => i.id === item.itemId);
                            return (
                              <div 
                                key={item.itemId} 
                                className="p-4 bg-green-50 border border-green-200 rounded-lg"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <h5 className="font-semibold text-gray-800">{item.name}</h5>
                                    {fullItem?.description && (
                                      <p className="text-sm text-gray-600 mt-1">{fullItem.description}</p>
                                    )}
                                    <p className="text-sm text-primary font-semibold mt-1">
                                      £{item.price?.toFixed(2) || '0.00'} each
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleItemToggle(fullItem || item)}
                                    className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <div className="mt-3 pt-3 border-t border-green-300">
                                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Quantity:
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity || 1}
                                    onChange={(e) => handleItemQuantityChange(item.itemId, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                  />
                                  <p className="text-sm text-gray-600 mt-1">
                                    Subtotal: £{(item.price * item.quantity).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Final Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Court Booking</span>
                      <span>£{((complex?.pricePerHour || 50) * (formData.selectedTimeSlots?.length || 0)).toFixed(2)}</span>
                    </div>
                    {getDiscountAmount() > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Package Discount ({getDiscountPercent()}%)</span>
                        <span>-£{getDiscountAmount().toFixed(2)}</span>
                      </div>
                    )}
                    {formData.coachRequired && formData.coachId && (
                      <div className="flex justify-between">
                        <span>Coach Fee</span>
                        <span>£{((coaches.find(c => c.id === formData.coachId)?.price || 30) * (formData.selectedTimeSlots?.length || 0)).toFixed(2)}</span>
                      </div>
                    )}
                    {formData.items.length > 0 && (
                      <div className="flex justify-between">
                        <span>Sport Items</span>
                        <span>£{formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>£{calculateTotal(true, true).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50"
                  >
                    {submitting ? 'Processing...' : 'Finish'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>

      {/* Payment Modal with Visual Card */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-800">Complete Payment</h3>
                  <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentData({ cardNumber: '', cardName: '', expiryDate: '', cvv: '' });
                  setPendingBookingType(null);
                  setPendingBookingUpdate(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                ×
                  </button>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="p-6">
              <div className="max-w-2xl mx-auto space-y-4">
                  {/* Booking Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      {pendingBookingType === 'update' ? 'Booking Update - Additional Charges' : 'Booking Summary'}
                    </h4>
                    <div className="space-y-2 text-sm">
                      {pendingBookingType === 'update' && pendingBookingUpdate ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Additional Hours ({pendingBookingUpdate.additionalHours} {pendingBookingUpdate.additionalHours === 1 ? 'hour' : 'hours'})</span>
                            <span className="font-semibold">£{((complex?.pricePerHour || 50) * pendingBookingUpdate.additionalHours).toFixed(2)}</span>
                          </div>
                          {userPackage && userPackage !== 'normal' && (
                            <div className="flex justify-between text-green-600">
                              <span className="text-gray-600">Package Discount ({userPackage === 'package2' ? 2 : userPackage === 'package3' ? 5 : 0}%)</span>
                              <span className="font-semibold">-£{(((complex?.pricePerHour || 50) * pendingBookingUpdate.additionalHours) - pendingBookingUpdate.additionalCost).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t border-gray-300">
                            <span className="font-bold text-lg">Additional Charge</span>
                            <span className="font-bold text-lg text-primary">
                              £{pendingBookingUpdate.additionalCost.toFixed(2)}
                            </span>
                </div>
              </>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Court Booking</span>
                            <span className="font-semibold">£{((complex?.pricePerHour || 50) * (formData.selectedTimeSlots?.length || 0)).toFixed(2)}</span>
                          </div>
                          {getDiscountAmount() > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span className="text-gray-600">Package Discount ({getDiscountPercent()}%)</span>
                              <span className="font-semibold">-£{getDiscountAmount().toFixed(2)}</span>
                            </div>
                          )}
                          {formData.coachRequired && formData.coachId && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Coach Fee</span>
                              <span className="font-semibold">£{((coaches.find(c => c.id === formData.coachId)?.price || 30) * (formData.selectedTimeSlots?.length || 0)).toFixed(2)}</span>
                            </div>
                          )}
                          {formData.items.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Sport Items</span>
                              <span className="font-semibold">£{formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t border-gray-300">
                            <span className="font-bold text-lg">Total</span>
                            <span className="font-bold text-lg text-primary">
                              £{calculateTotal(formData.coachRequired && formData.coachId, formData.items.length > 0).toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Card Details Form */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Card Details</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">Card Number *</label>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          value={paymentData.cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">Name on Card *</label>
                        <input
                          type="text"
                          required
                          value={paymentData.cardName}
                          onChange={(e) => setPaymentData({ ...paymentData, cardName: e.target.value.toUpperCase() })}
                          placeholder="JOHN DOE"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition uppercase"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 font-semibold mb-2">Expiry Date *</label>
                          <input
                            type="text"
                            required
                            maxLength={5}
                            value={paymentData.expiryDate}
                            onChange={handleExpiryChange}
                            placeholder="MM/YY"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-semibold mb-2">CVV *</label>
                          <input
                            type="text"
                            required
                            maxLength={4}
                            value={paymentData.cvv}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              if (value.length <= 4) {
                                setPaymentData({ ...paymentData, cvv: value });
                              }
                            }}
                            placeholder="123"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Note */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Your payment information is secure and encrypted.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPaymentModal(false);
                        setPaymentData({ cardNumber: '', cardName: '', expiryDate: '', cvv: '' });
                        setPendingBookingType(null);
                        setPendingBookingUpdate(null);
                      }}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Processing Payment...' : pendingBookingType === 'update' ? 'Pay & Update Booking' : 'Pay Now'}
                    </button>
                </div>
              </div>
          </form>
        </div>
      </div>
      )}
      
      <Footer />
    </div>
  );
};

export default Booking;
