import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Users, 
  TrendingUp, 
  Clock, 
  BarChart3,
  Bot,
  User,
  Calendar,
  Filter,
  Download,
  Shield,
  MapPin,
  Heart,
  Droplet,
  RefreshCw
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminDashboardLayout';
import apiClient from '../../api/client';

const ChatbotAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    stats: [],
    intents: [],
    totalConversations: 0,
    uniqueUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState('30'); // days
  const [selectedIntent, setSelectedIntent] = useState('all');

  useEffect(() => {
    fetchAnalytics();
  }, [timeFilter]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/chatbot/analytics?days=${timeFilter}`);
      
      if (response.data.success) {
        setAnalytics(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error fetching chatbot analytics:', error);
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getIntentColor = (intent) => {
    const colors = {
      eligibility: 'bg-blue-100 text-blue-800',
      appointment: 'bg-green-100 text-green-800',
      location: 'bg-purple-100 text-purple-800',
      preparation: 'bg-yellow-100 text-yellow-800',
      after_donation: 'bg-orange-100 text-orange-800',
      blood_types: 'bg-red-100 text-red-800',
      safety: 'bg-gray-100 text-gray-800',
      general: 'bg-indigo-100 text-indigo-800'
    };
    return colors[intent] || 'bg-gray-100 text-gray-800';
  };

  const getIntentIcon = (intent) => {
    const icons = {
      eligibility: <Shield className="w-4 h-4" />,
      appointment: <Calendar className="w-4 h-4" />,
      location: <MapPin className="w-4 h-4" />,
      preparation: <Heart className="w-4 h-4" />,
      after_donation: <Clock className="w-4 h-4" />,
      blood_types: <Droplet className="w-4 h-4" />,
      safety: <Shield className="w-4 h-4" />,
      general: <MessageCircle className="w-4 h-4" />
    };
    return icons[intent] || <MessageCircle className="w-4 h-4" />;
  };

  const formatIntentName = (intent) => {
    return intent.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredStats = selectedIntent === 'all' 
    ? analytics.stats 
    : analytics.stats.filter(stat => stat.intent === selectedIntent);

  const totalByIntent = analytics.intents.reduce((acc, intent) => acc + intent.count, 0);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-red-600" />
            <span className="text-gray-600">Loading chatbot analytics...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">Error loading analytics</span>
          </div>
          <p className="text-red-600 mt-1">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chatbot Analytics</h1>
            <p className="text-gray-600 mt-1">Monitor chatbot performance and user interactions</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Conversations</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalConversations}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Users</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.uniqueUsers}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Conversations/User</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.uniqueUsers > 0 ? Math.round(analytics.totalConversations / analytics.uniqueUsers) : 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Most Common Intent</p>
                <p className="text-lg font-bold text-gray-900">
                  {analytics.intents.length > 0 ? formatIntentName(analytics.intents[0].intent) : 'N/A'}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Intent Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Intent Distribution</h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedIntent}
                onChange={(e) => setSelectedIntent(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              >
                <option value="all">All Intents</option>
                {analytics.intents.map((intent) => (
                  <option key={intent.intent} value={intent.intent}>
                    {formatIntentName(intent.intent)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {analytics.intents.map((intent) => {
              const percentage = totalByIntent > 0 ? Math.round((intent.count / totalByIntent) * 100) : 0;
              return (
                <div key={intent.intent} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getIntentColor(intent)}`}>
                      {getIntentIcon(intent.intent)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{formatIntentName(intent.intent)}</p>
                      <p className="text-sm text-gray-600">{intent.count} conversations</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Activity Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Daily Activity</h2>
          
          {filteredStats.length > 0 ? (
            <div className="space-y-3">
              {filteredStats.slice(0, 10).map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(stat.date).toLocaleDateString()}
                    </span>
                    {selectedIntent === 'all' && (
                      <span className={`px-2 py-1 rounded-full text-xs ${getIntentColor(stat.intent)}`}>
                        {formatIntentName(stat.intent)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{stat.count} conversations</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full"
                        style={{ 
                          width: `${Math.min(100, (stat.count / Math.max(...filteredStats.map(s => s.count))) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No activity data available for the selected period</p>
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-red-100">
              <h3 className="font-medium text-gray-900 mb-2">Most Popular Topic</h3>
              <p className="text-sm text-gray-600">
                {analytics.intents.length > 0 
                  ? `${formatIntentName(analytics.intents[0].intent)} with ${analytics.intents[0].count} conversations`
                  : 'No data available'
                }
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-red-100">
              <h3 className="font-medium text-gray-900 mb-2">User Engagement</h3>
              <p className="text-sm text-gray-600">
                {analytics.uniqueUsers > 0 
                  ? `Average of ${Math.round(analytics.totalConversations / analytics.uniqueUsers)} conversations per user`
                  : 'No user data available'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ChatbotAnalytics;
