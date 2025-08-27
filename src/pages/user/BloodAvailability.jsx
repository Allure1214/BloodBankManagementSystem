import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Droplet, 
  Clock, 
  Phone, 
  Info, 
  ExternalLink, 
  AlertCircle,
  Heart,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';

const BloodSearch = () => {
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedBloodType, setSelectedBloodType] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState([]);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/blood-banks/areas');
      const data = await response.json();
      
      if (data.success) {
        setAreas(data.data);
      } else {
        setError('Failed to fetch areas');
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
      setError('Failed to fetch areas');
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    setHasSearched(true);
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/blood-banks/availability?area=${encodeURIComponent(selectedArea)}${
          selectedBloodType ? `&bloodType=${encodeURIComponent(selectedBloodType)}` : ''
        }`
      );
      
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.data);
      } else {
        setError(data.message || 'Failed to fetch results');
      }
    } catch (error) {
      console.error('Search failed:', error);
      setError('Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUnitStatusColor = (units) => {
    if (units <= 10) return 'bg-red-50 text-red-700 border-red-200 shadow-sm';
    if (units <= 30) return 'bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm';
    return 'bg-green-50 text-green-700 border-green-200 shadow-sm';
  };

  const getUnitStatusIcon = (units) => {
    if (units <= 10) return <AlertCircle className="h-4 w-4" />;
    if (units <= 30) return <TrendingUp className="h-4 w-4" />;
    return <Shield className="h-4 w-4" />;
  };

  const getUnitStatusText = (units) => {
    if (units <= 10) return 'Critical';
    if (units <= 30) return 'Low';
    return 'Available';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
            Blood Availability Search
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Find real-time blood availability across blood banks in your area. 
            Get instant access to current stock levels and make informed decisions for emergency needs.
          </p>
        </div>

        {/* Main Search Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 rounded-xl">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Search Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500" />
                Select District
              </label>
              <div className="relative group">
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 group-hover:border-gray-300 appearance-none bg-white"
                >
                  <option value="">Choose a district in Johor Bahru</option>
                  {areas.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Droplet className="h-4 w-4 text-red-500" />
                Blood Type (Optional)
              </label>
              <div className="relative group">
                <select
                  value={selectedBloodType}
                  onChange={(e) => setSelectedBloodType(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 group-hover:border-gray-300 appearance-none bg-white"
                >
                  <option value="">All Blood Types</option>
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <Droplet className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={!selectedArea || loading}
            className={`w-full flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl ${
              loading || !selectedArea ? 'opacity-50 cursor-not-allowed transform-none' : ''
            }`}
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent" />
                <span>Searching blood banks...</span>
              </div>
            ) : (
              <>
                <Search className="mr-3 h-6 w-6" />
                Search Blood Availability
              </>
            )}
          </button>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="animate-fade-in">
            {loading ? (
              <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
                  <Zap className="w-8 h-8 text-red-600 animate-pulse" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Searching Blood Banks</h3>
                <p className="text-gray-600">Please wait while we fetch the latest availability data...</p>
              </div>
            ) : searchResults ? (
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Search Results
                    </h3>
                    <p className="text-gray-600">
                      {selectedArea} • {selectedBloodType || 'All Blood Types'}
                    </p>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600">{searchResults.length}</div>
                      <div className="text-sm text-gray-500">
                        blood bank{searchResults.length !== 1 ? 's' : ''} found
                      </div>
                    </div>
                  )}
                </div>

                {searchResults.length > 0 ? (
                  <div className="space-y-6">
                    {searchResults.map((bank, index) => (
                      <div
                        key={bank.id}
                        className="border-2 border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-red-200 transition-all duration-300 transform hover:-translate-y-1"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="space-y-6">
                          {/* Header */}
                          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <h4 className="text-xl font-bold text-gray-900">
                                  {bank.name}
                                </h4>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="flex items-center text-gray-600 bg-gray-50 rounded-lg p-3">
                                  <MapPin className="h-4 w-4 mr-3 text-red-500 flex-shrink-0" />
                                  <span className="text-sm font-medium">{bank.address}</span>
                                </div>
                                <div className="flex items-center text-gray-600 bg-gray-50 rounded-lg p-3">
                                  <Phone className="h-4 w-4 mr-3 text-red-500 flex-shrink-0" />
                                  <span className="text-sm font-medium">{bank.contact}</span>
                                </div>
                                <div className="flex items-center text-gray-600 bg-gray-50 rounded-lg p-3">
                                  <Clock className="h-4 w-4 mr-3 text-red-500 flex-shrink-0" />
                                  <span className="text-sm font-medium">{bank.operatingHours}</span>
                                </div>
                              </div>
                            </div>
                            <a
                              href={`https://maps.google.com/?q=${encodeURIComponent(bank.name)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-sm bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors duration-200"
                            >
                              <ExternalLink className="h-4 w-4" />
                              View on Maps
                            </a>
                          </div>

                          {/* Blood Types */}
                          <div className="border-t border-gray-100 pt-6">
                            <div className="flex items-center gap-2 mb-6">
                              <Info className="h-5 w-5 text-gray-400" />
                              <span className="text-sm font-semibold text-gray-700">
                                Current Blood Type Availability
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              {Object.entries(bank.inventory).map(([type, info]) => (
                                <div
                                  key={type}
                                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                                    selectedBloodType === type 
                                      ? 'ring-2 ring-red-500 ring-opacity-50 scale-105' 
                                      : 'hover:scale-105'
                                  } ${getUnitStatusColor(info.unitsAvailable)}`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-lg font-bold">{type}</div>
                                    {getUnitStatusIcon(info.unitsAvailable)}
                                  </div>
                                  <div className="text-sm font-semibold mb-1">
                                    {info.unitsAvailable} units
                                  </div>
                                  <div className="text-xs text-gray-600 mb-2">
                                    {getUnitStatusText(info.unitsAvailable)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Updated: {formatDate(info.lastUpdated)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-2xl">
                    <Droplet className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      No Blood Banks Found
                    </h4>
                    <p className="text-gray-600 max-w-md mx-auto">
                      We couldn't find any blood banks in the selected area. 
                      Try selecting a different district or contact us for assistance.
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Quick Stats Section */}
        {!hasSearched && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Data</h3>
              <p className="text-gray-600 text-sm">Get instant access to current blood stock levels</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Location Based</h3>
              <p className="text-gray-600 text-sm">Find blood banks near your location</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Verified Sources</h3>
              <p className="text-gray-600 text-sm">All data comes from verified blood banks</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BloodSearch;