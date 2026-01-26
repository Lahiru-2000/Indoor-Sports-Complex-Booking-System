import { Link } from 'react-router-dom';
import { HiCalendar, HiOfficeBuilding, HiUserCircle, HiUsers, HiShoppingBag, HiEmojiHappy, HiHome, HiViewGrid, HiReceiptTax } from 'react-icons/hi';

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HiViewGrid },
    { id: 'bookings', label: 'Bookings', icon: HiCalendar },
    { id: 'complexes', label: 'Complexes', icon: HiOfficeBuilding },
    { id: 'coaches', label: 'Coaches', icon: HiUserCircle },
    { id: 'users', label: 'Users', icon: HiUsers },
    { id: 'equipment', label: 'Equipment Shop', icon: HiShoppingBag },
    { id: 'restaurant', label: 'Restaurant', icon: HiEmojiHappy },
    { id: 'restaurantPurchases', label: 'Restaurant Purchases', icon: HiReceiptTax },
    { id: 'equipmentPurchases', label: 'Equipment Purchases', icon: HiReceiptTax },
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white fixed left-0 top-16 bottom-0 overflow-y-auto">
      <div className="p-4 pb-20">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                activeTab === item.id
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* <div className="absolute bottom-4 left-4 right-4">
        <Link
          to="/"
          className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition"
        >
          <HiHome className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
      </div> */}
    </aside>
  );
};

export default AdminSidebar;

