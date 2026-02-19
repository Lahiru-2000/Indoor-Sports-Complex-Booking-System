import { useState, useEffect } from 'react';
import { collection, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { HiPencil, HiTrash, HiEye } from 'react-icons/hi';
import Swal from 'sweetalert2';

const AdminCoaches = ({
  coaches,
  complexes,
  onRefresh,
  availableSports,
  onFetchSports,
  setViewingRecord,
  setViewModalType,
  currentPage,
  setCurrentPage,
  recordsPerPage
}) => {
  const [showCoachForm, setShowCoachForm] = useState(false);
  const [editingCoach, setEditingCoach] = useState(null);
  const [coachForm, setCoachForm] = useState({
    name: '',
    price: '',
    complexId: '',
    speciality: '',
    bio: '',
    image: '',
    experience: '',
    sports: []
  });

  // Fetch sports when coach form opens (if not already loaded)
  useEffect(() => {
    if (showCoachForm) {
      onFetchSports();
    }
  }, [showCoachForm, onFetchSports]);

  const getPaginatedData = (data) => {
    const current = currentPage['coaches'] || 1;
    const startIndex = (current - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data) => {
    return Math.ceil(data.length / recordsPerPage);
  };

  const handlePageChange = (page) => {
    setCurrentPage(prev => ({ ...prev, coaches: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const PaginationControls = ({ data }) => {
    const totalPages = getTotalPages(data);
    const current = currentPage['coaches'] || 1;
    
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

  const handleCoachSubmit = async (e) => {
    e.preventDefault();
    try {
      const coachData = {
        name: coachForm.name,
        price: parseFloat(coachForm.price) || 0,
        complexId: coachForm.complexId,
        speciality: coachForm.speciality || '',
        bio: coachForm.bio || '',
        image: coachForm.image || '',
        experience: coachForm.experience || '',
        sports: coachForm.sports || []
      };

      if (editingCoach) {
        await updateDoc(doc(db, 'coaches', editingCoach.id), coachData);
      } else {
        await addDoc(collection(db, 'coaches'), {
          ...coachData,
          createdAt: serverTimestamp()
        });
      }

      setShowCoachForm(false);
      setEditingCoach(null);
      setCoachForm({ name: '', price: '', complexId: '', speciality: '', bio: '', image: '', experience: '', sports: [] });
      onRefresh();
    } catch (error) {
      console.error('Error saving coach:', error);
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'Error saving coach. Please try again.',
        confirmButtonColor: '#10b981'
      });
    }
  };

  const handleEditCoach = (coach) => {
    setEditingCoach(coach);
    setCoachForm({
      name: coach.name || '',
      price: coach.price?.toString() || '',
      complexId: coach.complexId || '',
      speciality: coach.speciality || '',
      bio: coach.bio || '',
      image: coach.image || '',
      experience: coach.experience || '',
      sports: coach.sports || []
    });
    setShowCoachForm(true);
  };

  const handleDeleteCoach = async (coachId) => {
    const result = await Swal.fire({
      title: 'Delete Coach',
      text: 'Are you sure you want to delete this coach?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;
    try {
      await updateDoc(doc(db, 'coaches', coachId), { status: 'deleted', deletedAt: serverTimestamp() });
      onRefresh();
    } catch (error) {
      console.error('Error deleting coach:', error);
    }
  };

  const handleCoachSportToggle = (sport) => {
    const currentSports = coachForm.sports || [];
    if (currentSports.some(s => s.toLowerCase() === sport.toLowerCase())) {
      setCoachForm({
        ...coachForm,
        sports: currentSports.filter(s => s.toLowerCase() !== sport.toLowerCase())
      });
    } else {
      setCoachForm({
        ...coachForm,
        sports: [...currentSports, sport]
      });
    }
  };

  const paginatedCoaches = getPaginatedData(coaches);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Coaches</h2>
        <button
          onClick={() => {
            setEditingCoach(null);
            setCoachForm({ name: '', price: '', complexId: '', speciality: '', bio: '', image: '', experience: '', sports: [] });
            setShowCoachForm(true);
          }}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
        >
          Add Coach
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Speciality</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedCoaches.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No coaches found.</td>
              </tr>
            ) : (
              paginatedCoaches.map((coach) => (
                <tr key={coach.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{coach.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{coach.speciality || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">£{coach.price?.toFixed(2) || '0.00'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setViewingRecord(coach);
                          setViewModalType('coach');
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <HiEye className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleEditCoach(coach)} className="text-green-600 hover:text-green-900" title="Edit">
                        <HiPencil className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDeleteCoach(coach.id)} className="text-red-600 hover:text-red-900" title="Delete">
                        <HiTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls data={coaches} />

      {/* Coach Form Modal */}
      {showCoachForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-800">{editingCoach ? 'Edit Coach' : 'Add Coach'}</h3>
              <button
                onClick={() => {
                  setShowCoachForm(false);
                  setEditingCoach(null);
                  setCoachForm({ name: '', price: '', complexId: '', speciality: '', bio: '', image: '', experience: '', sports: [] });
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCoachSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={coachForm.name}
                  onChange={(e) => setCoachForm({ ...coachForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Price *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={coachForm.price}
                    onChange={(e) => setCoachForm({ ...coachForm, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Complex</label>
                  <select
                    value={coachForm.complexId}
                    onChange={(e) => setCoachForm({ ...coachForm, complexId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select a complex</option>
                    {complexes.filter(c => c.status !== 'deleted').map((complex) => (
                      <option key={complex.id} value={complex.id}>
                        {complex.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Sports *</label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {availableSports.length === 0 ? (
                    <p className="text-gray-500 text-sm">Loading sports...</p>
                  ) : (
                    <div className="space-y-2">
                      {availableSports.map((sport) => (
                        <label key={sport} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={coachForm.sports?.some(s => s.toLowerCase() === sport.toLowerCase()) || false}
                            onChange={() => handleCoachSportToggle(sport)}
                            className="mr-3 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                          />
                          <span className="text-gray-700 capitalize">{sport}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {coachForm.sports && coachForm.sports.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {coachForm.sports.join(', ')}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Speciality</label>
                <input
                  type="text"
                  value={coachForm.speciality}
                  onChange={(e) => setCoachForm({ ...coachForm, speciality: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Professional training, Youth development"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Experience</label>
                <input
                  type="text"
                  value={coachForm.experience}
                  onChange={(e) => setCoachForm({ ...coachForm, experience: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="e.g., 5 years, Professional player"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Bio</label>
                <textarea
                  value={coachForm.bio}
                  onChange={(e) => setCoachForm({ ...coachForm, bio: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  rows="4"
                  placeholder="Tell us about the coach..."
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Image URL</label>
                <input
                  type="url"
                  value={coachForm.image}
                  onChange={(e) => setCoachForm({ ...coachForm, image: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCoachForm(false);
                    setEditingCoach(null);
                    setCoachForm({ name: '', price: '', complexId: '', speciality: '', bio: '', image: '', experience: '', sports: [] });
                  }}
                  className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold"
                >
                  {editingCoach ? 'Update Coach' : 'Add Coach'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoaches;

