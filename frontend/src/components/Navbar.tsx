import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import LogoutModal from './LogoutModal';
import { API_URL } from '../utils/utils';
import axios from 'axios';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { addNotification } = useNotifications();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [branches, setBranches] = useState<any[]>([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await axios(`${API_URL}/companyBranches`, { validateStatus: () => true, 
          headers: { Authorization: `Bearer ${token}` }
        });
        if ((res.status >= 200 && res.status < 300)) {
          setBranches(res.data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchBranches();
  }, [token]);

  const handleLogout = async (branchId: string, lat: number, lng: number, isWFH: boolean) => {
    try {
      // First attempt to physically check the user out before logging off globally
      await axios(`${API_URL}/attendance/checkout`, { validateStatus: () => true, 
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        data: JSON.stringify({ isWFH, companyBranchId: isWFH ? null : branchId, checkoutLat: lat, checkoutLng: lng })
      });
    } catch (e) {
      console.warn("Soft fail on checkout location record on exit.", e);
    }

    // Proceed out natively
    logout();
    addNotification('Logged out successfully', 'success');
    navigate('/login');
  };

  const handleOpenLogoutModal = () => {
    setShowUserMenu(false);
    setShowLogoutModal(true);
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="h-16 flex items-center justify-between px-8">
        {/* Left side */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-900">Welcome back, {user?.name?.split(' ')[0]}</h2>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent text-sm outline-none w-32 text-slate-900 placeholder-slate-500"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 hover:bg-slate-100 rounded-lg px-3 py-2 transition"
            >
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-8 h-8 rounded-full bg-slate-300"
              />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
              <svg
                className={`w-4 h-4 text-slate-500 transition-transform ${showUserMenu ? 'rotate-180' : ''
                  }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition"
                >
                  Settings
                </button>
                <button
                  onClick={handleOpenLogoutModal}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirmLogout={handleLogout}
        branches={branches}
      />
    </nav>
  );
};

export default Navbar;
