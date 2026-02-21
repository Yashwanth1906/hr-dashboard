import React, { useState, useEffect } from 'react';
import { Branch } from '../types';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: () => void;
  branches: Branch[];
}

const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirmLogout,
  branches,
}) => {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(branches[0] || null);
  const [isWFH, setIsWFH] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      setError(null);
      setLocation(null);
      setDistance(null);
      return;
    }

    if (isWFH) {
      setLocation(null);
      setDistance(null);
      return;
    }

    // Get user's current location
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({ lat, lng });

          // Calculate distance to selected branch
          if (selectedBranch) {
            const d = calculateDistance(lat, lng, selectedBranch.latitude, selectedBranch.longitude);
            setDistance(d);
          }
          setLoading(false);
        },
        (error) => {
          setError('Unable to fetch location. Please enable location services.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  }, [isOpen, isWFH, selectedBranch]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // distance in meters
  };

  const isNearBranch = distance !== null && selectedBranch && distance <= selectedBranch.radius;
  const canLogout = isWFH || (location && (isNearBranch || distance! > selectedBranch!.radius));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md mx-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">End Work Session</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            Location verification required for checkout. This confirms you are ending your work session.
          </p>
        </div>

        {/* WFH Toggle */}
        <div className="space-y-2">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isWFH}
              onChange={(e) => setIsWFH(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            <span className="text-slate-700 font-medium">Working From Home (WFH)</span>
          </label>
        </div>

        {/* Branch Selection */}
        {!isWFH && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Your Work Location</label>
            <select
              value={selectedBranch?.id || ''}
              onChange={(e) => {
                const branch = branches.find(b => b.id === e.target.value);
                setSelectedBranch(branch || null);
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-900"
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            {selectedBranch && (
              <p className="text-sm text-slate-600">{selectedBranch.address}</p>
            )}
          </div>
        )}

        {/* Location Status */}
        {!isWFH && (
          <div className="space-y-2">
            <h3 className="font-medium text-slate-700">Location Verification</h3>
            {loading && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
                <span className="text-blue-700">Fetching your location...</span>
              </div>
            )}
            {error && !isWFH && (
              <div className="p-3 bg-red-50 rounded-lg text-red-700 text-sm">{error}</div>
            )}
            {location && selectedBranch && (
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Your Location:</span> {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${isNearBranch ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <p className={`text-sm font-medium ${isNearBranch ? 'text-green-700' : 'text-amber-700'}`}>
                    Distance: {distance?.toFixed(0)} meters
                  </p>
                  <p className={`text-xs ${isNearBranch ? 'text-green-600' : 'text-amber-600'}`}>
                    {isNearBranch
                      ? '✓ You are at the office location'
                      : `• You are ${distance! > selectedBranch!.radius ? 'outside' : 'inside'} office geofence`}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Warning Message */}
        {!isWFH && location && !isNearBranch && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-700">
              You are logging out from outside your work location. This will be recorded in your attendance log.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
          >
            Continue Working
          </button>
          <button
            onClick={() => {
              onConfirmLogout();
              onClose();
            }}
            disabled={loading}
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition ${
              !loading
                ? 'bg-red-600 hover:bg-red-700 cursor-pointer'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            {loading ? 'Getting Location...' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
