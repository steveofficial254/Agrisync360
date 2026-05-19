import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Edit3, Eye, EyeOff, Lock, Plus, ChevronRight, Calendar, Shield, AlertTriangle, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { farmersAPI } from '../../api/farmers';
import { authAPI } from '../../api/auth';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Input from '../../components/common/Input';
import { PageLoader, Skeleton } from '../../components/common/Loader';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

const kenyanCounties = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret',
  'Kiambu', 'Thika', 'Kitale', 'Kericho', 'Nyeri',
  'Meru', 'Kakamega', 'Kisii', 'Bungoma', 'Busia',
  'Homa Bay', 'Migori', 'Kilifi', 'Kwale', 'Tana River',
  'Lamu', 'Garissa', 'Wajir', 'Mandera', 'Marsabit',
  'Isiolo', 'Samburu', 'Turkana', 'West Pokot', 'Baringo',
  'Koibatek', 'Nandi', 'Uasin Gishu', 'Elgeyo Marakwet',
  'Bomet', 'Narok', 'Kajiado', 'Taita Taveta',
  'Makueni', 'Machakos', 'Kitui', 'Embu', 'Tharaka Nithi',
  'Kirinyaga', 'Muranga', 'Nyandarua', 'Laikipia'
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [farms, setFarms] = useState([]);
  const [editing, setEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    county: '',
    sub_county: '',
    ward: '',
    village: ''
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    // Wait for auth to load before fetching
    if (authLoading) return;

    loadProfileData();
  }, [authLoading, isAuthenticated]);

  const loadProfileData = async () => {
    setLoading(true);
    setError('');

    try {
      // Only try to load data if authenticated
      if (!isAuthenticated) {
        setProfile(null);
        setFarms([]);
        return;
      }

      // Load profile
      const profileResp = await farmersAPI.getProfile();
      const profileData = profileResp.data?.data || {};
      setProfile(profileData);
      setEditForm({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        county: profileData.county || '',
        sub_county: profileData.sub_county || '',
        ward: profileData.ward || '',
        village: profileData.village || ''
      });

      // Only load farms if profile exists
      if (profileData && profileData.id) {
        const farmsResp = await farmersAPI.listFarms();
        setFarms(farmsResp.data?.data || []);
      } else {
        setFarms([]);
      }
    } catch (err) {
      console.error('[Profile] Error:', err);
      // Don't show 401 errors as profile errors
      if (err?.status !== 401) {
        setError('Failed to load profile data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = async () => {
    if (!editForm.first_name.trim() || !editForm.last_name.trim()) {
      setError('First name and last name are required');
      return;
    }

    if (!kenyanCounties.includes(editForm.county)) {
      setError('Please select a valid Kenyan county');
      return;
    }

    try {
      if (profile && profile.id) {
        // Update existing profile
        await farmersAPI.updateProfile(editForm);
        setProfile(prev => ({ ...prev, ...editForm }));
        setEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        // Create new profile
        await farmersAPI.createProfile(editForm);
        const profileResp = await farmersAPI.getProfile();
        setProfile(profileResp.data?.data || {});
        setEditing(false);
        toast.success('Profile created successfully!');
      }
    } catch (err) {
      console.error('[Profile] Profile save error:', err);
      setError(err.message || 'Failed to save profile');
    }
  };

  const handlePasswordChange = async () => {
    const { current_password, new_password, confirm_password } = passwordForm;

    if (!current_password || !new_password || !confirm_password) {
      setError('All password fields are required');
      return;
    }

    if (new_password.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    if (new_password !== confirm_password) {
      setError('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    setError('');

    try {
      await authAPI.resetPassword({
        current_password,
        new_password
      });
      
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setShowPasswordForm(false);
      toast.success('Password changed successfully!');
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSetPrimaryFarm = async (farmId) => {
    try {
      await farmersAPI.setPrimaryFarm(farmId);
      setFarms(prev => prev.map(farm => 
        farm.id === farmId ? { ...farm, is_primary: true } : { ...farm, is_primary: false }
      ));
      toast.success('Primary farm updated!');
    } catch (err) {
      setError(err.message || 'Failed to update primary farm');
    }
  };

  const handleDeleteFarm = async (farmId) => {
    if (!confirm('Are you sure you want to delete this farm? This action cannot be undone.')) {
      return;
    }

    try {
      await farmersAPI.deleteFarm(farmId);
      setFarms(prev => prev.filter(farm => farm.id !== farmId));
      toast.success('Farm deleted successfully!');
    } catch (err) {
      setError(err.message || 'Failed to delete farm');
    }
  };

  const getPasswordStrength = (password) => {
    if (password.length < 8) return { text: 'Too short', color: 'text-red-500' };
    if (!/(?=.*[a-z])/.test(password)) return { text: 'Add lowercase', color: 'text-red-500' };
    if (!/(?=.*[A-Z])/.test(password)) return { text: 'Add uppercase', color: 'text-yellow-500' };
    if (!/(?=.*\d)/.test(password)) return { text: 'Add number', color: 'text-yellow-500' };
    if (!/(?=.*[@$!%*?&])/.test(password)) return { text: 'Add special char', color: 'text-yellow-500' };
    return { text: 'Strong', color: 'text-green-500' };
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return <PageLoader message="Loading..." />;
  }

  // Show message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
          <p className="text-gray-600">You need to be logged in to view your profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <PageLoader message="Loading profile..." />;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">Manage your personal information and farms</p>
      </div>

      {/* No Profile Message */}
      {!profile && !error && !loading && (
        <Alert 
          type="info" 
          message="Please create your farmer profile to get started with managing your farms. Click the 'Create Profile' button below to begin." 
        />
      )}

      {/* Error Alert */}
      {error && (
        <Alert type="error" message={error} dismissible onDismiss={() => setError('')} />
      )}

      {/* Profile Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {profile?.first_name || user?.phone || 'Farmer'} {profile?.last_name || ''}
              </h2>
              <p className="text-gray-600">{user?.phone}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <MapPin className="w-4 h-4" />
                <span>{profile?.county || 'Not specified'}</span>
                {profile?.sub_county && <span>• {profile.sub_county}</span>}
                {profile?.village && <span>• {profile.village}</span>}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Member since: {profile?.created_at ? format(new Date(profile.created_at), 'MMM d, yyyy') : 'Unknown'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setEditing(!editing)}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            {editing ? 'Cancel' : (profile && profile.id ? 'Edit Profile' : 'Create Profile')}
          </Button>
        </div>

        {/* Edit Profile Form */}
        {editing && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-4">
              {profile && profile.id ? 'Edit Profile Information' : 'Create Profile Information'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={editForm.first_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                required
              />
              <Input
                label="Last Name"
                value={editForm.last_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">County</label>
                <select
                  value={editForm.county}
                  onChange={(e) => setEditForm(prev => ({ ...prev, county: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Select county</option>
                  {kenyanCounties.map((county, index) => (
                    <option key={`${county}-${index}`} value={county}>
                      {county}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Sub-County"
                placeholder="e.g., Nakuru East"
                value={editForm.sub_county}
                onChange={(e) => setEditForm(prev => ({ ...prev, sub_county: e.target.value }))}
              />
              <Input
                label="Ward"
                placeholder="e.g., Ward 12"
                value={editForm.ward}
                onChange={(e) => setEditForm(prev => ({ ...prev, ward: e.target.value }))}
              />
              <Input
                label="Village"
                placeholder="e.g., Kiamaina"
                value={editForm.village}
                onChange={(e) => setEditForm(prev => ({ ...prev, village: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={handleEditProfile}>
                {profile && profile.id ? 'Save Changes' : 'Create Profile'}
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* My Farms */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">My Farms</h2>
          <Button onClick={() => navigate('/farm-setup')}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Farm
          </Button>
        </div>

        {farms.length === 0 ? (
          <Alert type="info">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-medium">No farms registered yet</p>
                <p className="text-sm text-gray-600 mt-1">
                  Add your first farm to start using AgriSync 360 features.
                </p>
              </div>
            </div>
          </Alert>
        ) : (
          <div className="space-y-4">
            {farms.map((farm) => (
              <Card key={farm.id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{farm.name}</h3>
                        <p className="text-sm text-gray-500">
                          {farm.size_acres} acres • {farm.county}
                        </p>
                        <p className="text-xs text-gray-400">
                          {farm.latitude?.toFixed(4)}, {farm.longitude?.toFixed(4)}
                        </p>
                      </div>
                      {farm.is_primary && (
                        <Badge variant="success">Primary</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500">
                        {farm.crops_count || 0} crops
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/farm-setup?farmId=${farm.id}`)}
                      >
                        View Crops
                      </Button>
                      {!farm.is_primary && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetPrimaryFarm(farm.id)}
                        >
                          Set Primary
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Change Password */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
          >
            {showPasswordForm ? 'Cancel' : 'Change Password'}
          </Button>
        </div>

        {showPasswordForm && (
          <div className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="Enter current password"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
            />
            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
              hint={getPasswordStrength(passwordForm.new_password).text}
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Confirm new password"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
              error={passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password ? 'Passwords do not match' : ''}
            />
            <div className="flex gap-3">
              <Button
                onClick={handlePasswordChange}
                isLoading={passwordLoading}
                disabled={!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password}
              >
                Change Password
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPasswordForm({
                    current_password: '',
                    new_password: '',
                    confirm_password: ''
                  });
                  setShowPasswordForm(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Account Actions */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Privacy & Security</p>
                <p className="text-sm text-gray-500">Manage your data and privacy settings</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Help & Support</p>
                <p className="text-sm text-gray-500">Get help with your account</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex items-center justify-between p-3 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="font-medium text-red-900">Delete Account</p>
                <p className="text-sm text-gray-500">Permanently delete your account</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-red-400" />
          </div>
        </div>
      </Card>

      {/* Logout Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
