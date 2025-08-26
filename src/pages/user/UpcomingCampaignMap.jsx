import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, Clock, Building, Navigation, Calendar, Users, ChevronRight, AlertCircle } from 'lucide-react';
import L from 'leaflet';
import { useAuth } from '../../context/AuthContext';
import CampaignReservationModal from '../../components/modules/campaign/CampaignReservation';
import 'leaflet/dist/leaflet.css';
import { calculateDistance } from '../../utils/distance';

// Custom marker icons configuration
const createCustomIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41]
});

const userIcon = createCustomIcon('red');
const campaignIcon = createCustomIcon('blue');
const highlightedIcon = createCustomIcon('gold');

function MapFocus({ position, trigger }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 15, { duration: 2 });
  }, [position, map, trigger]);
  return null;
}

const CampaignMap = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([3.1390, 101.6869]);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const watchIdRef = useRef(null);
  const lastErrorCodeRef = useRef(null);
  const lastWatchErrorAtRef = useRef(0);
  const [hoveredCampaignId, setHoveredCampaignId] = useState(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const mapAreaRef = useRef(null);
  const listAreaRef = useRef(null);
  const [panelHeight, setPanelHeight] = useState(560);

  useEffect(() => {
    initializeLocation();
    fetchCampaigns();
  }, []);

  useEffect(() => {
    startWatchingLocation();
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation && navigator.geolocation.clearWatch) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const updateHeights = () => {
      const bottomPadding = 24; // leave a little space at page bottom
      const mapTop = mapAreaRef.current ? mapAreaRef.current.getBoundingClientRect().top : 0;
      const available = Math.max(320, Math.floor(window.innerHeight - mapTop - bottomPadding));
      setPanelHeight(available);
    };
    updateHeights();
    window.addEventListener('resize', updateHeights);
    return () => window.removeEventListener('resize', updateHeights);
  }, []);

  const getGeoErrorMessage = (geoError) => {
    if (!geoError) return 'Unable to get your location.';
    switch (geoError.code) {
      case geoError.PERMISSION_DENIED:
        return 'Location permission denied. Please enable it in your browser settings.';
      case geoError.POSITION_UNAVAILABLE:
        return 'Location information is unavailable. Check GPS or network.';
      case geoError.TIMEOUT:
        return 'Getting your location timed out. Try again near a window or with Wi‑Fi.';
      default:
        return 'Unable to get your location.';
    }
  };

  const checkPermission = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        return status.state; // 'granted' | 'prompt' | 'denied'
      }
    } catch (e) {
      // ignore
    }
    return 'prompt';
  };

  const initializeLocation = async () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    const perm = await checkPermission();
    if (perm === 'denied') {
      setError('Location permission is denied. Enable it in browser/site settings.');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    };

    const onSuccess = (position) => {
      const { latitude, longitude } = position.coords;
      setUserLocation([latitude, longitude]);
      setMapCenter([latitude, longitude]);
      setError('');
      lastErrorCodeRef.current = null;
    };

    const onError = (geoError) => {
      console.error('Location error:', geoError);
      // Retry once with low-accuracy and longer timeout for TIMEOUT or POSITION_UNAVAILABLE
      if (geoError && (geoError.code === geoError.TIMEOUT || geoError.code === geoError.POSITION_UNAVAILABLE)) {
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          (fallbackErr) => {
            const message = getGeoErrorMessage(fallbackErr);
            if (lastErrorCodeRef.current !== fallbackErr.code) {
              setError(message);
              lastErrorCodeRef.current = fallbackErr.code;
            }
          },
          { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
        );
        return;
      }
      const message = getGeoErrorMessage(geoError);
      if (lastErrorCodeRef.current !== geoError?.code) {
        setError(message);
        lastErrorCodeRef.current = geoError?.code || 'unknown';
      }
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
  };

  const startWatchingLocation = () => {
    if (!('geolocation' in navigator)) return;
    const options = {
      enableHighAccuracy: true,
      // Avoid setting timeout for watch to prevent frequent timeout errors
      maximumAge: 10000,
    };
    try {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          if (accuracy && accuracy > 2000) return;
          setUserLocation((prev) => {
            if (!prev) return [latitude, longitude];
            const [prevLat, prevLng] = prev;
            const movedEnough = Math.hypot(latitude - prevLat, longitude - prevLng) > 0.0005;
            return movedEnough ? [latitude, longitude] : prev;
          });
        },
        (geoError) => {
          const now = Date.now();
          if (now - lastWatchErrorAtRef.current < 10000) return; // throttle repeated errors
          lastWatchErrorAtRef.current = now;
          if (geoError && geoError.code === geoError.TIMEOUT) return; // ignore benign timeouts
          console.warn('watchPosition error:', geoError);
        },
        options
      );
      watchIdRef.current = id;
    } catch (e) {
      console.warn('Failed to start geolocation watcher:', e);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/campaigns/upcoming');
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.data.filter(c => c.latitude && c.longitude));
      } else {
        throw new Error(data.message || 'Failed to fetch campaigns');
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setError('Failed to load campaigns. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleReservationClick = (campaign) => {
    setSelectedCampaign(campaign);
    setIsReservationModalOpen(true);
  };

  const CampaignSessionCard = ({ session }) => (
    <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
      <div className="flex items-center">
        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
        <span className="text-sm">{session.date}</span>
      </div>
      <span className="text-sm font-medium text-gray-700">{session.time}</span>
    </div>
  );

  const CampaignCard = ({ campaign, isSelected, onSelect }) => {
    const sessionCount = campaign.sessions?.length || 0;
    const distanceKm = userLocation 
      ? calculateDistance(userLocation[0], userLocation[1], campaign.latitude, campaign.longitude)
      : null;
    
    return (
      <div
        className={`p-4 rounded-lg transition-all duration-300 cursor-pointer ${
          isSelected 
            ? 'bg-red-50 border-2 border-red-500 shadow-lg' 
            : 'bg-white border border-gray-200 hover:border-red-300 hover:shadow'
        }`}
        onClick={() => onSelect(campaign)}
        onMouseEnter={() => setHoveredCampaignId(campaign.id)}
        onMouseLeave={() => setHoveredCampaignId(null)}
      >
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-gray-900">{campaign.location}</h3>
            <div className="flex items-center space-x-2">
              {distanceKm !== null && (
                <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full flex items-center">
                  <Navigation className="w-3 h-3 mr-1" /> {distanceKm} km
                </span>
              )}
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                {sessionCount} {sessionCount === 1 ? 'Session' : 'Sessions'}
              </span>
            </div>
          </div>

          <div className="flex items-center text-gray-600">
            <Building className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-sm font-medium">{campaign.organizer}</span>
          </div>

          <div className="flex items-start text-gray-600">
            <MapPin className="w-4 h-4 mt-1 mr-2 flex-shrink-0" />
            <span className="text-sm">{campaign.address}</span>
          </div>

          {campaign.sessions?.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-sm font-medium text-gray-700">Next Available Sessions:</div>
              <div className="space-y-2">
                {campaign.sessions.slice(0, 3).map((session, idx) => (
                  <CampaignSessionCard key={idx} session={session} />
                ))}
                {campaign.sessions.length > 3 && (
                  <div className="text-sm text-gray-500 text-center">
                    +{campaign.sessions.length - 3} more sessions
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleReservationClick(campaign);
            }}
            className="mt-4 w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Make Reservation</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 relative">
      {/* Set explicit z-index for modals */}
      {isReservationModalOpen && selectedCampaign && (
        <div className="fixed inset-0" style={{ zIndex: 9999 }}>
          <CampaignReservationModal
            campaign={selectedCampaign}
            isOpen={isReservationModalOpen}
            onClose={() => {
              setIsReservationModalOpen(false);
              setSelectedDate(null);
            }}
          />
        </div>
      )}
      {error && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Campaign Locations</h2>
            <button
              onClick={initializeLocation}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Navigation className="w-4 h-4 mr-2" />
              <span>Update Location</span>
            </button>
          </div>

          <div ref={mapAreaRef} style={{ height: panelHeight }}>
            <MapContainer
              center={mapCenter}
              zoom={11}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {userLocation && (
                <Marker position={userLocation} icon={userIcon}>
                  <Popup>Your Location</Popup>
                </Marker>
              )}
              {campaigns.map((campaign) => (
                <Marker
                  key={campaign.id}
                  position={[campaign.latitude, campaign.longitude]}
                  icon={
                    selectedCampaign?.id === campaign.id || hoveredCampaignId === campaign.id
                      ? highlightedIcon
                      : campaignIcon
                  }
                  eventHandlers={{
                    click: () => setSelectedCampaign(campaign),
                    mouseover: () => setHoveredCampaignId(campaign.id),
                    mouseout: () => setHoveredCampaignId(null),
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-semibold text-gray-900">{campaign.location}</h3>
                      <p className="text-sm text-gray-600 mt-1">{campaign.address}</p>
                      {campaign.sessions?.[0] && (
                        <div className="mt-2 text-sm border-t pt-2">
                          <p className="font-medium text-gray-700">Next session:</p>
                          <p>{campaign.sessions[0].date}</p>
                          <p>{campaign.sessions[0].time}</p>
                        </div>
                      )}
                      <button
                        onClick={() => handleReservationClick(campaign)}
                        className="mt-2 w-full px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        Make Reservation
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
              <MapFocus
                position={selectedCampaign ? [selectedCampaign.latitude, selectedCampaign.longitude] : userLocation}
                trigger={recenterTrigger}
              />
            </MapContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Upcoming Campaigns</h2>
              <div className="text-sm text-gray-600">
                <p>Total: {campaigns.length} campaigns</p>
              </div>
            </div>
          </div>

          <div ref={listAreaRef} className="p-4 overflow-y-auto space-y-4" style={{ height: panelHeight }}>
            {campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Active Campaigns
                </h3>
                <p className="text-gray-600">
                  There are currently no blood donation campaigns scheduled in your area.
                </p>
              </div>
            ) : (
              campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  isSelected={selectedCampaign?.id === campaign.id}
                  onSelect={setSelectedCampaign}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignMap;