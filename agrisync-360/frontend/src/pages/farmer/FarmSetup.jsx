import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Info } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import { farmersAPI } from '../../api/farmers';
import { PageLoader } from '../../components/common/Loader';
import toast from 'react-hot-toast';

const soilTypes = ['clay', 'loam', 'sandy', 'silt', 'peat'];
const waterSources = ['rain-fed', 'irrigation', 'river', 'borehole', 'none'];
const cropOptions = [
  { id: 'maize', name: 'Maize', emoji: '🌽' },
  { id: 'beans', name: 'Beans', emoji: '🫘' },
  { id: 'potatoes', name: 'Potatoes', emoji: '🥔' },
  { id: 'tomatoes', name: 'Tomatoes', emoji: '🍅' },
  { id: 'tea', name: 'Tea', emoji: '🍵' },
  { id: 'wheat', name: 'Wheat', emoji: '🌾' },
  { id: 'cabbage', name: 'Cabbage', emoji: '🥬' },
  { id: 'kale', name: 'Kale', emoji: '🥦' },
  { id: 'onions', name: 'Onions', emoji: '🧅' }
];

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

export default function FarmSetup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [farmData, setFarmData] = useState({
    // Step 1
    farm_name: '',
    size_acres: '',
    soil_type: '',
    water_source: '',
    
    // Step 2
    latitude: '',
    longitude: '',
    county: '',
    sub_county: '',
    elevation: '',
    
    // Step 3
    crops: [],
    skip_crops: false
  });

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFarmData(prev => ({
            ...prev,
            latitude: pos.coords.latitude.toFixed(6),
            longitude: pos.coords.longitude.toFixed(6)
          }));
          toast.success('Location detected!');
        },
        () => toast.error('Could not get location')
      );
    } else {
      toast.error('Geolocation not supported');
    }
  };

  const toggleCrop = (cropId) => {
    setFarmData(prev => {
      const existing = prev.crops.find(c => c.crop_type === cropId);
      if (existing) {
        return {
          ...prev,
          crops: prev.crops.filter(c => c.crop_type !== cropId)
        };
      } else {
        return {
          ...prev,
          crops: [...prev.crops, {
            crop_type: cropId,
            planting_date: '',
            variety: '',
            area_acres: ''
          }]
        };
      }
    });
  };

  const updateCrop = (cropId, field, value) => {
    setFarmData(prev => ({
      ...prev,
      crops: prev.crops.map(crop =>
        crop.crop_type === cropId ? { ...crop, [field]: value } : crop
      )
    }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!farmData.farm_name.trim()) {
          setError('Farm name is required');
          return false;
        }
        if (!farmData.size_acres || farmData.size_acres <= 0) {
          setError('Farm size must be greater than 0');
          return false;
        }
        if (!farmData.soil_type) {
          setError('Please select a soil type');
          return false;
        }
        if (!farmData.water_source) {
          setError('Please select a water source');
          return false;
        }
        break;
        
      case 2:
        if (!farmData.county) {
          setError('Please select a county');
          return false;
        }
        // Coordinates are optional - will be auto-generated
        break;
        
      case 3:
        if (!farmData.skip_crops && farmData.crops.length === 0) {
          setError('Please select at least one crop or skip this step');
          return false;
        }
        if (!farmData.skip_crops) {
          for (const crop of farmData.crops) {
            if (!crop.planting_date) {
              setError('Planting date is required for all crops');
              return false;
            }
            if (!crop.area_acres || crop.area_acres <= 0) {
              setError('Area planted must be greater than 0');
              return false;
            }
          }
        }
        break;
        
      case 4:
        // Confirmation step - no validation needed
        break;
    }
    
    setError('');
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep === 4) {
        handleSubmit();
      } else {
        nextStep();
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('[FarmSetup] Starting farm creation with data:', farmData);
      
      // Create farm
      const farmPayload = {
        name: farmData.farm_name,
        size_acres: parseFloat(farmData.size_acres),
        soil_type: farmData.soil_type,
        water_source: farmData.water_source,
        county: farmData.county,
        sub_county: farmData.sub_county,
        elevation: farmData.elevation ? parseFloat(farmData.elevation) : null,
        is_primary: true // Make this the primary farm
      };
      
      // Only include coordinates if provided (backend will auto-generate)
      if (farmData.latitude && farmData.longitude) {
        farmPayload.latitude = parseFloat(farmData.latitude);
        farmPayload.longitude = parseFloat(farmData.longitude);
      }

      console.log('[FarmSetup] Sending farm payload:', farmPayload);

      const farmResp = await farmersAPI.createFarm(farmPayload);
      console.log('[FarmSetup] Farm creation response:', farmResp);
      
      const farm = farmResp.data?.data;

      if (!farm) {
        console.error('[FarmSetup] No farm data in response:', farmResp);
        throw new Error('Failed to create farm - no data returned');
      }

      // Add crops if not skipped
      if (!farmData.skip_crops && farmData.crops.length > 0) {
        console.log('[FarmSetup] Creating farm with crops:', farmData.crops);
        try {
          for (const crop of farmData.crops) {
            const cropPayload = {
              crop_name: crop.crop_type,
              planting_date: crop.planting_date,
              variety: crop.variety || null,
              area_planted_acres: parseFloat(crop.area_acres),
              days_to_maturity: getDaysToMaturity(crop.crop_type)
            };
            
            console.log('[FarmSetup] Adding crop:', cropPayload);
            await farmersAPI.addCrop(farm.id, cropPayload);
          }
          
          toast.success('Farm and crops created successfully!');
        } catch (cropErr) {
          console.error('Crop creation error:', cropErr);
          toast.error('Some crops failed to create. Farm was created but you may need to add crops manually.');
        }
      } else {
        toast.success('Farm created successfully!');
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Farm setup error:', err);
      console.error('Farm setup error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      
      // Handle specific farmer profile requirement error
      if (err?.response?.data?.error === 'farmer_profile_required') {
        setError('You need to create a farmer profile first. Redirecting to profile setup...');
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      } else if (err?.response?.status === 404) {
        setError('Service not found. Please try again or contact support.');
      } else if (err?.response?.status === 400) {
        setError(err.response?.data?.message || 'Invalid farm data provided.');
      } else if (err?.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(err.message || 'Failed to create farm');
      }
    } finally {
      setLoading(false);
    }
  };

  const getDaysToMaturity = (cropType) => {
    const maturityDays = {
      maize: 120,
      beans: 90,
      potatoes: 100,
      tomatoes: 75,
      tea: 365,
      wheat: 110,
      cabbage: 80,
      kale: 60,
      onions: 120
    };
    return maturityDays[cropType] || 90;
  };

  if (loading) {
    return <PageLoader message="Creating your farm..." />;
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Farm Setup</h1>
        <p className="text-gray-600 mt-1">Add your farm details and crops</p>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((num) => (
            <React.Fragment key={num}>
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${currentStep >= num ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}
              `}>
                {currentStep > num ? <CheckCircle className="w-4 h-4" /> : num}
              </div>
              {num < 4 && (
                <div className={`
                  flex-1 h-0.5 mx-2
                  ${currentStep > num ? 'bg-primary-600' : 'bg-gray-200'}
                `} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Farm Details</span>
          <span>Location</span>
          <span>Add Crops</span>
          <span>Confirm</span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert type="error" message={error} dismissible onDismiss={() => setError('')} />
      )}

      {/* STEP 1: Farm Details */}
      {currentStep === 1 && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Farm Details</h2>
          
          <div className="space-y-4">
            <Input
              label="Farm Name"
              placeholder="e.g., Shamba Farm"
              value={farmData.farm_name}
              onChange={(e) => setFarmData(prev => ({ ...prev, farm_name: e.target.value }))}
              required
            />

            <Input
              label="Farm Size (acres)"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="e.g., 5"
              value={farmData.size_acres}
              onChange={(e) => setFarmData(prev => ({ ...prev, size_acres: e.target.value }))}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Soil Type</label>
              <select
                value={farmData.soil_type}
                onChange={(e) => setFarmData(prev => ({ ...prev, soil_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select soil type</option>
                {soilTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Water Source</label>
              <select
                value={farmData.water_source}
                onChange={(e) => setFarmData(prev => ({ ...prev, water_source: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select water source</option>
                {waterSources.map(source => (
                  <option key={source} value={source}>
                    {source.replace('-', ' ').charAt(0).toUpperCase() + source.replace('-', ' ').slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 2: Location */}
      {currentStep === 2 && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Farm Location</h2>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>📍 Automatic Location Detection</strong><br />
                Coordinates will be automatically generated based on your county and sub-county selection.
                You can also use GPS detection or enter coordinates manually.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Latitude (Optional - Auto-generated)"
                type="number"
                step="0.000001"
                placeholder="e.g., -1.2921"
                value={farmData.latitude}
                onChange={(e) => setFarmData(prev => ({ ...prev, latitude: e.target.value }))}
              />

              <Input
                label="Longitude (Optional - Auto-generated)"
                type="number"
                step="0.000001"
                placeholder="e.g., 36.8219"
                value={farmData.longitude}
                onChange={(e) => setFarmData(prev => ({ ...prev, longitude: e.target.value }))}
              />
            </div>

            <Button
              variant="outline"
              onClick={getLocation}
              className="w-full"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Use My GPS Location
            </Button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">County</label>
              <select
                value={farmData.county}
                onChange={(e) => setFarmData(prev => ({ ...prev, county: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select county</option>
                {kenyanCounties.map((county, index) => (
                  <option key={`${county}-${index}`} value={county.toLowerCase()}>
                    {county}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Sub-County"
                placeholder="e.g., Nakuru East"
                value={farmData.sub_county}
                onChange={(e) => setFarmData(prev => ({ ...prev, sub_county: e.target.value }))}
              />

              <Input
                label="Elevation (meters, optional)"
                type="number"
                placeholder="e.g., 1800"
                value={farmData.elevation}
                onChange={(e) => setFarmData(prev => ({ ...prev, elevation: e.target.value }))}
              />
            </div>
          </div>
        </Card>
      )}

      {/* STEP 3: Add Crops */}
      {currentStep === 3 && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Add Crops</h2>
          
          <div className="space-y-6">
            {/* Skip option */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Skip crops for now</p>
                <p className="text-sm text-gray-500">You can add crops later from your dashboard</p>
              </div>
              <button
                onClick={() => setFarmData(prev => ({ ...prev, skip_crops: !prev.skip_crops }))}
                className={`w-12 h-6 rounded-full transition-colors ${
                  farmData.skip_crops ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  farmData.skip_crops ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {!farmData.skip_crops && (
              <>
                {/* Crop selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Select crops to plant</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {cropOptions.map(crop => {
                      const isSelected = farmData.crops.some(c => c.crop_type === crop.id);
                      return (
                        <button
                          key={crop.id}
                          onClick={() => toggleCrop(crop.id)}
                          className={`p-3 border rounded-lg transition-colors ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-2xl mb-1">{crop.emoji}</div>
                          <p className="text-sm font-medium text-gray-900">{crop.name}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Crop details */}
                {farmData.crops.map(crop => {
                  const cropInfo = cropOptions.find(c => c.id === crop.crop_type);
                  return (
                    <div key={crop.crop_type} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{cropInfo.emoji}</span>
                        <h3 className="font-semibold text-gray-900">{cropInfo.name}</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                          label="Planting Date"
                          type="date"
                          value={crop.planting_date}
                          onChange={(e) => updateCrop(crop.crop_type, 'planting_date', e.target.value)}
                          required
                        />
                        
                        <Input
                          label="Variety (optional)"
                          placeholder="e.g., Hybrid 614"
                          value={crop.variety}
                          onChange={(e) => updateCrop(crop.crop_type, 'variety', e.target.value)}
                        />
                        
                        <Input
                          label="Area (acres)"
                          type="number"
                          min="0.1"
                          step="0.1"
                          placeholder="e.g., 2"
                          value={crop.area_acres}
                          onChange={(e) => updateCrop(crop.crop_type, 'area_acres', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </Card>
      )}

      {/* STEP 4: Confirmation */}
      {currentStep === 4 && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Confirm Farm Details</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Farm Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium">Name:</span> {farmData.farm_name}</div>
                <div><span className="font-medium">Size:</span> {farmData.size_acres} acres</div>
                <div><span className="font-medium">Soil:</span> {farmData.soil_type}</div>
                <div><span className="font-medium">Water:</span> {farmData.water_source}</div>
                <div><span className="font-medium">County:</span> {farmData.county}</div>
                <div><span className="font-medium">Sub-County:</span> {farmData.sub_county || 'Not specified'}</div>
                <div><span className="font-medium">GPS:</span> {farmData.latitude}, {farmData.longitude}</div>
                {farmData.elevation && (
                  <div><span className="font-medium">Elevation:</span> {farmData.elevation}m</div>
                )}
              </div>
            </div>

            {!farmData.skip_crops && farmData.crops.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Crops to Plant</h3>
                <div className="space-y-2">
                  {farmData.crops.map(crop => {
                    const cropInfo = cropOptions.find(c => c.id === crop.crop_type);
                    return (
                      <div key={crop.crop_type} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span>{cropInfo.emoji}</span>
                          <span className="font-medium">{cropInfo.name}</span>
                        </div>
                        <div className="text-gray-500">
                          {crop.area_acres} acres • {crop.variety || 'No variety'} • {crop.planting_date}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Alert type="info">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-medium">Ready to create your farm</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Review all details above. Once created, you can manage your farm and crops from the dashboard.
                  </p>
                </div>
              </div>
            </Alert>
          </div>
        </Card>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={handleNext}
          isLoading={loading}
        >
          {currentStep === 4 ? 'Create Farm' : 'Next'}
          {currentStep !== 4 && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}
