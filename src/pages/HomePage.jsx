import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useEffect, useState } from 'react';

const HomePage = ({ user }) => {
  const [complexes, setComplexes] = useState([]);
  const [coaches, setCoaches] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const complexesSnapshot = await getDocs(collection(db, 'complexes'));
        const complexesData = complexesSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(complex => complex.status !== 'deleted' && complex.enabled !== false);
        setComplexes(complexesData);

        const coachesSnapshot = await getDocs(collection(db, 'coaches'));
        const coachesData = await Promise.all(
          coachesSnapshot.docs
            .filter(docSnap => docSnap.data().status !== 'deleted')
            .map(async (docSnap) => {
              const coachData = { id: docSnap.id, ...docSnap.data() };
              if (coachData.complexId) {
                try {
                  const complexDoc = await getDoc(doc(db, 'complexes', coachData.complexId));
                  if (complexDoc.exists()) {
                    coachData.complex = { id: complexDoc.id, ...complexDoc.data() };
                  }
                } catch (error) {
                  console.error('Error fetching complex for coach:', error);
                }
              }
              return coachData;
            })
        );
        setCoaches(coachesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setComplexes([
          {
            id: '1',
            name: 'Elite Sports Complex',
            image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
            features: ['Football Stadium', 'Cricket Stadium', 'Swimming Pool', 'Sports Item Shop', 'Restaurant & Refreshments']
          },
          {
            id: '2',
            name: 'Prime Athletic Arena',
            image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800',
            features: ['International Standard Stadiums', 'Certified Coaches', 'Swimming Pool', 'Energy & Nutrition Store', 'Family-Friendly Restaurant']
          },
          {
            id: '3',
            name: 'Unity Sports Hub',
            image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
            features: ['Multi-Sport Facilities', 'Personal & Team Coaching', 'Swimming Pool', 'Sports Accessories Store', 'Healthy Food Corner']
          }
        ]);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-white">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-4 sm:mb-6 px-2">
            Your Ultimate Sports Experience{' '}
            <span className="text-primary">All in One Arena</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
            Book stadiums, hire professional coaches, purchase sports gear, and enjoy refreshments, all from a single platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 px-2">
            <Link
              to={user ? "/browse-complexes" : "/login"}
              className="px-6 sm:px-8 py-2.5 sm:py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-base sm:text-lg font-semibold"
            >
              Book Now
            </Link>
            <a
              href="#complexes"
              className="px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-primary text-primary bg-white rounded-lg hover:bg-primary hover:text-white transition text-base sm:text-lg font-semibold inline-block text-center"
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById('complexes');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            >
              Explore Complexes
            </a>
          </div>
          <div className="mt-8 sm:mt-12 md:mt-16">
            <div className="relative w-full max-w-6xl mx-auto rounded-lg shadow-xl overflow-hidden bg-gray-100">
              <div className="aspect-video w-full">
                <img
                  src="/images/Rectangle 39899 (2).png"
                  alt="Prime Play Stadium"
                  className="w-full h-full object-cover object-center"
                  loading="eager"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6" style={{ backgroundColor: '#dcfce7' }}>
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 md:gap-12">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 bg-white rounded-full flex items-center justify-center shadow-lg relative mx-auto md:mx-0 overflow-hidden">
                <img 
                  src="/images/image.jpg" 
                  alt="Prime Play Logo" 
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 text-[10px] sm:text-xs text-gray-600 font-semibold bg-white/80 px-2 py-1 rounded">SINCE 2025</div>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4 sm:mb-6">About Prime Play</h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed px-2 md:px-0">
                Prime Play is a complete sports booking and management platform that connects you with world-class sports complexes. 
                Whether you want to play, train, shop, or relax —{' '}
                <span className="text-primary font-semibold">everything you need is available in one seamless experience.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="complexes" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-white">
        <div className="container mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 text-center mb-3 sm:mb-4 px-2">Choose Your Sports Complex</h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 text-center mb-8 sm:mb-12 max-w-3xl mx-auto px-2">
            Select one of our premium sports complexes, each equipped with multiple sports facilities, professional coaches, shops, and restaurants.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
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
                <div className="p-4 sm:p-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">{complex.name}</h3>
                  <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                    {complex.features?.map((feature, index) => (
                      <li key={index} className="flex items-start text-gray-600 text-sm sm:text-base">
                        <span className="text-primary mr-2 font-bold flex-shrink-0">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={`/complex/${complex.id}`}
                    className="block w-full text-center px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm sm:text-base font-semibold"
                  >
                    View Complex
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {coaches.length > 0 && (
        <section id="coaches" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gray-50">
          <div className="container mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 text-center mb-3 sm:mb-4 px-2">Our Professional Coaches</h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 text-center mb-8 sm:mb-12 max-w-3xl mx-auto px-2">
              Meet our certified and experienced coaches ready to help you improve your game.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {coaches.slice(0, 6).map((coach) => (
                <div key={coach.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="relative h-48 sm:h-56 md:h-64 bg-gray-200 overflow-hidden">
                    {coach.image ? (
                      <img
                        src={coach.image}
                        alt={coach.name}
                        className="w-full h-full object-cover object-center"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <svg className="w-24 h-24 text-primary opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{coach.name || 'Coach'}</h3>
                    
                    <p className="text-base sm:text-lg font-semibold text-primary">
                      {coach.speciality || 'Professional Coach'}
                    </p>
                    
                    {coach.complex && (
                      <p className="text-gray-700 text-sm sm:text-base">
                        <span className="font-semibold">Complex:</span> {coach.complex.name}
                      </p>
                    )}
                    
                    {coach.bio ? (
                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-3">
                        {coach.bio}
                      </p>
                    ) : (
                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-3">
                        Professional coach with extensive experience in sports training and development.
                      </p>
                    )}
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 pt-3 border-t border-gray-200">
                      {coach.experience && (
                        <p className="text-gray-700 text-sm sm:text-base font-medium">
                          Experience: <span className="font-bold">{coach.experience}</span> {coach.experience === 1 ? 'year' : 'years'}
                        </p>
                      )}
                      <p className="text-lg sm:text-xl font-bold text-primary">
                        £{coach.price?.toFixed(2) || '0.00'}/hr
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {coaches.length > 6 && (
              <div className="text-center mt-8">
                <p className="text-gray-600">And {coaches.length - 6} more professional coaches available!</p>
              </div>
            )}
          </div>
        </section>
      )}

      <section id="services" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-white">
        <div className="container mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 text-center mb-8 sm:mb-12 px-2">How It Works</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
            {[
              { num: 1, title: 'Select a Complex', desc: 'Choose your preferred sports complex.' },
              { num: 2, title: 'Select Sport & Time Slot', desc: 'Pick Football, Cricket, or Swimming and select available dates & times.' },
              { num: 3, title: 'Add Coach (Optional)', desc: 'Hire a professional coach for your session.' },
              { num: 4, title: 'Buy Sports Items (Optional)', desc: 'Purchase bats, balls, energy drinks, and more.' },
              { num: 5, title: 'Pay & Receive Confirmation', desc: 'View total bill (in GBP £), pay securely, and receive confirmation via email.' },
              { num: 6, title: 'Show Confirmation & Play', desc: 'Present your booking at the entrance and enjoy your game.' },
            ].map((step) => (
              <div key={step.num} className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary rounded-lg flex items-center justify-center text-white text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                  {step.num}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">{step.title}</h3>
                <p className="text-sm sm:text-base text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
