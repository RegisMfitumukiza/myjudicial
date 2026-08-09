"use client";

import { useState } from 'react';
import { FreeLocationInput } from './FreeLocationInput';

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  placeId?: string;
  method?: string;
  accuracy?: number;
}

export function LocationInputDemo() {
  const [location, setLocation] = useState<LocationData | null>(null);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Multi-Modal Location Input Demo
        </h2>
        <p className="text-gray-600">
          Try different ways to set your office location - all completely free!
        </p>
      </div>

      <FreeLocationInput
        value={location}
        onChange={setLocation}
        required={true}
      />

      {/* Debug Information */}
      {location && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Selected Location Data
          </h3>
          <pre className="text-sm text-gray-700 overflow-x-auto">
            {JSON.stringify(location, null, 2)}
          </pre>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">6</div>
          <div className="text-sm text-gray-600">Input Methods</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">$0</div>
          <div className="text-sm text-gray-600">API Costs</div>
        </div>
      </div>

      {/* Method Descriptions */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <h3 className="font-semibold text-gray-800">Available Input Methods:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span><strong>Search Address:</strong> Type any Rwanda address</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span><strong>Pick District:</strong> Choose from 30 districts</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <span><strong>Famous Places:</strong> Select known landmarks</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            <span><strong>Use GPS:</strong> Current device location</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <span><strong>Coordinates:</strong> Manual lat/lng entry</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            <span><strong>Click Map:</strong> Point on OpenStreetMap</span>
          </div>
        </div>
      </div>
    </div>
  );
}