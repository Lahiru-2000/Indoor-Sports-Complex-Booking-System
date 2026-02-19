import { useState } from 'react';

const UserInvoices = ({
  bookings,
  restaurantPurchases,
  equipmentPurchases,
  packagePurchases,
  loading,
  userProfileData,
  getComplexPriceWithDiscount
}) => {
  const [invoicePage, setInvoicePage] = useState(1);
  const invoicesPerPage = 10;

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

  const formatTime = (timeSlot) => {
    if (!timeSlot) return 'N/A';
    const parts = timeSlot.split(' - ');
    if (parts.length === 2) {
      return `${convertTo12Hour(parts[0].trim())} - ${convertTo12Hour(parts[1].trim())}`;
    }
    return timeSlot;
  };

  // Combine all payment types into unified invoice list
  const allInvoices = [
    // For bookings, use updatedAt if exists, otherwise createdAt
    ...bookings.map(b => ({ 
      ...b, 
      type: 'booking', 
      invoiceDate: b.updatedAt || b.createdAt || b.date,
      originalDate: b.createdAt || b.date,
      updatedDate: b.updatedAt || null
    })),
    ...restaurantPurchases.map(p => ({ ...p, type: 'restaurant', invoiceDate: p.createdAt })),
    ...equipmentPurchases.map(p => ({ ...p, type: 'equipment', invoiceDate: p.createdAt })),
    ...packagePurchases.map(p => ({ ...p, type: 'package', invoiceDate: p.createdAt }))
  ].sort((a, b) => {
    const aTime = a.invoiceDate?.toDate?.()?.getTime() || a.invoiceDate || 0;
    const bTime = b.invoiceDate?.toDate?.()?.getTime() || b.invoiceDate || 0;
    return bTime - aTime; // Newest first
  });

  const totalInvoices = allInvoices.length;
  const totalInvoicePages = Math.ceil(totalInvoices / invoicesPerPage);
  const startIndex = (invoicePage - 1) * invoicesPerPage;
  const endIndex = startIndex + invoicesPerPage;
  const paginatedInvoices = allInvoices.slice(startIndex, endIndex);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Invoices</h2>
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading invoices...</div>
      ) : totalInvoices === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No invoices available.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {paginatedInvoices.map((invoice) => {
              if (invoice.type === 'booking') {
                return (
                  <div key={invoice.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3 sm:gap-0 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
                          Invoice #{invoice.id.slice(0, 8).toUpperCase()}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">Type: Court Booking</p>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto">
                        <p className="text-xl sm:text-2xl font-bold text-primary mb-2">£{getComplexPriceWithDiscount(invoice).toFixed(2)}</p>
                        <span className={`inline-block px-3 py-1 rounded text-sm ${
                          invoice.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : invoice.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {invoice.status || 'pending'}
                        </span>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Complex</p>
                        <p className="text-gray-800 font-semibold">{invoice.complex?.name || 'Sports Complex'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Sport</p>
                        <p className="text-gray-800 font-semibold capitalize">{invoice.sport || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Booking Date</p>
                        <p className="text-gray-800 font-semibold">{formatDate(invoice.date)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Time Slot</p>
                        <p className="text-gray-800 font-semibold">{formatTime(invoice.timeSlot)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Duration</p>
                        <p className="text-gray-800 font-semibold">{invoice.hours || 1} {invoice.hours === 1 ? 'Hour' : 'Hours'}</p>
                      </div>
                      {invoice.coachRequired && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Coach</p>
                          <p className="text-gray-800 font-semibold">Included</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Invoice Date</p>
                        <p className="text-gray-800 font-semibold">{invoice.originalDate?.toDate ? formatDate(invoice.originalDate) : invoice.createdAt?.toDate ? formatDate(invoice.createdAt) : 'N/A'}</p>
                      </div>
                      {invoice.updatedDate && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                          <p className="text-gray-800 font-semibold">{invoice.updatedDate?.toDate ? formatDate(invoice.updatedDate) : 'N/A'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              } else if (invoice.type === 'restaurant') {
                return (
                  <div key={invoice.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                          Invoice #{invoice.id.slice(0, 8).toUpperCase()}
                        </h3>
                        <p className="text-sm text-gray-500 mb-1">Type: Restaurant Order</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary mb-2">£{invoice.total?.toFixed(2) || '0.00'}</p>
                        <span className={`inline-block px-3 py-1 rounded text-sm ${
                          invoice.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : invoice.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {invoice.status || 'pending'}
                        </span>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Items</p>
                        <p className="text-gray-800 font-semibold">{invoice.items?.length || 0} item{invoice.items?.length !== 1 ? 's' : ''}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Invoice Date</p>
                        <p className="text-gray-800 font-semibold">{invoice.createdAt?.toDate ? formatDate(invoice.createdAt) : 'N/A'}</p>
                      </div>
                      {invoice.items && invoice.items.length > 0 && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600 mb-2">Order Details</p>
                          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                            {invoice.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-700">{item.name || item.itemName} x{item.quantity || 1}</span>
                                <span className="text-gray-800 font-semibold">£{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              } else if (invoice.type === 'equipment') {
                return (
                  <div key={invoice.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                          Invoice #{invoice.id.slice(0, 8).toUpperCase()}
                        </h3>
                        <p className="text-sm text-gray-500 mb-1">Type: Equipment Purchase</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary mb-2">£{invoice.total?.toFixed(2) || '0.00'}</p>
                        <span className={`inline-block px-3 py-1 rounded text-sm ${
                          invoice.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : invoice.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {invoice.status || 'pending'}
                        </span>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Items</p>
                        <p className="text-gray-800 font-semibold">{invoice.items?.length || 0} item{invoice.items?.length !== 1 ? 's' : ''}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Invoice Date</p>
                        <p className="text-gray-800 font-semibold">{invoice.createdAt?.toDate ? formatDate(invoice.createdAt) : 'N/A'}</p>
                      </div>
                      {invoice.items && invoice.items.length > 0 && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600 mb-2">Order Details</p>
                          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                            {invoice.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-700">{item.name || item.itemName} x{item.quantity || 1}</span>
                                <span className="text-gray-800 font-semibold">£{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              } else if (invoice.type === 'package') {
                return (
                  <div key={invoice.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                          Invoice #{invoice.id.slice(0, 8).toUpperCase()}
                        </h3>
                        <p className="text-sm text-gray-500 mb-1">Type: Package Purchase</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary mb-2">£{invoice.amount?.toFixed(2) || '0.00'}</p>
                        <span className={`inline-block px-3 py-1 rounded text-sm ${
                          invoice.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : invoice.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {invoice.status || 'pending'}
                        </span>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Package</p>
                        <p className="text-gray-800 font-semibold">
                          {invoice.package === 'silver' || invoice.package === 'package2' ? 'Silver Package (2% discount)' : 
                           invoice.package === 'gold' || invoice.package === 'package3' ? 'Gold Package (5% discount)' : 
                           invoice.package === 'basic' || invoice.package === 'normal' ? 'Basic Package' : 
                           invoice.package || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Invoice Date</p>
                        <p className="text-gray-800 font-semibold">{invoice.createdAt?.toDate ? formatDate(invoice.createdAt) : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Email</p>
                        <p className="text-gray-800 font-semibold">{invoice.email || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>

          {/* Pagination Controls */}
          {totalInvoicePages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 pt-4 border-t border-gray-200">
              <button
                onClick={() => setInvoicePage(prev => Math.max(1, prev - 1))}
                disabled={invoicePage === 1}
                className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Previous
              </button>
              <span className="text-xs sm:text-sm text-gray-600 text-center">
                Page {invoicePage} of {totalInvoicePages} ({totalInvoices} total invoices)
              </span>
              <button
                onClick={() => setInvoicePage(prev => Math.min(totalInvoicePages, prev + 1))}
                disabled={invoicePage === totalInvoicePages}
                className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserInvoices;

