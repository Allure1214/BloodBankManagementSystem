import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  ExternalLink, 
  AlertCircle, 
  Filter,
  Heart,
  Users,
  Globe,
  ArrowRight,
  Star
} from 'lucide-react';

const BloodBankDirectory = () => {
  const [bloodBanks, setBloodBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [areas, setAreas] = useState([]);
  const [entriesPerPage, setEntriesPerPage] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchBloodBanks();
    fetchAreas();
  }, []);

  useEffect(() => {
    // Reset to first page when changing entries per page
    setCurrentPage(1);
  }, [entriesPerPage]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchBloodBanks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/blood-banks/all');
      const data = await response.json();
      if (data.success) {
        setBloodBanks(data.data);
      } else {
        setError('Failed to fetch blood banks');
      }
    } catch (error) {
      setError('Failed to load blood banks');
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/blood-banks/areas');
      const data = await response.json();
      if (data.success) {
        setAreas(data.data);
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  };

  const filteredBloodBanks = bloodBanks.filter(bank => {
    const matchesSearch = bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        bank.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        bank.contact.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = !selectedArea || bank.area === selectedArea;
    return matchesSearch && matchesArea;
  });

  const totalPages = Math.ceil(filteredBloodBanks.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentEntries = filteredBloodBanks.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <Building2 className="w-8 h-8 text-red-600 animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Blood Banks</h3>
          <p className="text-gray-600">Please wait while we fetch the directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
            Blood Bank Directory
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Find blood banks near you and check real-time blood availability. Our comprehensive directory includes 
            operating hours, contact information, and current stock levels for all registered facilities.
          </p>
        </div>


        {/* Search and Filter Controls */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Search Bar */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Search className="h-4 w-4 text-red-500" />
                Search Blood Banks
              </label>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search by name, phone, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 group-hover:border-gray-300"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              </div>
            </div>

            {/* Area Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500" />
                Filter by District
              </label>
              <div className="relative group">
                <select
                  value={selectedArea}
                  onChange={(e) => {
                    setSelectedArea(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-4 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 group-hover:border-gray-300 appearance-none bg-white"
                >
                  <option value="">All Districts</option>
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
          </div>

          {/* Entries per page and Results Counter */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-gray-100">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                className="border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
              >
                {[6, 12, 18, 24].map(value => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
              <span className="text-sm font-medium text-gray-700">entries per page</span>
            </div>
            
            <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
              Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-gray-900">{Math.min(endIndex, filteredBloodBanks.length)}</span> of{' '}
              <span className="font-semibold text-gray-900">{filteredBloodBanks.length}</span> blood banks
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 rounded-xl">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Blood Banks Grid */}
        {filteredBloodBanks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {currentEntries.map((bank, index) => (
              <div 
                key={bank.id} 
                className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-gray-100 hover:border-red-200"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <h3 className="text-xl font-bold text-gray-900 line-clamp-2 min-h-[3.5rem] group-hover:text-red-600 transition-colors">
                          {bank.name}
                        </h3>
                      </div>
                      {bank.rating && (
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < bank.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                          <span className="text-sm text-gray-500 ml-2">({bank.rating})</span>
                        </div>
                      )}
                    </div>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(bank.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-sm bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-all duration-200"
                    >
                      <MapPin className="w-4 h-4" />
                      <span className="hidden sm:inline">Map</span>
                    </a>
                  </div>
                  
                  {/* Information */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                      <span className="text-gray-700 text-sm font-medium">{bank.address}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <a 
                        href={`tel:${bank.contact}`}
                        className="text-gray-700 text-sm font-medium hover:text-red-600 transition-colors"
                      >
                        {bank.contact}
                      </a>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Clock className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <span className="text-gray-700 text-sm font-medium">{bank.operating_hours}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => window.location.href = `/specifyavailability?bank=${bank.id}`}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg font-semibold flex items-center justify-center gap-2 group-hover:shadow-xl"
                  >
                    Check Availability
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl p-16 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Blood Banks Found</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              No blood banks match your search criteria. Try adjusting your filters or search terms.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedArea('');
              }}
              className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {filteredBloodBanks.length > entriesPerPage && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`min-w-[44px] px-4 py-3 border-2 rounded-xl transition-all duration-200 font-medium ${
                      currentPage === page
                        ? 'bg-red-600 text-white border-red-600 shadow-lg'
                        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
                <span className="font-semibold text-gray-900">{totalPages}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BloodBankDirectory;