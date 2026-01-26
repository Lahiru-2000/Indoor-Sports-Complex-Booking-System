import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Swal from 'sweetalert2';

const Restaurant = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [foodItems, setFoodItems] = useState([]);
  const [complexes, setComplexes] = useState([]);
  const [selectedComplexId, setSelectedComplexId] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const complexesSnapshot = await getDocs(collection(db, 'complexes'));
        const complexesData = complexesSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(complex => complex.status !== 'deleted');
        setComplexes(complexesData);

        const itemsSnapshot = await getDocs(collection(db, 'foodItems'));
        const itemsData = itemsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(item => item.status !== 'deleted');
        setFoodItems(itemsData);
      } catch (error) {
        console.error('Error fetching food items:', error);
        try {
          const drinksSnapshot = await getDocs(collection(db, 'drinks'));
          const drinksData = drinksSnapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .filter(item => item.status !== 'deleted');
          setFoodItems(drinksData);
        } catch (drinksError) {
          console.error('Error fetching drinks:', drinksError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const categories = ['all', ...new Set(foodItems.map(item => item.category).filter(Boolean))];

  const filteredItems = filter === 'all' 
    ? foodItems 
    : foodItems.filter(item => item.category === filter);

  const addToCart = (item) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!selectedComplexId) {
      Swal.fire({
        icon: 'warning',
        title: 'Select Complex',
        text: 'Please select a complex first before adding items to cart.',
        confirmButtonColor: '#10b981'
      });
      return;
    }
    const existingItem = cart.find(c => c.itemId === item.id);
    if (existingItem) {
      setCart(cart.map(c => 
        c.itemId === item.id 
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCart([...cart, {
        itemId: item.id,
        name: item.name,
        price: item.price || 0,
        quantity: 1
      }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(c => c.itemId !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }
    setCart(cart.map(c => 
      c.itemId === itemId 
        ? { ...c, quantity: parseInt(quantity) }
        : c
    ));
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handlePurchase = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!selectedComplexId) {
      Swal.fire({
        icon: 'warning',
        title: 'Select Complex',
        text: 'Please select a complex first.',
        confirmButtonColor: '#10b981'
      });
      return;
    }
    if (cart.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Cart',
        text: 'Your cart is empty. Please add items to purchase.',
        confirmButtonColor: '#10b981'
      });
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (!paymentData.cardNumber || !paymentData.cardName || !paymentData.expiryDate || !paymentData.cvv) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Payment Details',
        text: 'Please fill in all payment details',
        confirmButtonColor: '#10b981'
      });
      return;
    }

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
      const purchaseData = {
        userId: user.uid,
        complexId: selectedComplexId,
        items: cart,
        total: getCartTotal(),
        status: 'pending',
        createdAt: serverTimestamp()
      };

      const purchaseRef = await addDoc(collection(db, 'restaurantPurchases'), purchaseData);
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userEmail = userDoc.data()?.email || user.email;
        
        let complexData = null;
        if (selectedComplexId) {
          try {
            const complexDoc = await getDoc(doc(db, 'complexes', selectedComplexId));
            if (complexDoc.exists()) {
              complexData = {
                id: complexDoc.id,
                ...complexDoc.data()
              };
            }
          } catch (complexError) {
            console.error('Error fetching complex details:', complexError);
          }
        }
        
        if (userEmail) {
          const { sendRestaurantEmail } = await import('../utils/emailService');
          await sendRestaurantEmail({
            orderId: purchaseRef.id,
            items: cart,
            total: getCartTotal(),
            status: 'pending',
            complexId: selectedComplexId,
            complex: complexData
          }, userEmail);
        }
      } catch (emailError) {
        console.error('Error sending restaurant email:', emailError);
      }
      
      setCart([]);
      setShowPaymentModal(false);
      setPaymentData({ cardNumber: '', cardName: '', expiryDate: '', cvv: '' });
      await Swal.fire({
        icon: 'success',
        title: 'Purchase Successful!',
        text: 'Your restaurant order has been placed.',
        confirmButtonColor: '#10b981'
      });
      navigate('/user/dashboard');
    } catch (error) {
      console.error('Error creating purchase:', error);
      Swal.fire({
        icon: 'error',
        title: 'Purchase Failed',
        text: 'Error processing purchase. Please try again.',
        confirmButtonColor: '#10b981'
      });
    } finally {
      setSubmitting(false);
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <div className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Restaurant & Cafe</h1>
            <p className="text-gray-600 text-lg">
              Enjoy delicious meals, snacks, and beverages at our restaurant
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <label className="block text-gray-700 font-semibold mb-3">
              Select Complex <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedComplexId}
              onChange={(e) => {
                setSelectedComplexId(e.target.value);
                if (e.target.value !== selectedComplexId) {
                  setCart([]);
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              <option value="">-- Select a Complex --</option>
              {complexes.map((complex) => (
                <option key={complex.id} value={complex.id}>
                  {complex.name}
                </option>
              ))}
            </select>
            {!selectedComplexId && (
              <p className="text-sm text-gray-500 mt-2">
                Please select a complex to start adding items to your cart.
              </p>
            )}
          </div>

          {cart.length > 0 && (
            <div className="fixed bottom-6 right-6 z-40">
              <button
                onClick={() => setShowCart(!showCart)}
                className="bg-primary text-white px-6 py-3 rounded-full shadow-lg hover:bg-primary-dark transition flex items-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="font-semibold">Cart ({cart.length})</span>
                <span className="font-bold">£{getCartTotal().toFixed(2)}</span>
              </button>
            </div>
          )}

          {showCart && cart.length > 0 && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-end">
              <div className="bg-white h-full w-full max-w-md shadow-xl overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Shopping Cart</h2>
                  <button
                    onClick={() => setShowCart(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  {cart.map((item) => (
                    <div key={item.itemId} className="flex items-center justify-between border-b border-gray-200 pb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{item.name}</h3>
                        <p className="text-primary font-semibold">£{item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.itemId, e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                        <button
                          onClick={() => removeFromCart(item.itemId)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-xl font-bold mb-4">
                      <span>Total</span>
                      <span className="text-primary">£{getCartTotal().toFixed(2)}</span>
                    </div>
                    <button
                      onClick={handlePurchase}
                      className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold"
                    >
                      Proceed to Payment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filter === category
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading menu...</div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No items found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                >
                  {item.image && (
                    <div className="w-full h-48 bg-gray-200 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{item.name}</h3>
                      {item.category && (
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                          {item.category}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-primary">
                        £{item.price?.toFixed(2) || '0.00'}
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        disabled={!selectedComplexId}
                        className={`px-4 py-2 rounded-lg transition font-semibold ${
                          selectedComplexId
                            ? 'bg-primary text-white hover:bg-primary-dark'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {selectedComplexId ? 'Add to Cart' : 'Select Complex'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-800">Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3">Order Summary</h4>
                <div className="space-y-2 text-sm">
                  {cart.map(item => (
                    <div key={item.itemId} className="flex justify-between">
                      <span className="text-gray-600">{item.name} x{item.quantity}</span>
                      <span className="font-semibold">£{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-lg text-primary">£{getCartTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-4">Card Details</h4>
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Name on Card *</label>
                    <input
                      type="text"
                      required
                      value={paymentData.cardName}
                      onChange={(e) => setPaymentData({ ...paymentData, cardName: e.target.value })}
                      placeholder="John Doe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
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
                  onClick={() => setShowPaymentModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Processing Payment...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Restaurant;

