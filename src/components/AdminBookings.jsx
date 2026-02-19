import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { HiEye, HiCheckCircle, HiXCircle, HiClipboard, HiClock, HiCheck, HiX, HiTrendingUp } from 'react-icons/hi';

const AdminBookings = ({
  bookings,
  onRefresh,
  setViewingRecord,
  setViewModalType,
  currentPage,
  setCurrentPage,
  recordsPerPage
}) => {
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingDateRangeStart, setBookingDateRangeStart] = useState('');
  const [bookingDateRangeEnd, setBookingDateRangeEnd] = useState('');
  const [bookingSportFilter, setBookingSportFilter] = useState('all');

  const getBookingStats = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekBookings = bookings.filter(booking => {
      if (!booking.createdAt) return false;
      const createdAt = booking.createdAt?.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt);
      return createdAt >= oneWeekAgo;
    });
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      thisWeek: thisWeekBookings.length
    };
  };

  const getFilteredBookings = () => {
    let filtered = bookings;
    if (bookingStatusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === bookingStatusFilter);
    }
    if (bookingDateRangeStart || bookingDateRangeEnd) {
      filtered = filtered.filter(booking => {
        if (!booking.date) return false;
        const bookingDate = typeof booking.date === 'string' ? new Date(booking.date) : (booking.date?.toDate ? booking.date.toDate() : new Date(booking.date));
        const startDate = bookingDateRangeStart ? new Date(bookingDateRangeStart) : new Date(0);
        const endDate = bookingDateRangeEnd ? new Date(bookingDateRangeEnd + 'T23:59:59') : new Date();
        return bookingDate >= startDate && bookingDate <= endDate;
      });
    }
    if (bookingSportFilter !== 'all') {
      filtered = filtered.filter(booking => booking.sport === bookingSportFilter);
    }
    return filtered;
  };

  const getPaginatedData = (data) => {
    const current = currentPage['bookings'] || 1;
    const startIndex = (current - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data) => {
    return Math.ceil(data.length / recordsPerPage);
  };

  const handlePageChange = (page) => {
    setCurrentPage(prev => ({ ...prev, bookings: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const PaginationControls = ({ data }) => {
    const totalPages = getTotalPages(data);
    const current = currentPage['bookings'] || 1;
    
    if (totalPages <= 1) return null;

    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, current - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white border-t border-gray-200">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(current - 1)}
            disabled={current === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(current + 1)}
            disabled={current === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(current - 1) * recordsPerPage + 1}</span> to{' '}
              <span className="font-medium">{Math.min(current * recordsPerPage, data.length)}</span> of{' '}
              <span className="font-medium">{data.length}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(current - 1)}
                disabled={current === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              {pages.map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    current === page
                      ? 'z-10 bg-primary border-primary text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(current + 1)}
                disabled={current === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10l-3.293-3.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status });
      onRefresh();
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const filteredBookings = getFilteredBookings();
  const paginatedBookings = getPaginatedData(filteredBookings);
  const bookingStats = getBookingStats();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">All Bookings</h2>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{bookingStats.total}</p>
            </div>
            <HiClipboard className="w-12 h-12 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{bookingStats.pending}</p>
            </div>
            <HiClock className="w-12 h-12 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{bookingStats.confirmed}</p>
            </div>
            <HiCheck className="w-12 h-12 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{bookingStats.cancelled}</p>
            </div>
            <HiX className="w-12 h-12 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{bookingStats.thisWeek}</p>
              <p className="text-xs text-gray-500 mt-1">New bookings</p>
            </div>
            <HiTrendingUp className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Booking Filters */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={bookingStatusFilter}
              onChange={(e) => {
                setBookingStatusFilter(e.target.value);
                setCurrentPage(prev => ({ ...prev, bookings: 1 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={bookingDateRangeStart}
              onChange={(e) => {
                setBookingDateRangeStart(e.target.value);
                setCurrentPage(prev => ({ ...prev, bookings: 1 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={bookingDateRangeEnd}
              onChange={(e) => {
                setBookingDateRangeEnd(e.target.value);
                setCurrentPage(prev => ({ ...prev, bookings: 1 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
            <select
              value={bookingSportFilter}
              onChange={(e) => {
                setBookingSportFilter(e.target.value);
                setCurrentPage(prev => ({ ...prev, bookings: 1 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Sports</option>
              {[...new Set(bookings.map(b => b.sport).filter(Boolean))].map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sport</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedBookings.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">No bookings found.</td>
              </tr>
            ) : (
              paginatedBookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {booking.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.sport || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.date?.toDate ? booking.date.toDate().toLocaleDateString() : booking.date || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.timeSlot || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">£{booking.total?.toFixed(2) || '0.00'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      booking.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : booking.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {booking.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setViewingRecord(booking);
                          setViewModalType('booking');
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <HiEye className="w-5 h-5" />
                      </button>
                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                            className="text-green-600 hover:text-green-900"
                            title="Confirm"
                          >
                            <HiCheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel"
                          >
                            <HiXCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls data={filteredBookings} />
    </div>
  );
};

export default AdminBookings;

