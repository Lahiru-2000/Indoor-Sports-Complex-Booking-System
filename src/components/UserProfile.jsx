import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '../firebase/config';

const UserProfile = ({ user, userProfileData, setUserProfileData }) => {
  const [profileData, setProfileData] = useState({
    name: '',
    phone: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfileData(userData);
            setProfileData({
              name: userData.name || user?.displayName || '',
              phone: userData.phone || ''
            });
          } else {
            setProfileData({
              name: user?.displayName || '',
              phone: ''
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setProfileError('Failed to load profile data');
        }
      }
    };

    fetchUserProfile();
  }, [user, setUserProfileData]);

  const handleProfileUpdate = async () => {
    if (!user) return;

    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: profileData.name,
        phone: profileData.phone
      });

      if (auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, {
            displayName: profileData.name
          });
        } catch (authError) {
          console.warn('Failed to update auth displayName:', authError);
        }
      }

      setProfileSuccess('Profile updated successfully!');
      setUserProfileData({ ...userProfileData, name: profileData.name, phone: profileData.phone });
      
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileError('Failed to update profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Profile Settings</h2>
      <div className="max-w-2xl">
        {profileSuccess && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {profileSuccess}
          </div>
        )}
        {profileError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {profileError}
          </div>
        )}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">Name</label>
          <input
            type="text"
            value={profileData.name}
            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Your name"
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">Email</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">Phone Number</label>
          <input
            type="tel"
            value={profileData.phone}
            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="+44 123 456 7890"
          />
        </div>
        <button
          onClick={handleProfileUpdate}
          disabled={profileLoading}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {profileLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default UserProfile;

