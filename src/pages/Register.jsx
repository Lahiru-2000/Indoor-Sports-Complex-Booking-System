import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, deleteUser } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PACKAGE_PRICES = {
  package2: 10.00,
  package3: 20.00
};

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    package: 'normal'
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
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.package === 'normal') {
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

      navigate('/user/dashboard');
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
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Register</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Confirm your password"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Select Package *</label>
              <div className="space-y-3">
                <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition" style={{ borderColor: formData.package === 'normal' ? '#3b82f6' : '#e5e7eb' }}>
                  <input
                    type="radio"
                    name="package"
                    value="normal"
                    checked={formData.package === 'normal'}
                    onChange={handleChange}
                    className="mt-1 mr-3"
                    required
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">Normal Package</div>
                    <div className="text-sm text-gray-600">Standard pricing for all bookings</div>
                  </div>
                </label>
                
                <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition" style={{ borderColor: formData.package === 'package2' ? '#3b82f6' : '#e5e7eb' }}>
                  <input
                    type="radio"
                    name="package"
                    value="package2"
                    checked={formData.package === 'package2'}
                    onChange={handleChange}
                    className="mt-1 mr-3"
                    required
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-gray-800">Package 2</div>
                      <div className="font-bold text-primary">£{PACKAGE_PRICES.package2.toFixed(2)}</div>
                    </div>
                    <div className="text-sm text-gray-600">2% discount on pitch bookings</div>
                  </div>
                </label>
                
                <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition" style={{ borderColor: formData.package === 'package3' ? '#3b82f6' : '#e5e7eb' }}>
                  <input
                    type="radio"
                    name="package"
                    value="package3"
                    checked={formData.package === 'package3'}
                    onChange={handleChange}
                    className="mt-1 mr-3"
                    required
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-gray-800">Package 3</div>
                      <div className="font-bold text-primary">£{PACKAGE_PRICES.package3.toFixed(2)}</div>
                    </div>
                    <div className="text-sm text-gray-600">5% discount on pitch bookings</div>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50"
            >
              {loading ? 'Creating account...' : formData.package === 'normal' ? 'Create Account' : `Continue to Payment (£${getPackagePrice().toFixed(2)})`}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-semibold">
              Login here
            </Link>
          </p>
        </div>
      </div>

      {/* Payment Modal for Package 2 and Package 3 */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-800">Package Payment</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentData({ cardNumber: '', cardName: '', expiryDate: '', cvv: '' });
                  setError('');
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6">
              <div className="mb-6">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-semibold">
                      {formData.package === 'package2' ? 'Package 2' : 'Package 3'}
                    </span>
                    <span className="text-2xl font-bold text-primary">£{getPackagePrice().toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formData.package === 'package2' ? '2% discount on pitch bookings' : '5% discount on pitch bookings'}
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Card Number *</label>
                  <input
                    type="text"
                    value={paymentData.cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Cardholder Name *</label>
                  <input
                    type="text"
                    value={paymentData.cardName}
                    onChange={(e) => setPaymentData({ ...paymentData, cardName: e.target.value.toUpperCase() })}
                    placeholder="JOHN DOE"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Expiry Date *</label>
                    <input
                      type="text"
                      value={paymentData.expiryDate}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      maxLength="5"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">CVV *</label>
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingPayment ? 'Processing Payment...' : `Pay £${getPackagePrice().toFixed(2)}`}
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





