"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  MapPinIcon, 
  MagnifyingGlassIcon, 
  MapIcon, 
  CheckCircleIcon, 
  XMarkIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  ClockIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { debounce } from 'lodash';
import { apiFetchEnvelope } from '@/lib/api/client';
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  placeId?: string;
  method?: 'manual' | 'gps' | 'autocomplete' | 'map' | 'coordinates' | 'landmark' | 'district';
  accuracy?: number;
}

interface AddressSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface Landmark {
  name: string;
  coords: [number, number];
  district: string;
  category: string;
}

interface FreeLocationInputProps {
  value?: {
    latitude: number;
    longitude: number;
    address: string;
    method?: string;
    placeId?: string;
    accuracy?: number;
  } | null;
  onChange: (location: LocationData | null) => void;
  required?: boolean;
}

export function FreeLocationInput({ value, onChange, required = false }: FreeLocationInputProps) {
  const [activeMethod, setActiveMethod] = useState<'address' | 'district' | 'gps' | 'coordinates' | 'landmarks' | 'map'>('address');
  const [addressQuery, setAddressQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    method?: string;
    placeId?: string;
    accuracy?: number;
  } | null>(value || null);
  const [rwandaLocations, setRwandaLocations] = useState<any>(null);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [landmarksLoading, setLandmarksLoading] = useState(true);

  // Manual coordinates input
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  // Map container ref + map instance ref (separate from the DOM ref)
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: -1.9441, lng: 30.0619 }); // Kigali center
  const [mapMarker, setMapMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Load Rwanda locations data on component mount
  useEffect(() => {
    apiFetchEnvelope<{ data: { success: boolean; data: unknown } }>('geocoding/rwanda-locations')
      .then(result => {
        if (result.data.success) {
          setRwandaLocations(result.data.data as any);
        }
      })
      .catch(err => console.error('Failed to load Rwanda locations:', err));

    // Fetch landmarks from API (editable without frontend deploy)
    apiFetchEnvelope<{ data: { success: boolean; data: unknown } }>('geocoding/landmarks')
      .then(result => {
        if (result.data.success) {
          setLandmarks(result.data.data as Landmark[]);
        }
      })
      .catch(err => console.error('Failed to load landmarks:', err))
      .finally(() => setLandmarksLoading(false));
  }, []);

  // Lazy useState initializer: the debounced function is created exactly once,
  // instead of a fresh (timer-mutating) instance on every render.
  const [searchAddresses] = useState(() =>
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data } = await (apiFetchEnvelope(`geocoding/suggestions?query=${encodeURIComponent(query)}`) as Promise<any>);

        if (data.success) {
          setSuggestions(data.data || []);
        }
      } catch (error) {
        console.error('Address search failed:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300)
  );

  const selectSuggestion = async (suggestion: AddressSuggestion) => {
    setIsLoading(true);
    try {
      const { data } = await (apiFetchEnvelope('geocoding/place-details', {
        method: 'POST',
        body: JSON.stringify({ placeId: suggestion.placeId })
      }) as Promise<any>);
      
      if (data.success && data.data.isValid) {
        const location: LocationData = {
          latitude: data.data.coordinates.lat,
          longitude: data.data.coordinates.lng,
          address: data.data.formattedAddress || suggestion.description,
          placeId: suggestion.placeId,
          method: 'autocomplete'
        };
        
        setSelectedLocation(location);
        onChange(location);
        setAddressQuery(suggestion.description);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Failed to get place details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const detectGPSLocation = async () => {
    if (!navigator.geolocation) {
      alert('GPS not supported by your device');
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const { data } = await (apiFetchEnvelope('geocoding/reverse-geocode', {
            method: 'POST',
            body: JSON.stringify({ lat: latitude, lng: longitude })
          }) as Promise<any>);

          const address = data.success && data.data?.address
            ? data.data.address
            : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

          const location: LocationData = {
            latitude,
            longitude,
            address,
            method: 'gps'
          };

          setSelectedLocation(location);
          onChange(location);
        } catch {
          const location: LocationData = {
            latitude,
            longitude,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            method: 'gps'
          };

          setSelectedLocation(location);
          onChange(location);
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        setIsLoading(false);
        let message = 'Location detection failed';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
        }
        alert(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000
      }
    );
  };

  const selectDistrict = (provinceName: string, districtName: string, district: any) => {
    const location: LocationData = {
      latitude: district.center[0],
      longitude: district.center[1],
      address: `${districtName} District, ${provinceName}, Rwanda`,
      method: 'district'
    };
    
    setSelectedLocation(location);
    onChange(location);
  };

  const selectLandmark = (landmark: any) => {
    const location: LocationData = {
      latitude: landmark.coords[0],
      longitude: landmark.coords[1],
      address: `${landmark.name}, ${landmark.district} District, Kigali`,
      method: 'landmark'
    };
    
    setSelectedLocation(location);
    onChange(location);
  };

  const setManualCoordinates = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Please enter valid coordinates (Latitude: -90 to 90, Longitude: -180 to 180)');
      return;
    }
    
    const location: LocationData = {
      latitude: lat,
      longitude: lng,
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      method: 'coordinates'
    };
    
    setSelectedLocation(location);
    onChange(location);
  };

  // MapLibre GL JS interactive map
  useEffect(() => {
    if (activeMethod !== 'map' || !mapRef.current) return;

    // Prevent double-init in strict mode
    if (mapInstanceRef.current) return;

    setMapError(null);

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"],
            tileSize: 256,
            attribution: "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
            maxzoom: 19,
          },
        },
        layers: [{ id: "osm-tiles", type: "raster", source: "osm" }],
      },
      center: [mapCenter.lng, mapCenter.lat],
      zoom: 12,
    });

    map.on("load", () => setMapError(null));
    map.on("error", () => setMapError("Failed to load map tiles"));

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const marker = new maplibregl.Marker({ color: "#dc2626", draggable: false });

    map.on("click", async (e) => {
      const { lng, lat } = e.lngLat;
      marker.setLngLat([lng, lat]).addTo(map);

      try {
        const { data } = await (apiFetchEnvelope('geocoding/reverse-geocode', {
          method: 'POST',
          body: JSON.stringify({ lat, lng })
        }) as Promise<any>);

        const address = data.success && data.data?.address
          ? data.data.address
          : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

        const location: LocationData = {
          latitude: lat,
          longitude: lng,
          address,
          method: "map",
        };
        setSelectedLocation(location);
        onChange(location);
      } catch {
        const location: LocationData = {
          latitude: lat,
          longitude: lng,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          method: "map",
        };
        setSelectedLocation(location);
        onChange(location);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [activeMethod, mapCenter.lat, mapCenter.lng, onChange]);

  const methods = [
    { 
      id: 'address', 
      label: 'Search Address', 
      icon: MagnifyingGlassIcon,
      description: 'Type your office address'
    },
    { 
      id: 'district', 
      label: 'Pick District', 
      icon: MapIcon,
      description: 'Choose from Rwanda districts'  
    },
    { 
      id: 'landmarks', 
      label: 'Famous Places', 
      icon: BuildingOfficeIcon,
      description: 'Near known landmarks'
    },
    { 
      id: 'gps', 
      label: 'Use GPS', 
      icon: MapPinIcon,
      description: 'Current location'
    },
    { 
      id: 'coordinates', 
      label: 'Coordinates', 
      icon: GlobeAltIcon,
      description: 'Enter lat/lng manually'
    },
    { 
      id: 'map', 
      label: 'Click Map', 
      icon: MapIcon,
      description: 'Point on interactive map'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Method Selection */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-3 block">
          Office Location {required && <span className="text-red-500">*</span>}
        </label>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-1 bg-gray-100 rounded-lg">
          {methods.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => setActiveMethod(method.id as any)}
              className={`flex flex-col items-center gap-1 p-2 rounded-md text-xs font-medium transition-colors ${
                activeMethod === method.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <method.icon className="h-4 w-4" />
              <span className="text-center leading-tight">{method.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Method Component */}
      <div className="min-h-[200px]">
        {/* Address Search */}
        {activeMethod === 'address' && (
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={addressQuery}
                onChange={(e) => {
                  setAddressQuery(e.target.value);
                  searchAddresses(e.target.value);
                }}
                placeholder="Start typing your office address..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <MagnifyingGlassIcon className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
            </div>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto bg-white">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.placeId}
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-start gap-3">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{suggestion.mainText}</p>
                        <p className="text-sm text-gray-600">{suggestion.secondaryText}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {isLoading && (
              <p className="text-sm text-gray-500 text-center py-4">Searching...</p>
            )}
          </div>
        )}

        {/* District Picker */}
        {activeMethod === 'district' && rwandaLocations && (
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {Object.entries(rwandaLocations.provinces).map(([provinceName, province]: [string, any]) => (
              <div key={provinceName} className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">{provinceName}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(province.districts).map(([districtName, district]: [string, any]) => (
                    <button
                      key={districtName}
                      onClick={() => selectDistrict(provinceName, districtName, district)}
                      className="text-left p-2 rounded hover:bg-blue-50 hover:text-blue-700 text-sm"
                    >
                      {districtName}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* GPS Detection */}
        {activeMethod === 'gps' && (
          <div className="text-center py-8">
            <button
              onClick={detectGPSLocation}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Detecting location...
                </>
              ) : (
                <>
                  <MapPinIcon className="h-4 w-4" />
                  Use my current location
                </>
              )}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Make sure location services are enabled in your browser
            </p>
          </div>
        )}

        {/* Landmarks Picker */}
        {activeMethod === 'landmarks' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-3">Choose a landmark near your office:</p>
            {landmarksLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : landmarks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Landmarks unavailable. Try another method.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
                {landmarks.map((landmark, index) => (
                  <button
                    key={index}
                    onClick={() => selectLandmark(landmark)}
                    className="flex items-start gap-3 p-3 text-left rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{landmark.name}</p>
                      <p className="text-sm text-gray-600">{landmark.district} District</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manual Coordinates */}
        {activeMethod === 'coordinates' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Enter your office coordinates manually:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="-1.944400"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Range: -90 to 90</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="30.061900"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Range: -180 to 180</p>
              </div>
            </div>
            <button
              onClick={setManualCoordinates}
              disabled={!manualLat || !manualLng}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Set Location
            </button>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-700">
                💡 <strong>Tip:</strong> You can get coordinates from Google Maps by right-clicking on your location and copying the coordinates.
              </p>
            </div>
          </div>
        )}

        {/* Interactive Map (MapLibre GL JS) */}
        {activeMethod === 'map' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Click on the map to set your location:</p>

            {mapError ? (
              <div className="h-72 border border-red-300 rounded-lg bg-red-50 flex items-center justify-center">
                <div className="text-center px-4">
                  <MapIcon className="h-8 w-8 text-red-400 mx-auto mb-2" />
                  <p className="text-sm text-red-700 mb-2">{mapError}</p>
                  <p className="text-xs text-red-600">
                    Try the <strong>Coordinates</strong> tab to enter lat/lng manually, or refresh the page.
                  </p>
                </div>
              </div>
            ) : (
              <div
                ref={mapRef}
                className="h-72 border border-gray-300 rounded-lg overflow-hidden"
              />
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Tip:</strong> Click anywhere on the map to drop a pin. Drag to navigate.
              </p>
              <p className="text-xs text-blue-700">
                Can&apos;t see the map? Use the <strong>Coordinates</strong> tab to enter lat/lng manually.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Selected Location Preview */}
      {selectedLocation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-green-800">
                Location Selected
              </h4>
              <p className="text-sm text-green-700 mt-1">
                📍 {selectedLocation.address}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Coordinates: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)} • 
                Method: {selectedLocation.method}
                {selectedLocation.accuracy && ` • Accuracy: ${Math.round(selectedLocation.accuracy)}m`}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedLocation(null);
                onChange(null);
              }}
              className="text-green-600 hover:text-green-800"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
