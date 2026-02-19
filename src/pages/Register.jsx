import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, deleteUser, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Swal from 'sweetalert2';

const PACKAGE_PRICES = {
  silver: 10.00,
  gold: 20.00
};

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    package: 'basic'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: value
    };
    setFormData(updatedFormData);
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      });
    }
    
    // Real-time password validation with updated values
    if (name === 'password' || name === 'confirmPassword') {
      validatePassword(updatedFormData);
    }
    
    // Real-time email validation
    if (name === 'email') {
      validateEmail(value);
    }
    
    // Real-time phone validation
    if (name === 'phone') {
      validatePhone(value);
    }
  };
  
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setFieldErrors(prev => ({ ...prev, email: '' }));
    }
  };
  
  const validatePhone = (phone) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (phone && !phoneRegex.test(phone)) {
      setFieldErrors(prev => ({ ...prev, phone: 'Please enter a valid phone number' }));
    } else {
      setFieldErrors(prev => ({ ...prev, phone: '' }));
    }
  };
  
  const validatePassword = (formDataToValidate = formData) => {
    const errors = {};
    
    if (formDataToValidate.password && formDataToValidate.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    // Only show mismatch error if both fields have values
    if (formDataToValidate.confirmPassword) {
      if (formDataToValidate.password !== formDataToValidate.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      } else {
        // Clear error if passwords match
        errors.confirmPassword = '';
      }
    }
    
    setFieldErrors(prev => ({ ...prev, ...errors }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Validate all fields
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else {
      validateEmail(formData.email);
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (formData.package === 'basic') {
      await createAccount();
    } else {
      setShowPaymentModal(true);
    }
  };

  const createAccount = async () => {
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      try {
        await updateProfile(userCredential.user, {
          displayName: formData.name
        });
      } catch (err) {
        console.warn('updateProfile failed:', err);
      }

      try {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || '',
          role: 'user',
          package: formData.package,
          createdAt: serverTimestamp()
        });
      } catch (fireErr) {
        console.error('Failed to create Firestore user doc:', fireErr);
        try {
          await deleteUser(userCredential.user);
          console.info('Rolled back created auth user due to Firestore failure');
        } catch (delErr) {
          console.error('Failed to delete auth user after Firestore failure:', delErr);
        }
        throw fireErr;
      }

      // Sign out the user immediately after creating Firestore document
      // This prevents the dashboard button from appearing in the navbar
      try {
        await signOut(auth);
        // Wait for auth state to fully update before showing notification
        // This ensures the Header component has time to update and remove the dashboard button
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (signOutErr) {
        console.error('Error signing out after registration:', signOutErr);
      }

      // Show success notification
      await Swal.fire({
        icon: 'success',
        title: 'Profile Created Successfully!',
        text: 'Your account has been created. Please login to continue.',
        confirmButtonColor: '#22c55e',
        confirmButtonText: 'Go to Login'
      });

      // Navigate to login page
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
    setError('');

    // Validate payment data
    if (!paymentData.cardNumber || !paymentData.cardName || !paymentData.expiryDate || !paymentData.cvv) {
      setError('Please fill in all payment details');
      return;
    }

    // Validate card number
    const cardNumberDigits = paymentData.cardNumber.replace(/\s/g, '');
    if (cardNumberDigits.length !== 16 || !/^\d+$/.test(cardNumberDigits)) {
      setError('Please enter a valid 16-digit card number');
      return;
    }

    // Validate CVV
    if (!/^\d{3,4}$/.test(paymentData.cvv)) {
      setError('Please enter a valid CVV (3-4 digits)');
      return;
    }

    setProcessingPayment(true);

    try {
      // Process payment (in a real app, this would call a payment gateway API)
      // For now, we'll simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

      // Record package purchase in Firestore (before creating account)
      const packagePrice = PACKAGE_PRICES[formData.package];
      try {
        await addDoc(collection(db, 'packagePurchases'), {
          email: formData.email,
          package: formData.package,
          amount: packagePrice,
          status: 'completed',
          createdAt: serverTimestamp()
        });
      } catch (purchaseErr) {
        console.error('Error recording package purchase:', purchaseErr);
        // Continue with account creation even if purchase record fails
      }

      // Close payment modal
      setShowPaymentModal(false);
      setPaymentData({ cardNumber: '', cardName: '', expiryDate: '', cvv: '' });

      // Now create the account
      await createAccount();
    } catch (err) {
      setError('Payment processing failed. Please try again.');
      console.error('Payment error:', err);
    } finally {
      setProcessingPayment(false);
    }
  };

  const getPackagePrice = () => {
    return PACKAGE_PRICES[formData.package] || 0;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div 
        className="flex-1 flex items-center justify-center px-4 py-12 relative"
        style={{
          backgroundImage: `url('/images/${encodeURIComponent('sport complex.jpg')}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl p-6 sm:p-8 md:p-10 relative z-10 my-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">Create Your Account</h2>
            <p className="text-gray-600">Join us and start booking your favorite sports facilities</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-start">
              <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-all focus:ring-2 focus:ring-primary focus:border-transparent ${
                      fieldErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="John Doe"
                  />
                </div>
                {fieldErrors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-all focus:ring-2 focus:ring-primary focus:border-transparent ${
                      fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="john@example.com"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.email}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-all focus:ring-2 focus:ring-primary focus:border-transparent ${
                    fieldErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="+44 123 456 7890"
                />
              </div>
              {fieldErrors.phone && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.phone}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg transition-all focus:ring-2 focus:ring-primary focus:border-transparent ${
                      fieldErrors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg transition-all focus:ring-2 focus:ring-primary focus:border-transparent ${
                      fieldErrors.confirmPassword ? 'border-red-500 bg-red-50' : formData.confirmPassword && formData.password === formData.confirmPassword ? 'border-green-500 bg-green-50' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {formData.confirmPassword && formData.password === formData.confirmPassword && !fieldErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Passwords match
                  </p>
                )}
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-4 text-sm">
                Select Package <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className={`relative flex flex-col p-5 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-105 ${
                  formData.package === 'basic' 
                    ? 'border-primary bg-primary/5 shadow-lg' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                  <input
                    type="radio"
                    name="package"
                    value="basic"
                    checked={formData.package === 'basic'}
                    onChange={handleChange}
                    className="sr-only"
                    required
                  />
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-lg text-gray-800">Basic</div>
                    {formData.package === 'basic' && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-primary mb-1">Free</div>
                  <div className="text-sm text-gray-600">Standard pricing for all bookings</div>
                </label>
                
                <label className={`relative flex flex-col p-5 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-105 ${
                  formData.package === 'silver' 
                    ? 'border-primary bg-primary/5 shadow-lg' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                  <input
                    type="radio"
                    name="package"
                    value="silver"
                    checked={formData.package === 'silver'}
                    onChange={handleChange}
                    className="sr-only"
                    required
                  />
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-lg text-gray-800">Silver</div>
                    {formData.package === 'silver' && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-primary mb-1">£{PACKAGE_PRICES.silver.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">2% discount on pitch bookings</div>
                </label>
                
                <label className={`relative flex flex-col p-5 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-105 ${
                  formData.package === 'gold' 
                    ? 'border-primary bg-primary/5 shadow-lg' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                  <input
                    type="radio"
                    name="package"
                    value="gold"
                    checked={formData.package === 'gold'}
                    onChange={handleChange}
                    className="sr-only"
                    required
                  />
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-lg text-gray-800">Gold</div>
                    {formData.package === 'gold' && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-primary mb-1">£{PACKAGE_PRICES.gold.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">5% discount on pitch bookings</div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                <>
                  {formData.package === 'basic' ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Create Account
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Continue to Payment (£{getPackagePrice().toFixed(2)})
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-semibold transition-colors">
              Login here
            </Link>
          </p>
        </div>
      </div>

      {/* Payment Modal for Package 2 and Package 3 */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-5 flex justify-between items-center rounded-t-xl">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Complete Payment</h3>
                <p className="text-sm text-gray-600 mt-1">Secure payment processing</p>
              </div>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentData({ cardNumber: '', cardName: '', expiryDate: '', cvv: '' });
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600 text-3xl font-light transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6">
              <div className="mb-6">
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-5 border-2 border-primary/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-800 font-bold text-lg">
                      {formData.package === 'silver' ? 'Silver Package' : 'Gold Package'}
                    </span>
                    <span className="text-3xl font-bold text-primary">£{getPackagePrice().toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">
                    {formData.package === 'silver' ? '2% discount on pitch bookings' : '5% discount on pitch bookings'}
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-start">
                  <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">Card Number <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={paymentData.cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">Cardholder Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={paymentData.cardName}
                      onChange={(e) => setPaymentData({ ...paymentData, cardName: e.target.value.toUpperCase() })}
                      placeholder="JOHN DOE"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">Expiry Date <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={paymentData.expiryDate}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      maxLength="5"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">CVV <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={paymentData.cvv}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 4) {
                          setPaymentData({ ...paymentData, cvv: value });
                        }
                      }}
                      placeholder="123"
                      maxLength="4"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                  <p className="text-sm text-blue-800 flex items-center">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Your payment information is secure and encrypted.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setPaymentData({ cardNumber: '', cardName: '', expiryDate: '', cvv: '' });
                      setError('');
                    }}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processingPayment}
                    className="flex-1 py-3.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    {processingPayment ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Pay £{getPackagePrice().toFixed(2)}
                      </>
                    )}
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

export default Register;





