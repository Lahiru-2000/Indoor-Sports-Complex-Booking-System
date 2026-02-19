import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { HiEye, HiCheckCircle, HiXCircle } from 'react-icons/hi';
import Swal from 'sweetalert2';

const AdminEquipmentPurchases = ({
  equipmentPurchases,
  onRefresh,
  setViewingRecord,
  setViewModalType,
  currentPage,
  setCurrentPage,
  recordsPerPage
}) => {
  const handlePageChange = (tab, page) => {
    setCurrentPage(prev => ({ ...prev, [tab]: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateEquipmentPurchaseStatus = async (purchaseId, status) => {
    try {
      await updateDoc(doc(db, 'equipmentPurchases', purchaseId), { status });
      onRefresh();
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

  const purchasePage = currentPage['equipmentPurchases'] || 1;
  const startIndex = (purchasePage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedPurchases = equipmentPurchases.slice(startIndex, endIndex);
  const totalPurchasePages = Math.ceil(equipmentPurchases.length / recordsPerPage);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Equipment Purchases</h2>
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

