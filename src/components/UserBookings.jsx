import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UserBookings = ({
  bookings,
  restaurantPurchases,
  equipmentPurchases,
  loading,
  userProfileData,
  isPreview = false,
  onViewAll
}) => {
  const navigate = useNavigate();
  const [bookingTab, setBookingTab] = useState('court'); // 'court', 'restaurant', or 'equipment'
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const itemsPerPage = 10;

  const courtBookings = bookings;

  useEffect(() => {
    setCurrentPage(1);
  }, [bookingTab]);

  // Calculate complex price with discount (without coach)
  const getComplexPriceOnly = (booking) => {
    const pricePerHour = booking.complex?.pricePerHour || 50;
    const hours = booking.hours || 1;
    let courtTotal = pricePerHour * hours;
    
    const userPackage = userProfileData?.package || 'basic';
    const isPaidPackage = userPackage && userPackage !== 'basic' && userPackage !== 'normal';
    if (isPaidPackage) {
      const discountPercent = (userPackage === 'silver' || userPackage === 'package2') ? 2 : (userPackage === 'gold' || userPackage === 'package3') ? 5 : 0;
      if (discountPercent > 0) {
        const discount = (courtTotal * discountPercent) / 100;
        courtTotal = courtTotal - discount;
      }
    }
    
    return courtTotal;
  };

  // Calculate coach price
  const getCoachPrice = (booking) => {
    if (booking.coachRequired && booking.coachId && booking.coach) {
      const coachPrice = booking.coach.price || 30;
      const hours = booking.hours || 1;
      return coachPrice * hours;
    }
    return 0;
  };

  // Calculate total price (complex + coach)
  const getComplexPriceWithDiscount = (booking) => {
    return getComplexPriceOnly(booking) + getCoachPrice(booking);
  };

  const getCurrentBookingData = () => {
    if (bookingTab === 'court') return courtBookings;
    if (bookingTab === 'restaurant') return restaurantPurchases;
    return equipmentPurchases;
  };

  const currentBookingData = getCurrentBookingData();
  const totalPages = Math.ceil(currentBookingData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = currentBookingData.slice(startIndex, endIndex);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    let dateObj;
    if (date.toDate) {
      dateObj = date.toDate();
    } else {
      dateObj = new Date(date);
    }
    return dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const convertTo12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes || '00'} ${ampm}`;
  };

  const formatDateTime = (date, timeSlot) => {
    if (!date || !timeSlot) return 'N/A';
    let dateObj;
    if (date.toDate) {
      dateObj = date.toDate();
    } else {
      dateObj = new Date(date);
    }
    
    const day = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = dateObj.getDate();
    
    const parts = timeSlot.split(' - ');
    if (parts.length === 2) {
      const startTime = convertTo12Hour(parts[0].trim());
      const endTime = convertTo12Hour(parts[1].trim());
      return `${day}, ${month} ${dayNum}, ${startTime} - ${endTime}`;
    }
    return `${day}, ${month} ${dayNum}, ${timeSlot}`;
  };

  const getCourtNumber = (booking) => {
    if (booking.complexId) {
      const courtNum = (parseInt(booking.complexId.slice(-1)) || 1) % 5 + 1;
      return `Court ${courtNum}`;
    }
    return 'Court 1';
  };

  const getGuests = (booking) => {
    return booking.guests || 1;
  };

  // Preview section (shows first 3 items)
  if (isPreview) {
    return (
      <div className="mt-4 sm:mt-6 bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">My Bookings</h2>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">Court Reservations Made Easy</p>
          </div>
          <button
            onClick={onViewAll}
            className="text-primary hover:text-primary-dark font-semibold text-sm sm:text-base"
          >
            View All →
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setBookingTab('court')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition ${
              bookingTab === 'court'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Court
          </button>
          <button
            onClick={() => setBookingTab('restaurant')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition ${
              bookingTab === 'restaurant'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Restaurant
          </button>
          <button
            onClick={() => setBookingTab('equipment')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition ${
              bookingTab === 'equipment'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sport Equipment
          </button>
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading bookings...</div>
        ) : (bookingTab === 'court' ? courtBookings : bookingTab === 'restaurant' ? restaurantPurchases : equipmentPurchases).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              {bookingTab === 'court' ? 'No court bookings yet.' : bookingTab === 'restaurant' ? 'No restaurant orders yet.' : 'No equipment orders yet.'}
            </p>
            {bookingTab === 'court' ? (
              <button
                onClick={() => navigate('/browse-complexes')}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
              >
                Browse Complexes
              </button>
            ) : bookingTab === 'restaurant' ? (
              <button
                onClick={() => navigate('/restaurant')}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
              >
                Visit Restaurant
              </button>
            ) : (
              <button
                onClick={() => navigate('/equipment-shop')}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
              >
                Visit Equipment Shop
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {(bookingTab === 'court' ? courtBookings : bookingTab === 'restaurant' ? restaurantPurchases : equipmentPurchases).slice(0, 3).map((item) => {
              if (bookingTab === 'court') {
                const booking = item;
                return (
                  <div key={booking.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                    <div className="flex">
                      <div className="w-24 h-24 flex-shrink-0">
                        <img
                          src={booking.complex?.image || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400'}
                          alt={booking.complex?.name || 'Sports Complex'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400';
                          }}
                        />
                      </div>
                      <div className="flex-1 p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-800 mb-1 text-sm sm:text-base truncate">
                            {booking.complex?.name || 'Sports Complex'}
                          </h3>
                          <p className="text-xs text-gray-600 mb-1">{getCourtNumber(booking)}</p>
                          <p className="text-xs text-gray-600">
                            {booking.hours || 1} {booking.hours === 1 ? 'Hr' : 'Hrs'}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {formatDateTime(booking.date, booking.timeSlot)}
                          </p>
                        </div>
                        <div className="text-left sm:text-right w-full sm:w-auto flex items-center justify-between sm:block">
                          <p className="text-base sm:text-lg font-bold text-primary">£{getComplexPriceWithDiscount(booking).toFixed(2)}</p>
                          <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                            booking.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800' 
                              : booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {booking.status || 'pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else if (bookingTab === 'restaurant') {
                const purchase = item;
                return (
                  <div key={purchase.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                    <div className="flex flex-col sm:flex-row">
                      <div className="w-full h-32 sm:w-24 sm:h-24 flex-shrink-0 bg-primary/10 flex items-center justify-center">
                        <svg className="w-10 h-10 sm:w-12 sm:h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div className="flex-1 p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-800 mb-1 text-sm sm:text-base">Restaurant Order</h3>
                          <p className="text-xs text-gray-600">
                            {purchase.items?.length || 0} item{purchase.items?.length !== 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {purchase.createdAt?.toDate ? formatDate(purchase.createdAt) : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-primary">£{purchase.total?.toFixed(2) || '0.00'}</p>
                          <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                            purchase.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800' 
                              : purchase.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {purchase.status || 'pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                const purchase = item;
                return (
                  <div key={purchase.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                    <div className="flex flex-col sm:flex-row">
                      <div className="w-full h-32 sm:w-24 sm:h-24 flex-shrink-0 bg-primary/10 flex items-center justify-center">
                        <svg className="w-10 h-10 sm:w-12 sm:h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div className="flex-1 p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-800 mb-1 text-sm sm:text-base">Equipment Order</h3>
                          <p className="text-xs text-gray-600">
                            {purchase.items?.length || 0} item{purchase.items?.length !== 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {purchase.createdAt?.toDate ? formatDate(purchase.createdAt) : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-primary">£{purchase.total?.toFixed(2) || '0.00'}</p>
                          <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                            purchase.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800' 
                              : purchase.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {purchase.status || 'pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>
    );
  }

  // Full bookings tab content
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">My Bookings</h2>
          <p className="text-gray-600 text-xs sm:text-sm mt-1">Court Reservations Made Easy</p>
        </div>
        <button
          onClick={() => navigate('/browse-complexes')}
          className="px-4 sm:px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm sm:text-base"
        >
          Book New
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
        <button
          onClick={() => setBookingTab('court')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition ${
            bookingTab === 'court'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Court
        </button>
        <button
          onClick={() => setBookingTab('restaurant')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition ${
            bookingTab === 'restaurant'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Restaurant
        </button>
        <button
          onClick={() => setBookingTab('equipment')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition ${
            bookingTab === 'equipment'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Sport Equipment
        </button>
      </div>
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (bookingTab === 'court' ? courtBookings : bookingTab === 'restaurant' ? restaurantPurchases : equipmentPurchases).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            {bookingTab === 'court' ? 'No court bookings yet.' : bookingTab === 'restaurant' ? 'No restaurant orders yet.' : 'No equipment orders yet.'}
          </p>
          {bookingTab === 'court' ? (
            <button
              onClick={() => navigate('/browse-complexes')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
            >
              Browse Complexes
            </button>
          ) : bookingTab === 'restaurant' ? (
            <button
              onClick={() => navigate('/restaurant')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
            >
              Visit Restaurant
            </button>
          ) : (
            <button
              onClick={() => navigate('/equipment-shop')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
            >
              Visit Equipment Shop
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedBookings.map((item) => {
              if (bookingTab === 'court') {
                const booking = item;
                return (
                  <div key={booking.id} className="bg-white border border-gray-200 rounded-lg hover:shadow-lg transition relative">
                    <div className="flex flex-col sm:flex-row">
                      <div className="w-full h-40 sm:w-32 sm:h-32 flex-shrink-0 overflow-hidden rounded-tl-lg rounded-bl-lg">
                        <img
                          src={booking.complex?.image || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400'}
                          alt={booking.complex?.name || 'Sports Complex'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400';
                          }}
                        />
                      </div>
                      
                      <div className="flex-1 p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1 truncate">
                            {booking.complex?.name || 'Sports Complex'}
                          </h3>
                          
                          <p className="text-xs sm:text-sm text-gray-600 mb-2">
                            {getCourtNumber(booking)}
                          </p>
                          
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 mb-2">
                            <span className="text-xs sm:text-sm text-gray-600">
                              <span className="font-semibold">Duration:</span> {booking.hours || 1} {booking.hours === 1 ? 'Hr' : 'Hrs'}
                            </span>
                          </div>
                          
                          <p className="text-xs sm:text-sm text-gray-600">
                            {formatDateTime(booking.date, booking.timeSlot)}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
                          <div className="text-left sm:text-right">
                            <p className="text-lg sm:text-xl font-bold text-primary">
                              £{getComplexPriceWithDiscount(booking).toFixed(2)}
                            </p>
                            <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                              booking.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800' 
                                : booking.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {booking.status || 'pending'}
                            </span>
                          </div>
                          
                          <div className="relative z-50">
                            <button
                              className="p-2 hover:bg-gray-100 rounded-full transition"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === booking.id ? null : booking.id);
                              }}
                            >
                              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                              </svg>
                            </button>
                            
                            {openMenuId === booking.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-[100] py-1">
                                <button
                                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBooking(booking);
                                    setShowViewModal(true);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                  </svg>
                                  View Details
                                </button>
                                {booking.status === 'pending' && (
                                  <button
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/booking/${booking.complexId}?edit=${booking.id}`);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                    </svg>
                                    Edit Booking
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else if (bookingTab === 'restaurant') {
                const purchase = item;
                return (
                  <div key={purchase.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                    <div className="flex">
                      <div className="w-32 h-32 flex-shrink-0 bg-primary/10 flex items-center justify-center">
                        <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div className="flex-1 p-4 flex justify-between items-center">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800 mb-2">Restaurant Order</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {purchase.items?.length || 0} item{purchase.items?.length !== 1 ? 's' : ''}
                          </p>
                          {purchase.items && purchase.items.length > 0 && (
                            <div className="text-sm text-gray-600">
                              {purchase.items.slice(0, 3).map((item, idx) => (
                                <span key={idx}>
                                  {item.name} x{item.quantity}
                                  {idx < Math.min(2, purchase.items.length - 1) && ', '}
                                </span>
                              ))}
                              {purchase.items.length > 3 && ` +${purchase.items.length - 3} more`}
                            </div>
                          )}
                          <p className="text-sm text-gray-600 mt-2">
                            {purchase.createdAt?.toDate ? formatDate(purchase.createdAt) : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xl font-bold text-primary">£{purchase.total?.toFixed(2) || '0.00'}</p>
                          <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                            purchase.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800' 
                              : purchase.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {purchase.status || 'pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                const purchase = item;
                return (
                  <div key={purchase.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                    <div className="flex">
                      <div className="w-32 h-32 flex-shrink-0 bg-primary/10 flex items-center justify-center">
                        <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div className="flex-1 p-4 flex justify-between items-center">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800 mb-2">Equipment Order</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {purchase.items?.length || 0} item{purchase.items?.length !== 1 ? 's' : ''}
                          </p>
                          {purchase.items && purchase.items.length > 0 && (
                            <div className="text-sm text-gray-600">
                              {purchase.items.slice(0, 3).map((item, idx) => (
                                <span key={idx}>
                                  {item.name} x{item.quantity}
                                  {idx < Math.min(2, purchase.items.length - 1) && ', '}
                                </span>
                              ))}
                              {purchase.items.length > 3 && ` +${purchase.items.length - 3} more`}
                            </div>
                          )}
                          <p className="text-sm text-gray-600 mt-2">
                            {purchase.createdAt?.toDate ? formatDate(purchase.createdAt) : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xl font-bold text-primary">£{purchase.total?.toFixed(2) || '0.00'}</p>
                          <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                            purchase.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800' 
                              : purchase.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {purchase.status || 'pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
              <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                Showing {startIndex + 1} to {Math.min(endIndex, currentBookingData.length)} of {currentBookingData.length} bookings
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-semibold transition text-sm sm:text-base ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-semibold transition text-sm sm:text-base ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* View Modal */}
      {showViewModal && selectedBooking && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowViewModal(false);
            setSelectedBooking(null);
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-800">Booking Details</h3>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedBooking(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">Booking ID</label>
                  <p className="text-gray-800">{selectedBooking.id}</p>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">Complex</label>
                  <p className="text-gray-800">{selectedBooking.complex?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">Court</label>
                  <p className="text-gray-800">{getCourtNumber(selectedBooking)}</p>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">Date</label>
                  <p className="text-gray-800">{formatDate(selectedBooking.date)}</p>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">Time Slot</label>
                  <p className="text-gray-800">{selectedBooking.timeSlot || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">Hours</label>
                  <p className="text-gray-800">{selectedBooking.hours || 1}</p>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">Status</label>
                  <span className={`inline-block px-3 py-1 rounded text-sm ${
                    selectedBooking.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800' 
                      : selectedBooking.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedBooking.status || 'pending'}
                  </span>
                </div>
                {selectedBooking.coachRequired && selectedBooking.coach && (
                  <div>
                    <label className="block text-gray-600 text-sm font-semibold mb-1">Coach</label>
                    <p className="text-gray-800">{selectedBooking.coach.name || 'N/A'}</p>
                  </div>
                )}
                {selectedBooking.coachRequired && !selectedBooking.coach && (
                  <div>
                    <label className="block text-gray-600 text-sm font-semibold mb-1">Coach Required</label>
                    <p className="text-gray-800">Yes</p>
                  </div>
                )}
                {selectedBooking.sportEquipment && selectedBooking.sportEquipment.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="block text-gray-600 text-sm font-semibold mb-1">Sport Equipment</label>
                    <p className="text-gray-800">{selectedBooking.sportEquipment.join(', ')}</p>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-gray-600 text-sm font-semibold">Complex Price</label>
                  <p className="text-gray-800 font-semibold">£{getComplexPriceOnly(selectedBooking).toFixed(2)}</p>
                </div>
                {selectedBooking.coachRequired && selectedBooking.coach && getCoachPrice(selectedBooking) > 0 && (
                  <div className="flex justify-between items-center">
                    <label className="block text-gray-600 text-sm font-semibold">Coach Price</label>
                    <p className="text-gray-800 font-semibold">£{getCoachPrice(selectedBooking).toFixed(2)}</p>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <label className="block text-gray-600 text-sm font-semibold">Total Amount</label>
                  <p className="text-primary text-xl font-bold">£{getComplexPriceWithDiscount(selectedBooking).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedBooking(null);
                  }}
                  className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserBookings;

