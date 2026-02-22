import { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { HiTrash, HiEye, HiUsers, HiCheck, HiX, HiTrendingUp } from 'react-icons/hi';
import Swal from 'sweetalert2';

const AdminUsers = ({
  users,
  bookings,
  onRefresh,
  setViewingRecord,
  setViewModalType,
  currentPage,
  setCurrentPage,
  recordsPerPage
}) => {
  const [packageFilter, setPackageFilter] = useState('all');
  const [dateSort, setDateSort] = useState('none');
  const [bookingsSort, setBookingsSort] = useState('none');
  const getUserStats = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thisWeekUsers = users.filter(user => {
      if (!user.createdAt) return false;
      const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
      return createdAt >= oneWeekAgo;
    });
    const activeUsers = users.filter(user => {
      if (!user.createdAt) return false;
      const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
      return createdAt >= thirtyDaysAgo;
    });
    return {
      total: users.length,
      active: activeUsers.length,
      inactive: users.length - activeUsers.length,
      thisWeek: thisWeekUsers.length
    };
  };

  const getPaginatedData = (data) => {
    const current = currentPage['users'] || 1;
    const startIndex = (current - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data) => {
    return Math.ceil(data.length / recordsPerPage);
  };

  const handlePageChange = (page) => {
    setCurrentPage(prev => ({ ...prev, users: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const PaginationControls = ({ data }) => {
    const totalPages = getTotalPages(data);
    const current = currentPage['users'] || 1;
    
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

  const handleDeleteUser = async (userId) => {
    const result = await Swal.fire({
      title: 'Delete User',
      text: 'Are you sure you want to delete this user?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;
    try {
      await updateDoc(doc(db, 'users', userId), { status: 'deleted', deletedAt: serverTimestamp() });
      onRefresh();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Count bookings per user
  const getUserBookingCount = (userId) => {
    if (!bookings || !Array.isArray(bookings)) return 0;
    return bookings.filter(booking => booking.userId === userId && booking.status !== 'cancelled').length;
  };

  const getFilteredAndSortedUsers = () => {
    let filtered = users.map(user => ({
      ...user,
      bookingCount: getUserBookingCount(user.id)
    }));

    // Filter by package
    if (packageFilter !== 'all') {
      filtered = filtered.filter(user => {
        const userPackage = user.package || 'basic';
        if (packageFilter === 'basic') {
          return !userPackage || userPackage === 'basic' || userPackage === 'normal';
        }
        if (packageFilter === 'silver') {
          return userPackage === 'silver' || userPackage === 'package2';
        }
        if (packageFilter === 'gold') {
          return userPackage === 'gold' || userPackage === 'package3';
        }
        return userPackage === packageFilter;
      });
    }

    // Sort by date
    if (dateSort === 'firstToLast') {
      filtered = [...filtered].sort((a, b) => {
        const aTime = a.createdAt?.toDate?.()?.getTime() || a.createdAt || 0;
        const bTime = b.createdAt?.toDate?.()?.getTime() || b.createdAt || 0;
        return aTime - bTime;
      });
    } else if (dateSort === 'lastToFirst') {
      filtered = [...filtered].sort((a, b) => {
        const aTime = a.createdAt?.toDate?.()?.getTime() || a.createdAt || 0;
        const bTime = b.createdAt?.toDate?.()?.getTime() || b.createdAt || 0;
        return bTime - aTime;
      });
    }

    // Sort by bookings count
    if (bookingsSort === 'mostBookings') {
      filtered = [...filtered].sort((a, b) => b.bookingCount - a.bookingCount);
    } else if (bookingsSort === 'lowestBookings') {
      filtered = [...filtered].sort((a, b) => a.bookingCount - b.bookingCount);
    }

    return filtered;
  };

  const filteredUsers = getFilteredAndSortedUsers();
  const paginatedUsers = getPaginatedData(filteredUsers);
  const userStats = getUserStats();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">All Users</h2>
      </div>
      
      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{userStats.total}</p>
            </div>
            <HiUsers className="w-12 h-12 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{userStats.active}</p>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </div>
            <HiCheck className="w-12 h-12 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{userStats.inactive}</p>
            </div>
            <HiX className="w-12 h-12 text-gray-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{userStats.thisWeek}</p>
              <p className="text-xs text-gray-500 mt-1">New users</p>
            </div>
            <HiTrendingUp className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Package</label>
            <select
              value={packageFilter}
              onChange={(e) => {
                setPackageFilter(e.target.value);
                setCurrentPage(prev => ({ ...prev, users: 1 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Packages</option>
              <option value="basic">Basic</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
            <select
              value={dateSort}
              onChange={(e) => {
                setDateSort(e.target.value);
                setCurrentPage(prev => ({ ...prev, users: 1 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="none">No Sort</option>
              <option value="firstToLast">First to Last</option>
              <option value="lastToFirst">Last to First</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bookings</label>
            <select
              value={bookingsSort}
              onChange={(e) => {
                setBookingsSort(e.target.value);
                setCurrentPage(prev => ({ ...prev, users: 1 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="none">No Sort</option>
              <option value="mostBookings">Most Bookings</option>
              <option value="lowestBookings">Lowest Bookings</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No users found.</td>
              </tr>
            ) : (
              paginatedUsers.map((u) => {
                const userPackage = u.package || 'basic';
                const getPackageDisplayName = (pkg) => {
                  if (!pkg || pkg === 'basic' || pkg === 'normal') return 'Basic';
                  if (pkg === 'silver' || pkg === 'package2') return 'Silver';
                  if (pkg === 'gold' || pkg === 'package3') return 'Gold';
                  return pkg.charAt(0).toUpperCase() + pkg.slice(1);
                };
                const getPackageColor = (pkg) => {
                  if (!pkg || pkg === 'basic' || pkg === 'normal') return 'bg-gray-100 text-gray-800';
                  if (pkg === 'silver' || pkg === 'package2') return 'bg-gray-200 text-gray-700';
                  if (pkg === 'gold' || pkg === 'package3') return 'bg-yellow-100 text-yellow-800';
                  return 'bg-blue-100 text-blue-800';
                };
                return (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name || 'No name'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPackageColor(userPackage)}`}>
                        {getPackageDisplayName(userPackage)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setViewingRecord(u);
                          setViewModalType('user');
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <HiEye className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:text-red-900" title="Delete">
                        <HiTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls data={filteredUsers} />
    </div>
  );
};

export default AdminUsers;

