import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ComplexDetail = ({ user }) => {
  const { id } = useParams();
  const [complex, setComplex] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplex = async () => {
      try {
        const docRef = doc(db, 'complexes', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const complexData = { id: docSnap.id, ...docSnap.data() };
          if (complexData.status === 'deleted') {
            setComplex(null);
            return;
          }
          setComplex(complexData);
        } else {
          const defaultComplexes = {
            '1': {
              id: '1',
              name: 'Elite Sports Complex',
              image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
              features: ['Football Stadium', 'Cricket Stadium', 'Swimming Pool', 'Sports Item Shop', 'Restaurant & Refreshments'],
              description: 'A world-class sports complex with state-of-the-art facilities.'
            },
            '2': {
              id: '2',
              name: 'Prime Athletic Arena',
              image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800',
              features: ['International Standard Stadiums', 'Certified Coaches', 'Swimming Pool', 'Energy & Nutrition Store', 'Family-Friendly Restaurant'],
              description: 'An international standard arena with certified coaches and premium facilities.'
            },
            '3': {
              id: '3',
              name: 'Unity Sports Hub',
              image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
              features: ['Multi-Sport Facilities', 'Personal & Team Coaching', 'Swimming Pool', 'Sports Accessories Store', 'Healthy Food Corner'],
              description: 'A comprehensive sports hub for all your sporting needs.'
            }
          };
          setComplex(defaultComplexes[id] || defaultComplexes['1']);
        }
      } catch (error) {
        console.error('Error fetching complex:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplex();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!complex) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Complex not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      
      <div className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <img
            src={complex.image}
            alt={complex.name}
            className="w-full h-96 object-cover rounded-lg shadow-xl mb-8"
          />
          
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{complex.name}</h1>
          <p className="text-lg text-gray-600 mb-8">{complex.description || 'Premium sports complex with world-class facilities.'}</p>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Facilities</h2>
            <ul className="grid md:grid-cols-2 gap-3">
              {complex.features?.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-primary mr-2 text-xl">✓</span>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-4">
            <Link
              to={user ? `/booking/${complex.id}` : '/login'}
              className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold"
            >
              Book Now
            </Link>
            <Link
              to="/"
              className="px-8 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition font-semibold"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ComplexDetail;








