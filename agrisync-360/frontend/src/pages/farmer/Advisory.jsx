import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { advisoryAPI } from '../../api/advisory';
import { farmersAPI } from '../../api/farmers';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { PageLoader, Skeleton } from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';
import {
  BookOpen, Sprout, Bug, Scissors, Calendar,
  ChevronRight, Search, Filter, Plus, TrendingUp,
  Droplets, Sun, Wind, AlertTriangle, Leaf,
  Wheat, TreePine
} from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

// Crop icon mapping
const getCropIcon = (cropType) => {
  const icons = {
    maize: <Wheat size={24} className="text-yellow-600" />,
    beans: <Sprout size={24} className="text-green-600" />,
    potatoes: <Sprout size={24} className="text-amber-600" />,
    tomatoes: <Leaf size={24} className="text-red-600" />,
    tea: <Leaf size={24} className="text-green-700" />,
    wheat: <Wheat size={24} className="text-yellow-700" />,
    cabbage: <Leaf size={24} className="text-green-500" />,
    kale: <Leaf size={24} className="text-green-600" />,
    onions: <Sprout size={24} className="text-yellow-500" />
  };
  return icons[cropType] || <Leaf size={24} className="text-green-500" />;
};

// Growth stages
const growthStages = {
  planting: 'Planting',
  germination: 'Germination',
  vegetative: 'Vegetative',
  flowering: 'Flowering',
  fruiting: 'Fruiting',
  harvesting: 'Harvesting'
};

const processAdvisoryData = (data, type) => {
  if (!data) return [];
  if (type === 'nutrition') {
    const items = Array.isArray(data) ? data : [data];
    return items.map(item => ({
      title: item.title || `${item.crop_name?.toUpperCase() || 'Crop'} Nutrition Guide`,
      content: item.content || item.application_method || (item.recommended_products ? `Recommended: ${item.recommended_products.join(', ')}` : 'No nutrition details.'),
      npk: item.npk_requirements ? {
        n: item.npk_requirements.N,
        p: item.npk_requirements.P,
        k: item.npk_requirements.K
      } : null
    }));
  }
  
  if (type === 'pests') {
    const items = Array.isArray(data) ? data : [data];
    return items.map(item => ({
      title: item.title || item.threat || 'Pest & Disease Alert',
      content: item.content || item.action_required || 'Monitor crop health regularly.',
      symptoms: item.symptoms || null,
      treatment: item.treatment || item.action_required || null
    }));
  }
  
  if (type === 'harvest') {
    const items = Array.isArray(data) ? data : [data];
    return items.map(item => ({
      title: item.title || `${item.crop_name?.toUpperCase() || 'Crop'} Harvesting Guide`,
      content: item.content || 'Harvest when crop reaches maturity.',
      indicators: item.indicators || ['Dry husks / mature coloring', 'Firm texture']
    }));
  }

  const items = Array.isArray(data) ? data : [data];
  return items.map(item => ({
    title: item.title || 'Crop Advisory',
    content: item.content || ''
  }));
};

const processCalendarData = (data, cropType) => {
  if (!Array.isArray(data)) return [];
  return data.map(week => ({
    week: week.week,
    title: week.task || week.activity || `Week ${week.week} Tasks`,
    description: week.watch_for || week.notes || 'Regular monitoring',
    tasks: week.inputs_needed ? week.inputs_needed.split(',').map(t => t.trim()) : []
  }));
};

