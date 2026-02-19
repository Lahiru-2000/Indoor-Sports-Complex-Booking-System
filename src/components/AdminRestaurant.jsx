import { useState, useEffect } from 'react';
import { collection, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { HiPencil, HiTrash, HiEye, HiEmojiHappy, HiFolder, HiTrendingUp } from 'react-icons/hi';
import Swal from 'sweetalert2';

const AdminRestaurant = ({
  foodItems,
  onRefresh,
  availableFoodCategories,
  onFetchFoodCategories,
  setViewingRecord,
  setViewModalType,
  currentPage,
  setCurrentPage,
  recordsPerPage
}) => {
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [newFoodCategoryName, setNewFoodCategoryName] = useState('');
  const [foodForm, setFoodForm] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    image: ''
  });

  useEffect(() => {
    if (showFoodForm) {
      onFetchFoodCategories();
    }
  }, [showFoodForm, onFetchFoodCategories]);

  const getFoodStats = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const categories = [...new Set(foodItems.map(item => item.category).filter(Boolean))];
    const thisWeekItems = foodItems.filter(item => {
      if (!item.createdAt) return false;
      const createdAt = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
      return createdAt >= oneWeekAgo;
    });
    return {
      total: foodItems.length,
      categories: categories.length,
      thisWeek: thisWeekItems.length,
      averagePrice: foodItems.length > 0
        ? (foodItems.reduce((sum, item) => sum + (item.price || 0), 0) / foodItems.length).toFixed(2)
        : '0.00'
    };
  };

  const getPaginatedData = (data) => {
    const current = currentPage['restaurant'] || 1;
    const startIndex = (current - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data) => {
    return Math.ceil(data.length / recordsPerPage);
  };

  const handlePageChange = (page) => {
    setCurrentPage(prev => ({ ...prev, restaurant: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const PaginationControls = ({ data }) => {
    const totalPages = getTotalPages(data);
    const current = currentPage['restaurant'] || 1;
    
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

  const handleFoodSubmit = async (e) => {
    e.preventDefault();
    try {
      const foodData = {
        name: foodForm.name,
        category: foodForm.category,
        price: parseFloat(foodForm.price) || 0,
        description: foodForm.description || '',
        image: foodForm.image || ''
      };

      if (editingFood) {
        await updateDoc(doc(db, 'foodItems', editingFood.id), foodData);
      } else {
        await addDoc(collection(db, 'foodItems'), {
          ...foodData,
          createdAt: serverTimestamp()
        });
      }

      setShowFoodForm(false);
      setEditingFood(null);
      setFoodForm({ name: '', category: '', price: '', description: '', image: '' });
      onRefresh();
    } catch (error) {
      console.error('Error saving food item:', error);
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'Error saving food item. Please try again.',
        confirmButtonColor: '#10b981'
      });
    }
  };

  const handleEditFood = (item) => {
    setEditingFood(item);
    setFoodForm({
      name: item.name || '',
      category: item.category || '',
      price: item.price?.toString() || '',
      description: item.description || '',
      image: item.image || ''
    });
    setShowFoodForm(true);
  };

  const handleDeleteFood = async (itemId) => {
    const result = await Swal.fire({
      title: 'Delete Food Item',
      text: 'Are you sure you want to delete this food item?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;
    try {
      await updateDoc(doc(db, 'foodItems', itemId), { status: 'deleted', deletedAt: serverTimestamp() });
      onRefresh();
    } catch (error) {
      console.error('Error deleting food item:', error);
    }
  };

  const handleAddFoodCategory = async () => {
    if (!newFoodCategoryName.trim()) return;
    const categoryName = newFoodCategoryName.trim().toLowerCase();
    if (availableFoodCategories.some(c => c.toLowerCase() === categoryName)) {
      Swal.fire({
        icon: 'warning',
        title: 'Category Exists',
        text: 'This category already exists',
        confirmButtonColor: '#10b981'
      });
      return;
    }
    try {
      await addDoc(collection(db, 'foodCategories'), { name: categoryName, createdAt: serverTimestamp() });
      onFetchFoodCategories();
      setNewFoodCategoryName('');
    } catch (error) {
      console.error('Error adding food category:', error);
      Swal.fire({
        icon: 'error',
        title: 'Add Failed',
        text: 'Error adding category. Please try again.',
        confirmButtonColor: '#10b981'
      });
    }
  };

  const paginatedFood = getPaginatedData(foodItems);
  const foodStats = getFoodStats();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Restaurant</h2>
        <button
          onClick={() => {
            setEditingFood(null);
            setFoodForm({ name: '', category: '', price: '', description: '', image: '' });
            setShowFoodForm(true);
          }}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
        >
          Add Food Item
        </button>
      </div>

      {/* Food Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{foodStats.total}</p>
            </div>
            <HiEmojiHappy className="w-12 h-12 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{foodStats.categories}</p>
              <p className="text-xs text-gray-500 mt-1">Food, Drinks, etc.</p>
            </div>
            <HiFolder className="w-12 h-12 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{foodStats.thisWeek}</p>
              <p className="text-xs text-gray-500 mt-1">New items added</p>
            </div>
            <HiTrendingUp className="w-12 h-12 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Price</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">£{foodStats.averagePrice}</p>
            </div>
            <HiTrendingUp className="w-12 h-12 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedFood.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No food items found.</td>
              </tr>
            ) : (
              paginatedFood.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{item.category || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">£{item.price?.toFixed(2) || '0.00'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setViewingRecord(item);
                          setViewModalType('food');
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <HiEye className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleEditFood(item)} className="text-green-600 hover:text-green-900" title="Edit">
                        <HiPencil className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDeleteFood(item.id)} className="text-red-600 hover:text-red-900" title="Delete">
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
      <PaginationControls data={foodItems} />

      {/* Food Form Modal */}
      {showFoodForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-800">{editingFood ? 'Edit Food Item' : 'Add Food Item'}</h3>
              <button
                onClick={() => {
                  setShowFoodForm(false);
                  setEditingFood(null);
                  setFoodForm({ name: '', category: '', price: '', description: '', image: '' });
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleFoodSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={foodForm.name}
                  onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Category *</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFoodCategoryName}
                      onChange={(e) => setNewFoodCategoryName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFoodCategory();
                        }
                      }}
                      placeholder="Add new category..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddFoodCategory}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm font-semibold"
                    >
                      Add
                    </button>
                  </div>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                    {availableFoodCategories.length === 0 ? (
                      <p className="text-gray-500 text-sm">No categories available. Add one above.</p>
                    ) : (
                      <div className="space-y-2">
                        {availableFoodCategories.map((category) => (
                          <label key={category} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="radio"
                              name="foodCategory"
                              required
                              checked={foodForm.category?.toLowerCase() === category.toLowerCase()}
                              onChange={() => setFoodForm({ ...foodForm, category: category })}
                              className="mr-3 w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                            />
                            <span className="text-gray-700 capitalize">{category}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Price *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={foodForm.price}
                  onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Description</label>
                <textarea
                  value={foodForm.description}
                  onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Image URL</label>
                <input
                  type="url"
                  value={foodForm.image}
                  onChange={(e) => setFoodForm({ ...foodForm, image: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowFoodForm(false);
                    setEditingFood(null);
                    setFoodForm({ name: '', category: '', price: '', description: '', image: '' });
                  }}
                  className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold"
                >
                  {editingFood ? 'Update Food Item' : 'Add Food Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRestaurant;

