import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line,
  PieChart, Pie, Cell, ResponsiveContainer, Area, AreaChart, Label
} from 'recharts';
import { 
  Users, Droplet, TrendingUp, Calendar, Search, 
  ArrowUp, ArrowDown, Filter, MapPin 
} from 'lucide-react';

const BloodDashboard = () => {
  const [stats, setStats] = useState({
    bloodInventory: {},
    bloodBanks: [],
    monthlyDonations: [],
    statistics: {
      totalDonors: 0,
      totalDonations: 0,
      totalBloodBanks: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [selectedBloodType, setSelectedBloodType] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [hiddenTypes, setHiddenTypes] = useState(new Set());

  const COLORS = {
    'A+': '#ef4444',
    'A-': '#f87171',
    'B+': '#84cc16',
    'B-': '#22c55e',
    'AB+': '#06b6d4',
    'AB-': '#0ea5e9',
    'O+': '#a855f7',
    'O-': '#d946ef'
  };

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Debounce search input -> searchTerm
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/dashboard/stats');
      const data = await response.json();
      if (data.success) {
        // Transform monthly data to include all months
        const transformedMonthlyData = transformMonthlyData(data.data.monthlyDonations);
        setStats({
          ...data.data,
          monthlyDonations: transformedMonthlyData
        });
        setLastUpdated(data.data.lastUpdated);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const transformMonthlyData = (monthlyData) => {
    // Create an object with all months initialized to 0 donations
    const fullYearData = MONTHS.map(month => ({
      month: month,
      donations: 0
    }));

    // Update the donations for months that have data
    monthlyData.forEach(dataPoint => {
      const monthIndex = MONTHS.findIndex(month => 
        month.toLowerCase().startsWith(dataPoint.month.toLowerCase())
      );
      if (monthIndex !== -1) {
        fullYearData[monthIndex].donations = dataPoint.donations;
      }
    });

    return fullYearData;
  };

  const totalUnits = useMemo(() => {
    if (!stats.bloodInventory) return 0;
    return Object.values(stats.bloodInventory)
      .reduce((sum, value) => sum + parseInt(value), 0);
  }, [stats.bloodInventory]);

  const inventoryData = useMemo(() => {
    return Object.entries(stats.bloodInventory || {}).map(([type, value]) => ({
      name: type,
      value: parseInt(value)
    }));
  }, [stats.bloodInventory]);

  const visibleInventoryData = useMemo(() => {
    return inventoryData.filter(item => !hiddenTypes.has(item.name));
  }, [inventoryData, hiddenTypes]);

  const toggleLegendItem = (type) => {
    setHiddenTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  };

  const sortedAndFilteredBanks = useMemo(() => {
    const term = (searchTerm || '').toLowerCase();
    const filtered = (stats.bloodBanks || []).filter(bank =>
      bank.name.toLowerCase().includes(term) && (!filterArea || bank.area === filterArea)
    );
    const sorted = [...filtered].sort((a, b) => {
      let comp = 0;
      if (sortBy === 'name') comp = a.name.localeCompare(b.name);
      else if (sortBy === 'area') comp = a.area.localeCompare(b.area);
      else if (sortBy === 'total_units') comp = (a.total_units || 0) - (b.total_units || 0);
      return sortDir === 'asc' ? comp : -comp;
    });
    return sorted;
  }, [stats.bloodBanks, searchTerm, filterArea, sortBy, sortDir]);

  const paginationMeta = useMemo(() => {
    const totalItems = sortedAndFilteredBanks.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * rowsPerPage;
    const endIndex = Math.min(totalItems, safeCurrentPage * rowsPerPage);
    const startItem = totalItems === 0 ? 0 : startIndex + 1;
    const paginated = sortedAndFilteredBanks.slice(startIndex, startIndex + rowsPerPage);
    return { totalItems, totalPages, safeCurrentPage, startItem, endIndex, paginated };
  }, [sortedAndFilteredBanks, rowsPerPage, currentPage]);

  const handleSort = (column) => {
    setCurrentPage(1);
    if (sortBy === column) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-lg rounded-lg border">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-red-600">
            {payload[0].value} donations
          </p>
        </div>
      );
    }
    return null;
  };

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`p-3 ${color} rounded-xl`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm text-gray-500 mt-1">{title}</p>
      </div>
    </div>
  );

  const BloodTypeCard = ({ type, amount, color }) => (
    <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: color }} />
          <span className="font-medium text-gray-900">{type}</span>
        </div>
        <span className="text-sm text-gray-500">{amount} units</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Blood Bank Dashboard</h1>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last Updated: {new Date(lastUpdated).toLocaleString()}
              </p>
            )}
          </div>
          <div></div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            icon={(props) => <Users {...props} className="h-6 w-6 text-red-600" />}
            title="Total Donors"
            value={stats.statistics?.totalDonors.toLocaleString()}
            trend={12}
            color="bg-red-100"
          />
          <StatCard 
            icon={(props) => <Droplet {...props} className="h-6 w-6 text-blue-600" />}
            title="Total Blood Units"
            value={totalUnits.toLocaleString()}
            trend={8}
            color="bg-blue-100"
          />
          <StatCard 
            icon={(props) => <TrendingUp {...props} className="h-6 w-6 text-green-600" />}
            title="Total Donations"
            value={stats.statistics?.totalDonations.toLocaleString()}
            trend={15}
            color="bg-green-100"
          />
          <StatCard 
            icon={(props) => <Calendar {...props} className="h-6 w-6 text-purple-600" />}
            title="Active Blood Banks"
            value={stats.statistics?.totalBloodBanks.toLocaleString()}
            trend={5}
            color="bg-purple-100"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Blood Type Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Blood Type Distribution</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {Object.entries(stats.bloodInventory || {}).map(([type, amount]) => (
                <BloodTypeCard 
                  key={type}
                  type={type}
                  amount={amount}
                  color={COLORS[type]}
                />
              ))}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={visibleInventoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                >
                  {visibleInventoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                  ))}
                  <Label
                    value={`${totalUnits} units`}
                    position="center"
                    style={{ fontSize: 12, fill: '#374151' }}
                  />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex flex-wrap gap-3">
              {inventoryData.map(item => {
                const isHidden = hiddenTypes.has(item.name);
                return (
                  <button
                    key={item.name}
                    onClick={() => toggleLegendItem(item.name)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm ${isHidden ? 'opacity-50' : ''}`}
                    aria-pressed={!isHidden}
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[item.name] }} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Monthly Donations Trend */}
          <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Monthly Donations</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.monthlyDonations}>
              <defs>
                <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tickFormatter={(value) => value.substring(0, 3)}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="donations" 
                stroke="#ef4444" 
                fillOpacity={1}
                fill="url(#colorDonations)"
                name="Donations"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

        {/* Blood Banks Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Blood Banks</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search blood banks..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={searchInput}
                    onChange={(e) => { setSearchInput(e.target.value); setCurrentPage(1); }}
                  />
                </div>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  onChange={(e) => { setFilterArea(e.target.value); setCurrentPage(1); }}
                >
                  <option value="">All Areas</option>
                  {Array.from(new Set(stats.bloodBanks?.map(bank => bank.area))).map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Rows:</span>
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort('name')}
                  >
                    Blood Bank {sortBy === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort('area')}
                  >
                    Area {sortBy === 'area' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort('total_units')}
                  >
                    Total Units {sortBy === 'total_units' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginationMeta.paginated.length === 0 ? (
                  <tr>
                    <td className="px-6 py-8 text-center text-gray-500" colSpan={4}>
                      No blood banks match your filters.
                    </td>
                  </tr>
                ) : (
                  paginationMeta.paginated.map((bank) => (
                    <tr key={bank.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="font-medium text-gray-900">{bank.name}</div>
                            <div className="text-sm text-gray-500">{bank.operating_hours}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {bank.area}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{bank.total_units}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {paginationMeta.startItem}-{paginationMeta.endIndex} of {paginationMeta.totalItems}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-2 text-sm border rounded-lg disabled:opacity-50"
                disabled={paginationMeta.safeCurrentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                Previous
              </button>
              {Array.from({ length: paginationMeta.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`px-3 py-2 text-sm border rounded-lg ${page === paginationMeta.safeCurrentPage ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700'}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="px-3 py-2 text-sm border rounded-lg disabled:opacity-50"
                disabled={paginationMeta.safeCurrentPage === paginationMeta.totalPages}
                onClick={() => setCurrentPage(prev => Math.min(paginationMeta.totalPages, prev + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodDashboard;