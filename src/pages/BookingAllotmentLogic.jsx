import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';
import {
  FiToggleLeft, FiToggleRight, FiLock, FiX, FiCheckCircle, FiInfo, FiShield
} from 'react-icons/fi';

// Password for enabling same rider toggle (change this in production)
const SAME_RIDER_PASSWORD = 'admin123';

const BookingAllotmentLogic = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchGlobalSetting();
  }, []);

  const fetchGlobalSetting = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'AdminSettings', 'allotmentConfig');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsEnabled(data.sameRiderForPickupAndDelivery || false);
        setLastUpdated(data.updatedAt?.toDate() || null);
      } else {
        // Initialize with default value if document doesn't exist
        setIsEnabled(false);
        setLastUpdated(null);
      }
    } catch (error) {
      console.error('Error fetching global setting:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClick = () => {
    if (!isEnabled) {
      // Trying to enable - show password modal
      setShowPasswordModal(true);
      setPassword('');
      setPasswordError('');
    } else {
      // Disabling - no password needed
      updateGlobalSetting(false);
    }
  };

  const handlePasswordSubmit = () => {
    if (password === SAME_RIDER_PASSWORD) {
      setShowPasswordModal(false);
      setPassword('');
      setPasswordError('');
      updateGlobalSetting(true);
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  const updateGlobalSetting = async (newValue) => {
    try {
      setUpdating(true);
      const docRef = doc(db, 'AdminSettings', 'allotmentConfig');
      const now = Timestamp.now();
      
      await setDoc(docRef, {
        sameRiderForPickupAndDelivery: newValue,
        updatedAt: now,
        updatedBy: 'admin'
      }, { merge: true });
      
      setIsEnabled(newValue);
      setLastUpdated(now.toDate());
      toast.success(
        newValue 
          ? 'Same rider for pickup & delivery ENABLED for all bookings' 
          : 'Same rider for pickup & delivery DISABLED for all bookings'
      );
    } catch (error) {
      console.error('Error updating global setting:', error);
      toast.error('Failed to update setting');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Booking Allotment Logic</h1>
        <p className="text-gray-600 mt-1">Configure global settings for rider assignment</p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <FiShield className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Same Rider Assignment</h2>
              <p className="text-sm text-gray-600">Global toggle for all bookings</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Toggle Section */}
          <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FiLock className="w-4 h-4 text-gray-500" />
                <span className="font-semibold text-gray-900">
                  Assign Same Rider for Pickup & Delivery
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {isEnabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                When enabled, <strong>ALL new bookings</strong> will automatically use the same rider 
                for both pickup and delivery. This applies whether the admin assigns the rider 
                or the rider accepts the delivery through the app.
              </p>
            </div>
            <button
              onClick={handleToggleClick}
              disabled={updating}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ml-4 ${
                updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              } ${
                isEnabled ? 'bg-red-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                  isEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Info Box */}
          <div className={`mt-4 p-4 rounded-xl border ${
            isEnabled 
              ? 'bg-green-50 border-green-200' 
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-start gap-3">
              {isEnabled ? (
                <FiCheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              ) : (
                <FiInfo className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              )}
              <div>
                {isEnabled ? (
                  <>
                    <p className="text-sm font-semibold text-green-800">Active - Same Rider Mode</p>
                    <p className="text-sm text-green-700 mt-1">
                      All new bookings will have same Rider for pickup and Delivery . 
                      The pickup rider will automatically be assigned for delivery when work is completed.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-amber-800">Inactive - Standard Mode</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Bookings will use separate riders for pickup and delivery. 
                      Delivery riders will need to be assigned separately after work completion.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="mt-4 text-sm text-gray-500">
            Last updated: {formatDate(lastUpdated)}
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <FiLock className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Password Required</h3>
              </div>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setPasswordError('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Enter the admin password to enable same rider assignment globally for all bookings.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit();
                  }
                }}
                placeholder="Enter password"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors ${
                  passwordError ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
                autoFocus
              />
              {passwordError && (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                  <FiX className="w-4 h-4" />
                  {passwordError}
                </p>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setPasswordError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingAllotmentLogic;
