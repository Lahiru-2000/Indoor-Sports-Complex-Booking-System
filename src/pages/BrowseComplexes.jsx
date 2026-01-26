import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import Footer from '../components/Footer';

const BrowseComplexes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complexes, setComplexes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplexes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'complexes'));
        const complexesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const enabledComplexes = complexesData.filter(complex => 
          complex.enabled !== false && complex.status !== 'deleted'
        );
        setComplexes(enabledComplexes);
      } catch (error) {
        console.error('Error fetching complexes:', error);
        setComplexes([
          {
            id: '1',
            name: 'Elite Sports Complex',
            image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
            features: ['Football Stadium', 'Cricket Stadium', 'Swimming Pool', 'Sports Item Shop', 'Restaurant & Refreshments'],
            pricePerHour: 50,
            enabled: true
          },
          {
            id: '2',
            name: 'Prime Athletic Arena',
            image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800',
            features: ['International Standard Stadiums', 'Certified Coaches', 'Swimming Pool', 'Energy & Nutrition Store', 'Family-Friendly Restaurant'],
            pricePerHour: 60,
            enabled: true
          },
          {
            id: '3',
            name: 'Unity Sports Hub',
            image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
            features: ['Multi-Sport Facilities', 'Personal & Team Coaching', 'Swimming Pool', 'Sports Accessories Store', 'Healthy Food Corner'],
            pricePerHour: 55,
            enabled: true
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchComplexes();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl text-gray-600">Loading complexes...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header user={user} />
      
      <div className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Browse Sports Complexes</h1>
            <p className="text-lg text-gray-600">
              Select a complex to book your sports session. All complexes are equipped with premium facilities.
            </p>
          </div>

          {complexes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-4">No complexes available at the moment.</p>
              <button
                onClick={() => navigate('/user/dashboard')}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
              >
                Back to Dashboard
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {complexes.map((complex) => (
                <div key={complex.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                  <img
                    src={complex.image || '/images/complex-placeholder.jpg'}
                    alt={complex.name}
                    className="w-full h-56 object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800';
                    }}
                  />
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{complex.name}</h3>
                    {complex.pricePerHour && (
                      <p className="text-lg font-semibold text-primary mb-4">
                        £{complex.pricePerHour.toFixed(2)} per hour
                      </p>
                    )}
                    {complex.description && (
                      <p className="text-gray-600 mb-4 line-clamp-2">{complex.description}</p>
                    )}
                    {complex.features && complex.features.length > 0 && (
                      <ul className="space-y-2 mb-6">
                        {complex.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-start text-gray-600 text-sm">
                            <span className="text-primary mr-2 font-bold">•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                        {complex.features.length > 3 && (
                          <li className="text-gray-500 text-sm">
                            +{complex.features.length - 3} more features
                          </li>
                        )}
                      </ul>
                    )}
                    <div className="flex gap-3">
                      <Link
                        to={`/booking/${complex.id}`}
                        className="flex-1 text-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold"
                      >
                        Book Now
                      </Link>
                      <Link
                        to={`/complex/${complex.id}`}
                        className="px-4 py-2 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition font-semibold"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default BrowseComplexes;

