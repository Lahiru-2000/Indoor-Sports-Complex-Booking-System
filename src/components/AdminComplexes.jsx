import { useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { HiPencil, HiTrash, HiEye, HiCheckCircle, HiXCircle } from 'react-icons/hi';
import Swal from 'sweetalert2';

const AdminComplexes = ({
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
  const [showComplexForm, setShowComplexForm] = useState(false);
  const [editingComplex, setEditingComplex] = useState(null);
  const [newSportName, setNewSportName] = useState('');
  const [complexForm, setComplexForm] = useState({
    name: '',
    description: '',
    pricePerHour: '',
    image: '',
    location: '',
    sports: [],
    featuresText: ''
  });
  const [sportFilter, setSportFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const getPaginatedData = (data) => {
    const current = currentPage['complexes'] || 1;
    const startIndex = (current - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data) => {
    return Math.ceil(data.length / recordsPerPage);
  };

  const handlePageChange = (page) => {
    setCurrentPage(prev => ({ ...prev, complexes: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const PaginationControls = ({ data }) => {
    const totalPages = getTotalPages(data);
    const current = currentPage['complexes'] || 1;
    
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

  const handleComplexSubmit = async (e) => {
    e.preventDefault();
    try {
      const features = complexForm.featuresText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      const complexData = {
        name: complexForm.name,
        description: complexForm.description,
        pricePerHour: parseFloat(complexForm.pricePerHour) || 0,
        image: complexForm.image,
        location: complexForm.location,
        sports: complexForm.sports || [],
        features: features,
        enabled: complexForm.enabled !== undefined ? complexForm.enabled : true
      };

      if (editingComplex) {
        await updateDoc(doc(db, 'complexes', editingComplex.id), complexData);
      } else {
        await addDoc(collection(db, 'complexes'), {
          ...complexData,
          enabled: true,
          createdAt: serverTimestamp()
        });
      }

      setShowComplexForm(false);
      setEditingComplex(null);
      setComplexForm({ name: '', description: '', pricePerHour: '', image: '', location: '', sports: [], featuresText: '', enabled: true });
      onRefresh();
    } catch (error) {
      console.error('Error saving complex:', error);
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'Error saving complex. Please try again.',
        confirmButtonColor: '#10b981'
      });
    }
  };

  const handleEditComplex = (complex) => {
    setEditingComplex(complex);
    setComplexForm({
      name: complex.name || '',
      description: complex.description || '',
      pricePerHour: complex.pricePerHour?.toString() || '',
      image: complex.image || '',
      location: complex.location || '',
      sports: complex.sports || [],
      featuresText: Array.isArray(complex.features) ? complex.features.join('\n') : '',
      enabled: complex.enabled !== undefined ? complex.enabled : true
    });
    setShowComplexForm(true);
  };

  const handleDeleteComplex = async (complexId) => {
    const result = await Swal.fire({
      title: 'Delete Complex',
      text: 'Are you sure you want to delete this complex?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;
    try {
      await updateDoc(doc(db, 'complexes', complexId), { status: 'deleted', deletedAt: serverTimestamp() });
      onRefresh();
    } catch (error) {
      console.error('Error deleting complex:', error);
    }
  };

  const handleToggleEnabled = async (complex) => {
    try {
      const newEnabledStatus = !(complex.enabled !== false); // Default to true if undefined
      await updateDoc(doc(db, 'complexes', complex.id), { enabled: newEnabledStatus });
      onRefresh();
    } catch (error) {
      console.error('Error toggling complex enabled status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Error updating complex status. Please try again.',
        confirmButtonColor: '#10b981'
      });
    }
  };

  const getFilteredComplexes = () => {
    let filtered = complexes;

    // Filter by sport
    if (sportFilter !== 'all') {
      filtered = filtered.filter(complex => {
        const complexSports = complex.sports || [];
        return complexSports.some(s => s.toLowerCase() === sportFilter.toLowerCase());
      });
    }

    // Filter by status (enabled/disabled)
    if (statusFilter !== 'all') {
      if (statusFilter === 'enabled') {
        filtered = filtered.filter(complex => complex.enabled !== false);
      } else if (statusFilter === 'disabled') {
        filtered = filtered.filter(complex => complex.enabled === false);
      }
    }

    return filtered;
  };

  // Get unique sports from complexes as fallback if availableSports is empty
  const getAvailableSports = () => {
    if (availableSports && availableSports.length > 0) {
      return availableSports;
    }
    // Fallback: extract unique sports from complexes
    const sportsSet = new Set();
    complexes.forEach(complex => {
      if (complex.sports && Array.isArray(complex.sports)) {
        complex.sports.forEach(sport => sportsSet.add(sport));
      }
    });
    return Array.from(sportsSet).sort();
  };

  const sportsForFilter = getAvailableSports();
  const filteredComplexes = getFilteredComplexes();
  const paginatedComplexes = getPaginatedData(filteredComplexes);

  const handleAddSport = async () => {
    if (!newSportName.trim()) return;
    const sportName = newSportName.trim().toLowerCase();
    if (availableSports.some(s => s.toLowerCase() === sportName)) {
      Swal.fire({
        icon: 'warning',
        title: 'Sport Exists',
        text: 'This sport already exists',
        confirmButtonColor: '#10b981'
      });
      return;
    }
    try {
      await addDoc(collection(db, 'sports'), { name: sportName, createdAt: serverTimestamp() });
      onFetchSports();
      setNewSportName('');
    } catch (error) {
      console.error('Error adding sport:', error);
      Swal.fire({
        icon: 'error',
        title: 'Add Failed',
        text: 'Error adding sport. Please try again.',
        confirmButtonColor: '#10b981'
      });
    }
  };

  const handleSportToggle = (sport) => {
    const currentSports = complexForm.sports || [];
    if (currentSports.some(s => s.toLowerCase() === sport.toLowerCase())) {
      setComplexForm(prev => ({
        ...prev,
        sports: currentSports.filter(s => s.toLowerCase() !== sport.toLowerCase())
      }));
    } else {
      setComplexForm(prev => ({
        ...prev,
        sports: [...currentSports, sport]
      }));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Sports Complexes</h2>
        <button
          onClick={() => {
            setEditingComplex(null);
            setComplexForm({ name: '', description: '', pricePerHour: '', image: '', location: '', sports: [], featuresText: '', enabled: true });
            setShowComplexForm(true);
          }}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
        >
          Add Complex
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
            <select
              value={sportFilter}
              onChange={(e) => {
                setSportFilter(e.target.value);
                setCurrentPage(prev => ({ ...prev, complexes: 1 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Sports</option>
              {sportsForFilter.map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(prev => ({ ...prev, complexes: 1 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price/Hour</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sports</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedComplexes.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No complexes found.</td>
              </tr>
            ) : (
              paginatedComplexes.map((complex) => (
                <tr key={complex.id} className={complex.enabled === false ? 'opacity-60 bg-gray-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {complex.name}
                    {complex.enabled === false && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-gray-200 text-gray-600">Disabled</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{complex.location || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">£{complex.pricePerHour?.toFixed(2) || '0.00'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {Array.isArray(complex.sports) ? complex.sports.join(', ') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setViewingRecord(complex);
                          setViewModalType('complex');
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <HiEye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEditComplex(complex)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit"
                      >
                        <HiPencil className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleToggleEnabled(complex)} 
                        className={complex.enabled !== false ? "text-yellow-600 hover:text-yellow-900" : "text-gray-400 hover:text-gray-600"} 
                        title={complex.enabled !== false ? "Disable" : "Enable"}
                      >
                        {complex.enabled !== false ? <HiXCircle className="w-5 h-5" /> : <HiCheckCircle className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleDeleteComplex(complex.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
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
      <PaginationControls data={filteredComplexes} />

      {/* Complex Form Modal */}
      {showComplexForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-800">{editingComplex ? 'Edit Complex' : 'Add Complex'}</h3>
              <button
                onClick={() => {
                  setShowComplexForm(false);
                  setEditingComplex(null);
                  setComplexForm({ name: '', description: '', pricePerHour: '', image: '', location: '', sports: [], featuresText: '' });
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleComplexSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={complexForm.name}
                  onChange={(e) => setComplexForm({ ...complexForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Description</label>
                <textarea
                  value={complexForm.description}
                  onChange={(e) => setComplexForm({ ...complexForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  rows="3"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Price Per Hour *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={complexForm.pricePerHour}
                    onChange={(e) => setComplexForm({ ...complexForm, pricePerHour: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Location</label>
                  <input
                    type="text"
                    value={complexForm.location}
                    onChange={(e) => setComplexForm({ ...complexForm, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Image URL</label>
                <input
                  type="url"
                  value={complexForm.image}
                  onChange={(e) => setComplexForm({ ...complexForm, image: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Sports *</label>
                <div className="mb-3 flex gap-2">
                  <input
                    type="text"
                    value={newSportName}
                    onChange={(e) => setNewSportName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSport();
                      }
                    }}
                    placeholder="Add new sport..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddSport}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm font-semibold"
                  >
                    Add Sport
                  </button>
                </div>
                <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {availableSports.length === 0 ? (
                    <p className="text-gray-500 text-sm">Loading sports...</p>
                  ) : (
                    <div className="space-y-2">
                      {availableSports.map((sport) => (
                        <label key={sport} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={complexForm.sports?.some(s => s.toLowerCase() === sport.toLowerCase()) || false}
                            onChange={() => handleSportToggle(sport)}
                            className="mr-3 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                          />
                          <span className="text-gray-700 capitalize">{sport}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Features/Amenities (one per line)</label>
                <textarea
                  value={complexForm.featuresText}
                  onChange={(e) => setComplexForm({ ...complexForm, featuresText: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  rows="4"
                  placeholder="Enter features, one per line..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowComplexForm(false);
                    setEditingComplex(null);
                    setComplexForm({ name: '', description: '', pricePerHour: '', image: '', location: '', sports: [], featuresText: '' });
                  }}
                  className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold"
                >
                  {editingComplex ? 'Update Complex' : 'Add Complex'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComplexes;

