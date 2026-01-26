import Header from '../components/Header';
import Footer from '../components/Footer';

const AboutUs = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      {/* Who We Are Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-800 mb-8">Who We Are</h1>
          
          <div className="space-y-6 mb-12 text-gray-700 leading-relaxed">
            <p className="text-lg">
              Prime Play is a smart sports booking platform that connects players, coaches, and facilities in one unified digital ecosystem. We revolutionize the way sports enthusiasts access and engage with sports infrastructure, making it easier than ever to find, book, and enjoy quality sports facilities.
            </p>
            <p className="text-lg">
              Our platform serves as a bridge between sports lovers and premium sports complexes, offering seamless booking experiences across multiple sports disciplines. Whether you're looking for a cricket ground, football stadium, or swimming pool, Prime Play simplifies the process of discovering and reserving your ideal sports facility.
            </p>
            <p className="text-lg">
              Through innovative technology and user-centric design, we empower athletes, casual players, and sports professionals to pursue their passion with greater convenience and accessibility. Our mission is to make quality sports facilities accessible to everyone, fostering a healthier and more active community.
            </p>
          </div>

          {/* Large Image with Logo Overlay */}
          <div className="relative">
            <img
              src="/images/Rectangle 39899 (1).png"
              alt="Prime Play Stadium"
              className="w-full h-[500px] object-cover rounded-lg shadow-lg"
            />
            {/* Logo Overlay */}
            <div className="absolute bottom-8 right-8">
              <div className="bg-white/95 backdrop-blur-sm rounded-full p-6 shadow-xl">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3 overflow-hidden">
                    <img 
                      src="/images/image.jpg" 
                      alt="Prime Play Logo" 
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 text-center mb-1">PRIME PLAY<br />STADIUM</h3>
                  <p className="text-xs text-gray-600 transform rotate-180" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                    SINCE 2025
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="bg-primary/10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-5xl font-bold text-gray-800 mb-6">What We Offer</h2>
            <p className="text-lg text-primary-dark mb-12 max-w-3xl">
              Our platform provides seamless access to a diverse range of sports complexes, including cricket grounds, football stadiums, swimming pools, and more. We bring together facilities, coaches, and players in one integrated ecosystem.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feature 1 */}
              <div className="bg-white border-2 border-primary/30 rounded-lg p-6 shadow-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Book sports facilities based on real-time availability
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-white border-2 border-primary/30 rounded-lg p-6 shadow-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Choose professional coaches for training sessions
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-white border-2 border-primary/30 rounded-lg p-6 shadow-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    View clear pricing in Pounds (£ GBP)
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="bg-white border-2 border-primary/30 rounded-lg p-6 shadow-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Receive instant booking confirmation via email
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Vision Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-800 mb-6">Our Vision</h2>
          <p className="text-lg text-gray-700 mb-12 w-full leading-relaxed">
            At Prime Play, we envision creating a unified digital ecosystem that connects all sports facilities, making them easily accessible to athletes, enthusiasts, and professionals alike. We strive to break down barriers and create opportunities for everyone to engage with quality sports infrastructure.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Vision Point 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-3xl font-bold">1</span>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                Improve accessibility to quality sports infrastructure
              </p>
            </div>

            {/* Vision Point 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-3xl font-bold">2</span>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                Support athletes with professional coaching opportunities
              </p>
            </div>

            {/* Vision Point 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-3xl font-bold">3</span>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                Encourage an active and healthy lifestyle through technology
              </p>
            </div>
          </div>

          <p className="text-xl text-primary font-semibold text-center max-w-4xl mx-auto leading-relaxed">
            Prime Play is built to grow with the sports community and redefine how sports facilities are experienced.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;
