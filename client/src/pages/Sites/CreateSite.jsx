import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { FaSearch, FaMapMarkerAlt, FaUser, FaCalendar, FaGlobe, FaCity, FaBuilding, FaFileAlt, FaLocationArrow, FaTimes } from 'react-icons/fa';
import { FiArrowLeft } from 'react-icons/fi';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon
const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function CreateSite() {
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    city: '',
    description: '',
    exactAddress: '',
    startDate: new Date().toISOString().split('T')[0],
    coordinates: { lat: 20.5937, lng: 78.9629 },
    assignedEngineers: [],
    type: 'Construction Site',
    status: 'Active',
    progress: 0
  });

  const [loading, setLoading] = useState(false);
  const [engineers, setEngineers] = useState([]);
  const [filteredEngineers, setFilteredEngineers] = useState([]);
  const [engineerSearch, setEngineerSearch] = useState('');
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [citySearch, setCitySearch] = useState('');
  const [showEngineerDropdown, setShowEngineerDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [addressSearch, setAddressSearch] = useState('');
  const [geocodingResults, setGeocodingResults] = useState([]);
  const [showAddressResults, setShowAddressResults] = useState(false);
  const [isFormHovered, setIsFormHovered] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [siteTypes] = useState([
    'Construction Site', 
    'Renovation Project', 
    'Infrastructure', 
    'Residential', 
    'Commercial', 
    'Industrial', 
    'Civil', 
    'Other'
  ]);
  
  const engineerDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);
  const addressDropdownRef = useRef(null);
  const countryDropdownRef = useRef(null);
  const navigate = useNavigate();

  // Load engineers
  useEffect(() => {
    api.get('/auth/users?role=Engineer')
      .then(res => {
        setEngineers(res.data || []);
        setFilteredEngineers(res.data || []);
      })
      .catch(() => toast.error('Failed to load engineers'));
  }, []);

  // Load countries from REST Countries API
  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name,cca2')
      .then(res => res.json())
      .then(data => {
        const countryList = data
          .map(country => country.name.common)
          .sort();
        setCountries(countryList);
        setFilteredCountries(countryList);
      })
      .catch(err => {
        console.error('Failed to load countries:', err);
        const defaultCountries = [
          'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
          'Germany', 'France', 'Japan', 'China', 'Brazil', 'Russia'
        ];
        setCountries(defaultCountries);
        setFilteredCountries(defaultCountries);
      });
  }, []);

  // Load cities based on selected country - SIMPLIFIED VERSION
  useEffect(() => {
    if (formData.country) {
      setMapLoading(true);
      fetch(`https://nominatim.openstreetmap.org/search?country=${encodeURIComponent(formData.country)}&format=json&featuretype=city&limit=30`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch cities');
          return res.json();
        })
        .then(data => {
          console.log('Cities data received:', data.length, 'items');
          
          const citySet = new Set();
          data.forEach(place => {
            if (place.name && !place.name.match(/^\d/)) {
              citySet.add(place.name);
            }
          });
          
          const cityArray = Array.from(citySet).sort();
          console.log('Cities found:', cityArray);
          
          setCities(cityArray);
          setFilteredCities(cityArray);
          setMapLoading(false);
        })
        .catch(err => {
          console.error('Failed to load cities:', err);
          const fallbackCities = {
            'India': ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Ahmedabad', 'Pune', 'Jaipur', 'Lucknow'],
            'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'],
            'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Glasgow', 'Edinburgh', 'Bristol', 'Leeds', 'Sheffield', 'Cardiff'],
            'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Winnipeg', 'Quebec City', 'Hamilton', 'Halifax']
          };
          
          const fallback = fallbackCities[formData.country] || [];
          setCities(fallback);
          setFilteredCities(fallback);
          setMapLoading(false);
        });
    } else {
      setCities([]);
      setFilteredCities([]);
    }
  }, [formData.country]);

  // Filter engineers based on search
  useEffect(() => {
    if (engineerSearch) {
      const filtered = engineers.filter(engineer =>
        engineer.name.toLowerCase().includes(engineerSearch.toLowerCase()) ||
        engineer.email.toLowerCase().includes(engineerSearch.toLowerCase())
      );
      setFilteredEngineers(filtered);
    } else {
      setFilteredEngineers(engineers);
    }
  }, [engineerSearch, engineers]);

  // Filter cities based on search
  useEffect(() => {
    if (citySearch && cities.length > 0) {
      const filtered = cities.filter(city =>
        city.toLowerCase().includes(citySearch.toLowerCase())
      );
      setFilteredCities(filtered);
    } else if (!citySearch && cities.length > 0) {
      setFilteredCities(cities);
    }
  }, [citySearch, cities]);

  // Filter countries based on search
  useEffect(() => {
    if (countrySearch && countries.length > 0) {
      const filtered = countries.filter(country =>
        country.toLowerCase().includes(countrySearch.toLowerCase())
      );
      setFilteredCountries(filtered);
    } else if (!countrySearch && countries.length > 0) {
      setFilteredCountries(countries);
    }
  }, [countrySearch, countries]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (engineerDropdownRef.current && !engineerDropdownRef.current.contains(event.target)) {
        setShowEngineerDropdown(false);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
        setShowCityDropdown(false);
      }
      if (addressDropdownRef.current && !addressDropdownRef.current.contains(event.target)) {
        setShowAddressResults(false);
      }
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Geocode address search
  const handleAddressSearch = async (query) => {
    if (!query.trim() || query.length < 3) {
      setGeocodingResults([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`
      );
      const data = await response.json();
      setGeocodingResults(data);
      setShowAddressResults(true);
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Failed to search address');
    }
  };

  // Select address from geocoding results
  const handleSelectAddress = (result) => {
    setFormData(prev => ({
      ...prev,
      exactAddress: result.display_name,
      coordinates: { lat: parseFloat(result.lat), lng: parseFloat(result.lon) },
      city: result.address.city || result.address.town || result.address.village || '',
      country: result.address.country || ''
    }));
    setAddressSearch(result.display_name);
    setShowAddressResults(false);
    setGeocodingResults([]);
  };

  // Handle country selection
  const handleSelectCountry = (country) => {
    setFormData(prev => ({ 
      ...prev, 
      country,
      city: '',
      coordinates: { lat: 20.5937, lng: 78.9629 }
    }));
    setCountrySearch(country);
    setCitySearch('');
    setShowCountryDropdown(false);
  };

  // Handle country input change
  const handleCountryInputChange = (value) => {
    setCountrySearch(value);
    setFormData(prev => ({ ...prev, country: value }));
    setShowCountryDropdown(true);
  };

  // Location marker
  function LocationMarker() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setFormData(prev => ({ ...prev, coordinates: { lat, lng } }));
        
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          .then(res => res.json())
          .then(data => {
            if (data.display_name) {
              setFormData(prev => ({
                ...prev,
                exactAddress: data.display_name,
                city: data.address.city || data.address.town || data.address.village || '',
                country: data.address.country || ''
              }));
              setAddressSearch(data.display_name);
            }
          })
          .catch(err => console.error('Reverse geocoding error:', err));
      },
    });
    
    return formData.coordinates.lat ? (
      <Marker position={[formData.coordinates.lat, formData.coordinates.lng]} icon={customIcon}>
        <Popup>
          Selected Location<br />
          Lat: {formData.coordinates.lat.toFixed(6)}<br />
          Lng: {formData.coordinates.lng.toFixed(6)}
        </Popup>
      </Marker>
    ) : null;
  }

  // Map center
  function MapCenter() {
    const map = useMap();
    useEffect(() => {
      if (formData.coordinates.lat && formData.coordinates.lng) {
        map.setView([formData.coordinates.lat, formData.coordinates.lng], formData.city ? 12 : 4);
      }
    }, [formData.coordinates.lat, formData.coordinates.lng, formData.city]);
    return null;
  }

  // Handle engineer selection
  const handleSelectEngineer = (engineerId) => {
    if (formData.assignedEngineers.includes(engineerId)) {
      setFormData(prev => ({
        ...prev,
        assignedEngineers: prev.assignedEngineers.filter(id => id !== engineerId)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        assignedEngineers: [...prev.assignedEngineers, engineerId]
      }));
    }
    setEngineerSearch('');
    setShowEngineerDropdown(false);
  };

  // Remove selected engineer
  const removeEngineer = (engineerId) => {
    setFormData(prev => ({
      ...prev,
      assignedEngineers: prev.assignedEngineers.filter(id => id !== engineerId)
    }));
  };

  // Handle city selection - SIMPLIFIED VERSION
  const handleSelectCity = (city) => {
    setFormData(prev => ({ ...prev, city }));
    setCitySearch(city);
    setShowCityDropdown(false);
    
    const searchQuery = formData.country ? 
      `city=${encodeURIComponent(city)}&country=${encodeURIComponent(formData.country)}` :
      `city=${encodeURIComponent(city)}`;
    
    fetch(`https://nominatim.openstreetmap.org/search?${searchQuery}&format=json&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          setFormData(prev => ({
            ...prev,
            coordinates: { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
          }));
        }
      })
      .catch(err => console.error('City geocoding error:', err));
  };

  // Handle city input change - SIMPLIFIED VERSION
  const handleCityInputChange = (value) => {
    setCitySearch(value);
    setFormData(prev => ({ ...prev, city: value }));
    setShowCityDropdown(true);
    
    if (value.length > 2) {
      const timeoutId = setTimeout(() => {
        const searchQuery = formData.country ? 
          `city=${encodeURIComponent(value)}&country=${encodeURIComponent(formData.country)}` :
          `city=${encodeURIComponent(value)}`;
        
        fetch(`https://nominatim.openstreetmap.org/search?${searchQuery}&format=json&limit=1`)
          .then(res => res.json())
          .then(data => {
            if (data.length > 0) {
              setFormData(prev => ({
                ...prev,
                coordinates: { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
              }));
            }
          })
          .catch(err => console.error('Auto-geocoding error:', err));
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const siteData = {
        name: formData.name,
        country: formData.country,
        city: formData.city,
        description: formData.description,
        exactAddress: formData.exactAddress,
        startDate: formData.startDate,
        coordinates: formData.coordinates,
        assignedEngineers: formData.assignedEngineers,
        type: formData.type,
        status: formData.status,
        progress: formData.progress,
        location: formData.exactAddress || `${formData.city}, ${formData.country}`
      };
      
      console.log('🔔 Creating site with engineers:', siteData.assignedEngineers);
      console.log('Site data:', siteData);

      await api.post('/sites', siteData);
      toast.success('Site created successfully!');
      navigate('/sites');
    } catch (err) {
      console.error('Site creation error:', err);
      toast.error(err.response?.data?.message || 'Failed to create site');
    } finally {
      setLoading(false);
    }
  };

  // Get selected engineer details
  const selectedEngineers = formData.assignedEngineers.map(id => 
    engineers.find(e => e._id === id)
  ).filter(Boolean);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <Navbar />
        
        <div className="p-6 max-w-6xl mx-auto">
          {/* Header with Back Button */}
          <div className="mb-8">
            <div className="flex items-start gap-4 mb-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-shrink-0 mt-2 p-2.5 rounded-lg transition-all duration-200 
                  bg-white dark:bg-slate-800 
                  border border-slate-200 dark:border-slate-700 
                  text-slate-600 dark:text-slate-300 
                  hover:bg-slate-100 dark:hover:bg-slate-700 
                  hover:border-yellow-500/50 dark:hover:border-yellow-500/50
                  hover:text-yellow-600 dark:hover:text-yellow-500"
                title="Back to Dashboard"
              >
                <FiArrowLeft className="text-lg" />
              </button>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-yellow-500 p-3 rounded-sm text-slate-900 shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                    <FaBuilding className="text-2xl" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                      Create New Construction Site
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                      Add a new construction site with location, assigned engineers, and project details
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form 
            onSubmit={handleSubmit} 
            onMouseEnter={() => setIsFormHovered(true)}
            onMouseLeave={() => setIsFormHovered(false)}
            className={`space-y-6 transition-all duration-300 ${isFormHovered ? 'shadow-lg shadow-yellow-500/5' : ''}`}
          >
            {/* Site Information Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg">
                  <FaBuilding className="text-xl text-slate-900" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Site Information</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Basic site details and description</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <FaBuilding className="inline mr-2 text-yellow-500" />
                      Site Name *
                    </label>
                    <input 
                      value={formData.name} 
                      onChange={e => setFormData({ ...formData, name: e.target.value })} 
                      className="w-full p-3 rounded-lg transition-all duration-200
                        bg-white dark:bg-slate-900 
                        border border-slate-300 dark:border-slate-600 
                        text-slate-700 dark:text-slate-300
                        placeholder:text-slate-400 dark:placeholder:text-slate-500
                        focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                        focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                      placeholder="Enter site name"
                      required 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <FaBuilding className="inline mr-2 text-yellow-500" />
                      Site Type
                    </label>
                    <select 
                      value={formData.type} 
                      onChange={e => setFormData({ ...formData, type: e.target.value })} 
                      className="w-full p-3 rounded-lg transition-all duration-200
                        bg-white dark:bg-slate-900 
                        border border-slate-300 dark:border-slate-600 
                        text-slate-700 dark:text-slate-300
                        focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                        focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                    >
                      {siteTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <FaFileAlt className="inline mr-2 text-yellow-500" />
                    Description
                  </label>
                  <textarea 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                    className="w-full p-3 rounded-lg transition-all duration-200
                      bg-white dark:bg-slate-900 
                      border border-slate-300 dark:border-slate-600 
                      text-slate-700 dark:text-slate-300
                      placeholder:text-slate-400 dark:placeholder:text-slate-500
                      focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                      focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                    rows="3" 
                    placeholder="Describe the site, project scope, and any important details..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <FaGlobe className="inline mr-2 text-yellow-500" />
                      Country *
                    </label>
                    <div className="relative" ref={countryDropdownRef}>
                      <div className="relative">
                        <input
                          type="text"
                          value={countrySearch || formData.country}
                          onChange={(e) => handleCountryInputChange(e.target.value)}
                          onClick={() => setShowCountryDropdown(true)}
                          onFocus={() => setShowCountryDropdown(true)}
                          className="w-full p-3 rounded-lg transition-all duration-200
                            bg-white dark:bg-slate-900 
                            border border-slate-300 dark:border-slate-600 
                            text-slate-700 dark:text-slate-300
                            placeholder:text-slate-400 dark:placeholder:text-slate-500
                            focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                            focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                          placeholder="Type country name..."
                          required
                        />
                        <FaSearch className="absolute right-3 top-3.5 text-slate-400" />
                      </div>
                      
                      {/* Country Suggestions Dropdown */}
                      {showCountryDropdown && filteredCountries.length > 0 && countrySearch && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                          {filteredCountries.slice(0, 10).map(country => (
                            <div
                              key={country}
                              onClick={() => handleSelectCountry(country)}
                              className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-colors duration-150 border-b border-slate-200 dark:border-slate-600 last:border-b-0"
                            >
                              <div className="flex items-center gap-2">
                                <FaGlobe className="text-yellow-500 flex-shrink-0" />
                                <span className="text-slate-700 dark:text-slate-300 truncate">{country}</span>
                              </div>
                            </div>
                          ))}
                          {filteredCountries.length > 10 && (
                            <div className="px-4 py-2 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-600">
                              {filteredCountries.length - 10} more countries
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <FaCity className="inline mr-2 text-yellow-500" />
                      City *
                    </label>
                    <div className="relative" ref={cityDropdownRef}>
                      <div className="relative">
                        <input
                          type="text"
                          value={citySearch}
                          onChange={(e) => handleCityInputChange(e.target.value)}
                          onClick={() => setShowCityDropdown(true)}
                          onFocus={() => setShowCityDropdown(true)}
                          className="w-full p-3 rounded-lg transition-all duration-200
                            bg-white dark:bg-slate-900 
                            border border-slate-300 dark:border-slate-600 
                            text-slate-700 dark:text-slate-300
                            placeholder:text-slate-400 dark:placeholder:text-slate-500
                            focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                            focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                          placeholder={mapLoading ? "Loading cities..." : "Type city name..."}
                          required
                          disabled={!formData.country || mapLoading}
                        />
                        <FaSearch className="absolute right-3 top-3.5 text-slate-400" />
                      </div>
                      
                      {/* City Suggestions Dropdown */}
                      {showCityDropdown && formData.country && filteredCities.length > 0 && citySearch && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                          {filteredCities.slice(0, 10).map(city => (
                            <div
                              key={city}
                              onClick={() => handleSelectCity(city)}
                              className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-colors duration-150 border-b border-slate-200 dark:border-slate-600 last:border-b-0"
                            >
                              <div className="flex items-center gap-2">
                                <FaMapMarkerAlt className="text-yellow-500 flex-shrink-0" />
                                <span className="text-slate-700 dark:text-slate-300 truncate">{city}</span>
                              </div>
                            </div>
                          ))}
                          {filteredCities.length > 10 && (
                            <div className="px-4 py-2 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-600">
                              {filteredCities.length - 10} more cities
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Type city name. The map will auto-adjust to the city location.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <FaCalendar className="inline mr-2 text-yellow-500" />
                      Start Date
                    </label>
                    <input 
                      type="date" 
                      value={formData.startDate} 
                      onChange={e => setFormData({ ...formData, startDate: e.target.value })} 
                      className="w-full p-3 rounded-lg transition-all duration-200
                        bg-white dark:bg-slate-900 
                        border border-slate-300 dark:border-slate-600 
                        text-slate-700 dark:text-slate-300
                        focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                        focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <FaBuilding className="inline mr-2 text-yellow-500" />
                      Site Status
                    </label>
                    <select 
                      value={formData.status} 
                      onChange={e => setFormData({ ...formData, status: e.target.value })} 
                      className="w-full p-3 rounded-lg transition-all duration-200
                        bg-white dark:bg-slate-900 
                        border border-slate-300 dark:border-slate-600 
                        text-slate-700 dark:text-slate-300
                        focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                        focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                    >
                      <option value="Active">Active</option>
                      <option value="Planning">Planning</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <FaLocationArrow className="inline mr-2 text-yellow-500" />
                    Site Address
                  </label>
                  <div className="relative" ref={addressDropdownRef}>
                    <div className="relative">
                      <input
                        type="text"
                        value={addressSearch || formData.exactAddress}
                        onChange={(e) => {
                          const value = e.target.value;
                          setAddressSearch(value);
                          setFormData(prev => ({ ...prev, exactAddress: value }));
                          if (value.length > 2) {
                            handleAddressSearch(value);
                          }
                        }}
                        onFocus={() => {
                          if (addressSearch.length > 2) {
                            setShowAddressResults(true);
                          }
                        }}
                        className="w-full p-3 rounded-lg transition-all duration-200
                          bg-white dark:bg-slate-900 
                          border border-slate-300 dark:border-slate-600 
                          text-slate-700 dark:text-slate-300
                          placeholder:text-slate-400 dark:placeholder:text-slate-500
                          focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                          focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                        placeholder="Search for address or click on map..."
                      />
                      <FaSearch className="absolute right-3 top-3.5 text-slate-400" />
                    </div>
                    
                    {showAddressResults && geocodingResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {geocodingResults.map((result, index) => (
                          <div
                            key={index}
                            onClick={() => handleSelectAddress(result)}
                            className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-colors duration-150 border-b border-slate-200 dark:border-slate-600 last:border-b-0"
                          >
                            <div className="flex items-start gap-2">
                              <FaMapMarkerAlt className="text-yellow-500 mt-1 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-800 dark:text-white truncate">
                                  {result.display_name.split(',').slice(0, 2).join(',')}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                                  {result.display_name.split(',').slice(2).join(',')}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Map Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg">
                  <FaMapMarkerAlt className="text-xl text-slate-900" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Site Location Map</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {formData.city 
                      ? `Map centered on ${formData.city}, ${formData.country}` 
                      : "Click on the map to set coordinates or search for address above"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-yellow-500/10 dark:bg-yellow-500/20 rounded-lg border border-yellow-500/20">
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Latitude</div>
                    <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                      {formData.coordinates.lat.toFixed(6)}
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-500/10 dark:bg-yellow-500/20 rounded-lg border border-yellow-500/20">
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Longitude</div>
                    <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                      {formData.coordinates.lng.toFixed(6)}
                    </div>
                  </div>
                </div>

                <div className="h-96 rounded-lg overflow-hidden border-2 border-slate-300 dark:border-slate-600">
                  <MapContainer 
                    center={[formData.coordinates.lat, formData.coordinates.lng]} 
                    zoom={formData.city ? 12 : 4}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapCenter />
                    <LocationMarker />
                  </MapContainer>
                </div>
                
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center pt-2">
                  {formData.city 
                    ? `📍 Map is centered on ${formData.city}, ${formData.country}. Click to adjust location.`
                    : "💡 Enter a city above or click on the map to set the location."}
                </p>
              </div>
            </div>

            {/* Engineer Assignment Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg">
                  <FaUser className="text-xl text-slate-900" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Engineer Assignment</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Search and assign engineers responsible for this site
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div ref={engineerDropdownRef}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Search Engineers
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={engineerSearch}
                      onChange={(e) => {
                        setEngineerSearch(e.target.value);
                        setShowEngineerDropdown(true);
                      }}
                      onClick={() => setShowEngineerDropdown(true)}
                      className="w-full p-3 rounded-lg transition-all duration-200
                        bg-white dark:bg-slate-900 
                        border border-slate-300 dark:border-slate-600 
                        text-slate-700 dark:text-slate-300
                        placeholder:text-slate-400 dark:placeholder:text-slate-500
                        focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                        focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30"
                      placeholder="Type engineer name or email..."
                    />
                    <FaSearch className="absolute right-3 top-3.5 text-slate-400" />
                  </div>

                  {showEngineerDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {filteredEngineers.length > 0 ? (
                        filteredEngineers.map(engineer => (
                          <div
                            key={engineer._id}
                            onClick={() => handleSelectEngineer(engineer._id)}
                            className={`px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-colors duration-150 border-b border-slate-200 dark:border-slate-600 last:border-b-0 ${
                              formData.assignedEngineers.includes(engineer._id) 
                                ? 'bg-yellow-500/10 dark:bg-yellow-500/20' 
                                : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-slate-800 dark:text-white">
                                  {engineer.name}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                  {engineer.email}
                                </div>
                              </div>
                              {formData.assignedEngineers.includes(engineer._id) && (
                                <span className="px-2 py-1 text-xs bg-yellow-500 text-slate-900 rounded-full font-bold">
                                  Selected
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-slate-500 dark:text-slate-400 text-center">
                          No engineers found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedEngineers.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Selected Engineers ({selectedEngineers.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedEngineers.map((engineer) => (
                        <div
                          key={engineer._id}
                          className="px-3 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-900 rounded-full flex items-center gap-2 font-medium"
                        >
                          <FaUser className="text-sm" />
                          <span>{engineer.name}</span>
                          <button
                            type="button"
                            onClick={() => removeEngineer(engineer._id)}
                            className="ml-2 hover:text-slate-700 transition-colors"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="sticky bottom-6 bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Ready to Create Site</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Review all information before submitting
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => navigate('/sites')}
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-200
                      bg-slate-100 dark:bg-slate-700 
                      border border-slate-300 dark:border-slate-600
                      text-slate-700 dark:text-slate-300 
                      hover:bg-slate-200 dark:hover:bg-slate-600
                      hover:border-yellow-500/50 dark:hover:border-yellow-500/50
                      hover:text-slate-900 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="px-8 py-3 rounded-lg font-medium transition-all duration-200
                      bg-gradient-to-r from-yellow-500 to-yellow-600 
                      text-slate-900 
                      hover:from-yellow-600 hover:to-yellow-700 
                      hover:shadow-lg hover:shadow-yellow-500/25
                      active:scale-[0.99]
                      disabled:from-yellow-300 disabled:to-yellow-400 disabled:cursor-not-allowed
                      disabled:shadow-none
                      flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Site...
                      </>
                    ) : (
                      <>
                        <FaBuilding />
                        Create Site
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}