export default function Advisory() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('my-crops');
  const [myCrops, setMyCrops] = useState([]);
  const [expandedCrop, setExpandedCrop] = useState(null);
  const [expandedCropTab, setExpandedCropTab] = useState('planting');
  const [advisories, setAdvisories] = useState({});
  const [plantingCalendars, setPlantingCalendars] = useState({});
  
  // Browse All state
  const [selectedCrop, setSelectedCrop] = useState('maize');
  const [selectedCounty, setSelectedCounty] = useState('all');
  const [selectedSeason, setSelectedSeason] = useState('all');
  const [allAdvisories, setAllAdvisories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const fetchingRef = useRef(false);

  useEffect(() => {
    // Wait for auth to load before fetching
    if (authLoading) return;

    loadMyCrops();
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'browse-all') {
      loadAllAdvisories();
    }
  }, [activeTab, selectedCrop, selectedCounty, selectedSeason]);

  const loadMyCrops = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError('');

    try {
      // Only try to get farms if authenticated
      if (!isAuthenticated) {
        setMyCrops([]);
        return;
      }

      // Get farmer's farms and crops
      let farms = [];
      try {
        const farmsResp = await farmersAPI.listFarms();
        farms = farmsResp.data?.data || [];
      } catch (farmError) {
        // Handle case where no farmer profile exists
        if (farmError?.status === 404) {
          console.log('[Advisory] No farmer profile found - user needs to create profile first');
        } else {
          console.log('[Advisory] No farms found, user may need to create profile:', farmError?.message);
        }
        farms = [];
      }
      
      const allCrops = [];
      for (const farm of farms) {
        const cropsResp = await farmersAPI.listCrops(farm.id);
        const crops = cropsResp.data?.data || [];
        
        crops.forEach(crop => {
          allCrops.push({
            ...crop,
            farm_name: farm.name,
            farm_id: farm.id
          });
        });
      }

      setMyCrops(allCrops);

      // Load advisories for each crop
      for (const crop of allCrops) {
        await loadCropAdvisories(crop);
        await loadPlantingCalendar(crop);
      }
    } catch (err) {
      console.error('[Advisory] Error:', err);
      // Don't show 401 errors as advisory errors
      if (err?.status !== 401) {
        setError('Failed to load crop data');
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const loadCropAdvisories = async (crop) => {
    if (!crop || !crop.crop_type) {
      console.warn('Crop type is undefined, using default:', crop);
      crop = { ...crop, crop_type: 'maize' };
    }

    try {
      // Get planting guide
      let plantingResp = { data: { data: [] } };
      try {
        plantingResp = await advisoryAPI.getCropAdvisory(crop.crop_type, { growth_stage: 'planting' });
      } catch (e) {
        console.warn('Failed to load planting guide:', e);
      }

      // Get nutrition advisory (enhanced with real data)
      let nutritionResp = { data: { data: [] } };
      try {
        nutritionResp = await advisoryAPI.getNutrition(crop.crop_type, crop.growth_stage || 'vegetative');
      } catch (e) {
        console.warn('Failed to load nutrition guide:', e);
      }
      
      // Get planting calendar (now uses FAO data)
      let calendarResp = { data: { data: [] } };
      try {
        calendarResp = await advisoryAPI.getCalendar(crop.crop_type);
      } catch (e) {
        console.warn('Failed to load planting calendar:', e);
      }
      
      // Get pest advisory (enhanced with disease risk)
      let pestResp = { data: { data: [] } };
      try {
        pestResp = await advisoryAPI.getPests(crop.crop_type);
      } catch (e) {
        console.warn('Failed to load pest guide:', e);
      }
      
      // Get harvest advisory
      let harvestResp = { data: { data: [] } };
      try {
        harvestResp = await advisoryAPI.getHarvest(crop.crop_type);
      } catch (e) {
        console.warn('Failed to load harvest guide:', e);
      }

      // Process and enhance the data
      const processedData = {
        planting: processAdvisoryData(plantingResp.data?.data || [], 'planting'),
        nutrition: processAdvisoryData(nutritionResp.data?.data || [], 'nutrition'),
        calendar: processCalendarData(calendarResp.data?.data || [], crop.crop_type),
        pests: processAdvisoryData(pestResp.data?.data || [], 'pests'),
        harvest: processAdvisoryData(harvestResp.data?.data || [], 'harvest')
      };

      setAdvisories(prev => ({
        ...prev,
        [crop.id]: processedData
      }));

      setExpandedCrop(crop.id);
      setExpandedCropTab('planting');
    } catch (err) {
      console.error(`Failed to load advisories for ${crop.crop_type}:`, err);
      setError('Failed to load advisories');
    }
  };

  const loadPlantingCalendar = async (crop) => {
    if (!crop.planting_date) return;

    try {
      const calendarResp = await advisoryAPI.getPlantingCalendar(crop.crop_type, {
        planting_date: crop.planting_date
      });

      setPlantingCalendars(prev => ({
        ...prev,
        [crop.id]: calendarResp.data?.data || []
      }));
    } catch (err) {
      console.error(`Failed to load calendar for ${crop.crop_type}:`, err);
    }
  };

  const loadAllAdvisories = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCrop !== 'all') params.crop = selectedCrop;
      if (selectedCounty !== 'all') params.county = selectedCounty;
      if (selectedSeason !== 'all') params.season = selectedSeason;

      const resp = await advisoryAPI.getAll(params);
      setAllAdvisories(Array.isArray(resp.data?.data) ? resp.data.data : []);
    } catch (err) {
      setError('Failed to load advisories');
    } finally {
      setLoading(false);
    }
  };

  const getGrowthProgress = (crop) => {
    if (!crop.planting_date) return { progress: 0, stage: 'Not planted' };
    
    const daysSincePlanting = differenceInDays(new Date(), new Date(crop.planting_date));
    const totalDays = crop.days_to_maturity || 120;
    const progress = Math.min(100, (daysSincePlanting / totalDays) * 100);
    
    let stage = 'Planting';
    if (progress > 80) stage = 'Harvesting';
    else if (progress > 60) stage = 'Fruiting';
    else if (progress > 40) stage = 'Flowering';
    else if (progress > 20) stage = 'Vegetative';
    else if (progress > 5) stage = 'Germination';
    
    return { progress, stage };
  };

  const PlantingCalendar = ({ calendar, plantingDate }) => {
    if (!calendar || calendar.length === 0) return null;

    const currentWeek = Math.floor(differenceInDays(new Date(), new Date(plantingDate)) / 7);

    return (
      <div className="space-y-2 mt-4">
        {calendar.map((week, i) => {
          const isCurrentWeek = i === currentWeek;
          
          return (
            <div
              key={i}
              className={`flex gap-3 p-3 rounded-xl border transition-all ${
                isCurrentWeek 
                  ? 'border-primary-400 bg-primary-50' 
                  : 'border-gray-100 bg-white'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                isCurrentWeek 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                W{week.week}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900">
                  {week.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {week.description}
                </p>
                {week.tasks && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {week.tasks.map((task, j) => (
                      <span key={j} className="text-xs bg-earth-100 text-earth-700 px-2 py-0.5 rounded-full">
                        {task}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {isCurrentWeek && (
                <div className="ml-auto">
                  <Badge variant="active">Now</Badge>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return <PageLoader message="Loading..." />;
  }

  if (loading) {
    return <PageLoader message="Loading advisory data..." />;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Crop Advisory</h1>
        <p className="text-gray-600 mt-1">Expert advice for your crops</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert type="error" message={error} dismissible onDismiss={() => setError('')} />
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('my-crops')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my-crops'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Crops
          </button>
          <button
            onClick={() => setActiveTab('browse-all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'browse-all'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Browse All
          </button>
        </nav>
      </div>

      {/* MY CROPS TAB */}
      {activeTab === 'my-crops' && (
        <div className="space-y-4">
          {myCrops.length === 0 ? (
            <Alert type="info" title="No crops found">
              <p className="mt-2">You haven't added any crops to your farms yet.</p>
              <Button className="mt-3" onClick={() => {/* Navigate to farm setup */}}>
                Add Crops
              </Button>
            </Alert>
          ) : (
            myCrops.map(crop => {
              const { progress, stage } = getGrowthProgress(crop);
              const cropAdvisories = advisories[crop.id] || {};
              const calendar = plantingCalendars[crop.id];
              const isExpanded = expandedCrop === crop.id;

              return (
                <Card key={crop.id} className="overflow-hidden">
                  {/* Crop Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setExpandedCrop(isExpanded ? null : crop.id);
                      setExpandedCropTab('planting');
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {getCropIcon(crop.crop_type) || <Leaf size={24} className="text-green-500" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 capitalize">
                            {crop.crop_type?.replace('_', ' ') || 'Unknown Crop'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {crop.farm_name} • {crop.area_acres || 1} acres
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{stage}</p>
                          <p className="text-xs text-gray-500">{progress.toFixed(0)}% complete</p>
                        </div>
                        <ChevronRight
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Latest Advisory Preview */}
                    {cropAdvisories.planting?.[0] && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <BookOpen className="w-4 h-4 inline mr-1" />
                          {cropAdvisories.planting[0].title}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      {/* Crop Sub-tabs */}
                      <div className="px-4 pt-4">
                        <div className="flex space-x-6 border-b border-gray-200">
                          {[
                            { id: 'planting', label: 'Planting', icon: Sprout },
                            { id: 'nutrition', label: 'Nutrition', icon: Droplets },
                            { id: 'pests', label: 'Pests', icon: Bug },
                            { id: 'harvest', label: 'Harvest', icon: Scissors }
                          ].map(tab => (
                            <button
                              key={tab.id}
                              onClick={() => setExpandedCropTab(tab.id)}
                              className={`pb-2 px-1 border-b-2 font-medium text-sm flex items-center gap-1 ${
                                expandedCropTab === tab.id
                                  ? 'border-primary-500 text-primary-600'
                                  : 'border-transparent text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              <tab.icon className="w-4 h-4" />
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tab Content */}
                      <div className="p-4">
                        {expandedCropTab === 'planting' && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Planting Guide</h4>
                            {cropAdvisories.planting?.length > 0 ? (
                              <div className="space-y-3">
                                {cropAdvisories.planting.map((advisory, i) => (
                                  <div key={i} className="p-3 border border-gray-200 rounded-lg">
                                    <h5 className="font-medium text-gray-900">{advisory.title}</h5>
                                    <p className="text-sm text-gray-600 mt-1">{advisory.content}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500">No planting advisories available</p>
                            )}
                            
                            <PlantingCalendar
                              calendar={calendar}
                              plantingDate={crop.planting_date}
                            />
                          </div>
                        )}

                        {expandedCropTab === 'nutrition' && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Nutrition Requirements</h4>
                            {cropAdvisories.nutrition?.length > 0 ? (
                              <div className="space-y-3">
                                {cropAdvisories.nutrition.map((advisory, i) => (
                                  <div key={i} className="p-3 border border-gray-200 rounded-lg">
                                    <h5 className="font-medium text-gray-900">{advisory.title}</h5>
                                    <p className="text-sm text-gray-600 mt-1">{advisory.content}</p>
                                    {advisory.npk && (
                                      <div className="mt-2 flex gap-4 text-sm">
                                        <span className="text-blue-600">N: {advisory.npk.n}</span>
                                        <span className="text-green-600">P: {advisory.npk.p}</span>
                                        <span className="text-orange-600">K: {advisory.npk.k}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500">No nutrition advisories available</p>
                            )}
                          </div>
                        )}

                        {expandedCropTab === 'pests' && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Pest & Disease Management</h4>
                            {cropAdvisories.pests?.length > 0 ? (
                              <div className="space-y-3">
                                {cropAdvisories.pests.map((advisory, i) => (
                                  <div key={i} className="p-3 border border-gray-200 rounded-lg">
                                    <h5 className="font-medium text-gray-900">{advisory.title}</h5>
                                    <p className="text-sm text-gray-600 mt-1">{advisory.content}</p>
                                    {advisory.symptoms && (
                                      <div className="mt-2">
                                        <p className="text-sm font-medium text-gray-700">Symptoms:</p>
                                        <p className="text-sm text-gray-600">{advisory.symptoms}</p>
                                      </div>
                                    )}
                                    {advisory.treatment && (
                                      <div className="mt-2">
                                        <p className="text-sm font-medium text-gray-700">Treatment:</p>
                                        <p className="text-sm text-gray-600">{advisory.treatment}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500">No pest advisories available</p>
                            )}
                          </div>
                        )}

                        {expandedCropTab === 'harvest' && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Harvesting Guide</h4>
                            {cropAdvisories.harvest?.length > 0 ? (
                              <div className="space-y-3">
                                {cropAdvisories.harvest.map((advisory, i) => (
                                  <div key={i} className="p-3 border border-gray-200 rounded-lg">
                                    <h5 className="font-medium text-gray-900">{advisory.title}</h5>
                                    <p className="text-sm text-gray-600 mt-1">{advisory.content}</p>
                                    {advisory.indicators && (
                                      <div className="mt-2">
                                        <p className="text-sm font-medium text-gray-700">Harvest Indicators:</p>
                                        <ul className="text-sm text-gray-600 list-disc list-inside">
                                          {advisory.indicators.map((indicator, j) => (
                                            <li key={j}>{indicator}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500">No harvest advisories available</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* BROWSE ALL TAB */}
      {activeTab === 'browse-all' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Crop Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Crop</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys({
                  maize: 'maize',
                  beans: 'beans', 
                  potatoes: 'potatoes',
                  tomatoes: 'tomatoes',
                  tea: 'tea',
                  wheat: 'wheat',
                  cabbage: 'cabbage',
                  kale: 'kale',
                  onions: 'onions'
                }).map((crop) => (
                  <button
                    key={crop}
                    onClick={() => setSelectedCrop(crop)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                      selectedCrop === crop
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {getCropIcon(crop)}
                      <span>{crop.charAt(0).toUpperCase() + crop.slice(1)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* County Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">County</label>
              <select
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Counties</option>
                <option value="nakuru">Nakuru</option>
                <option value="kiambu">Kiambu</option>
                <option value="kisumu">Kisumu</option>
                <option value="mombasa">Mombasa</option>
                {/* Add more counties as needed */}
              </select>
            </div>

            {/* Season Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Season</label>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Seasons</option>
                <option value="long-rains">Long Rains</option>
                <option value="short-rains">Short Rains</option>
                <option value="dry">Dry Season</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search advisories..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Advisories List */}
          <div className="space-y-4">
            {(!Array.isArray(allAdvisories) || allAdvisories.length === 0) ? (
              <Alert type="info">
                No advisories found matching your criteria.
              </Alert>
            ) : (
              allAdvisories
                .filter(advisory => 
                  !searchQuery || 
                  advisory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  advisory.content.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((advisory, index) => (
                  <Card key={index}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={advisory.advisory_type}>
                            {advisory.advisory_type}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            <span className="inline-flex items-center gap-1">
                              {getCropIcon(advisory.crop)} {advisory.crop}
                            </span>
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900">{advisory.title}</h3>
                        <p className="text-gray-600 mt-1">{advisory.content}</p>
                        {advisory.county && (
                          <p className="text-sm text-gray-500 mt-2">
                            County: {advisory.county}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
