import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { HiEye, HiCheckCircle, HiXCircle } from 'react-icons/hi';
import Swal from 'sweetalert2';

const AdminEquipmentPurchases = ({
  equipmentPurchases,
  complexes,
  onRefresh,
  setViewingRecord,
  setViewModalType,
  currentPage,
  setCurrentPage,
  recordsPerPage
}) => {
  const [complexFilter, setComplexFilter] = useState('all');
  const [itemFilter, setItemFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const handlePageChange = (tab, page) => {
    setCurrentPage(prev => ({ ...prev, [tab]: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateEquipmentPurchaseStatus = async (purchaseId, status) => {
    const statusText = status === 'confirmed' ? 'confirm' : 'cancel';
    const statusTitle = status === 'confirmed' ? 'Confirm Purchase' : 'Cancel Purchase';
    const statusMessage = status === 'confirmed' 
      ? 'Are you sure you want to confirm this equipment purchase?'
      : 'Are you sure you want to cancel this equipment purchase?';
    const confirmButtonText = status === 'confirmed' ? 'Yes, confirm it!' : 'Yes, cancel it!';
    const confirmButtonColor = status === 'confirmed' ? '#10b981' : '#ef4444';

    const result = await Swal.fire({
      title: statusTitle,
      text: statusMessage,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: confirmButtonColor,
      cancelButtonColor: '#6b7280',
      confirmButtonText: confirmButtonText,
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      await updateDoc(doc(db, 'equipmentPurchases', purchaseId), { status });
      onRefresh();
      Swal.fire({
        icon: 'success',
        title: status === 'confirmed' ? 'Purchase Confirmed!' : 'Purchase Cancelled!',
        text: `The equipment purchase has been ${statusText}ed successfully.`,
        confirmButtonColor: '#10b981'
      });
    } catch (error) {
      console.error('Error updating equipment purchase:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Error updating purchase status. Please try again.',
        confirmButtonColor: '#10b981'
      });
    }
  };

  // Get unique item names from all purchases
  const getUniqueItemNames = () => {
    const itemNamesSet = new Set();
    equipmentPurchases.forEach(purchase => {
      if (purchase.items && Array.isArray(purchase.items)) {
        purchase.items.forEach(item => {
          const itemName = item.name || item.itemName;
          if (itemName) {
            itemNamesSet.add(itemName);
          }
        });
      }
    });
    return Array.from(itemNamesSet).sort();
  };

  const getFilteredPurchases = () => {
    let filtered = equipmentPurchases;

    // Filter by complex
    if (complexFilter !== 'all') {
      filtered = filtered.filter(purchase => purchase.complexId === complexFilter);
    }

    // Filter by item
    if (itemFilter !== 'all') {
      filtered = filtered.filter(purchase => {
        if (!purchase.items || !Array.isArray(purchase.items)) return false;
        return purchase.items.some(item => {
          const itemName = item.name || item.itemName;
          return itemName === itemFilter;
        });
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(purchase => purchase.status === statusFilter);
    }

    // Filter by date
    if (dateFilter !== '') {
      filtered = filtered.filter(purchase => {
        if (!purchase.createdAt) return false;
        const purchaseDate = purchase.createdAt?.toDate ? purchase.createdAt.toDate() : new Date(purchase.createdAt);
        const filterDate = new Date(dateFilter);
        const purchaseDateStr = purchaseDate.toISOString().split('T')[0];
        const filterDateStr = filterDate.toISOString().split('T')[0];
        return purchaseDateStr === filterDateStr;
      });
    }

    return filtered;
  };

  const filteredPurchases = getFilteredPurchases();
  const purchasePage = currentPage['equipmentPurchases'] || 1;
  const startIndex = (purchasePage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedPurchases = filteredPurchases.slice(startIndex, endIndex);
  const totalPurchasePages = Math.ceil(filteredPurchases.length / recordsPerPage);
  const uniqueItemNames = getUniqueItemNames();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Equipment Purchases</h2>
      </div>

      {/* Filters */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Complex</label>
            <select
              value={complexFilter}
              onChange={(e) => {
                setComplexFilter(e.target.value);
                setCurrentPage(prev => ({ ...prev, equipmentPurchases: 1 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Complexes</option>
              {complexes.filter(c => c.status !== 'deleted').map(complex => (
                <option key={complex.id} value={complex.id}>{complex.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
            <select
              value={itemFilter}
              onChange={(e) => {
                setItemFilter(e.target.value);
                setCurrentPage(prev => ({ ...prev, equipmentPurchases: 1 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Items</option>
              {uniqueItemNames.map(itemName => (
                <option key={itemName} value={itemName}>{itemName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(prev => ({ ...prev, equipmentPurchases: 1 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(prev => ({ ...prev, equipmentPurchases: 1 }));
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />
              {dateFilter && (
                <button
                  onClick={() => {
                    setDateFilter('');
                    setCurrentPage(prev => ({ ...prev, equipmentPurchases: 1 }));
                  }}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                  title="Clear date filter"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Complex</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedPurchases.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">No equipment purchases found.</td>
              </tr>
            ) : (
              paginatedPurchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {purchase.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {purchase.complex?.name || (purchase.complexId ? `Complex ID: ${purchase.complexId.substring(0, 8)}...` : 'N/A')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {purchase.items?.length || 0} item{purchase.items?.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    £{purchase.total?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {purchase.createdAt?.toDate ? purchase.createdAt.toDate().toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      purchase.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : purchase.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {purchase.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setViewingRecord(purchase);
                          setViewModalType('equipmentPurchase');
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <HiEye className="w-5 h-5" />
                      </button>
                      {purchase.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateEquipmentPurchaseStatus(purchase.id, 'confirmed')}
                            className="text-green-600 hover:text-green-900"
                            title="Confirm"
                          >
                            <HiCheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => updateEquipmentPurchaseStatus(purchase.id, 'cancelled')}
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
      {totalPurchasePages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => handlePageChange('equipmentPurchases', Math.max(1, purchasePage - 1))}
            disabled={purchasePage === 1}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {purchasePage} of {totalPurchasePages}
          </span>
          <button
            onClick={() => handlePageChange('equipmentPurchases', Math.min(totalPurchasePages, purchasePage + 1))}
            disabled={purchasePage === totalPurchasePages}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminEquipmentPurchases;

