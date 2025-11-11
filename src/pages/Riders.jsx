import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';
import { FiTruck, FiSearch, FiFilter, FiPhone, FiMail, FiCalendar, FiMapPin, FiShoppingBag } from 'react-icons/fi';

const Riders = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'Riders'));
      const ridersData = [];
      querySnapshot.forEach((doc) => {
        ridersData.push({ id: doc.id, ...doc.data() });
      });
      setRiders(ridersData);
    } catch (error) {
      console.error('Error fetching riders:', error);
      toast.error('Failed to fetch riders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const filteredRiders = riders.filter(rider => {
    const searchLower = searchTerm.toLowerCase();
    return (
      rider.name?.toLowerCase().includes(searchLower) ||
      rider.phoneNumber?.toLowerCase().includes(searchLower) ||
      rider.email?.toLowerCase().includes(searchLower) ||
      rider.referralCode?.toLowerCase().includes(searchLower)
    );
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'totalOrders':
        return (b.totalOrders || 0) - (a.totalOrders || 0);
      case 'createdAt':
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-10 bg-gray-200 rounded-lg w-64"></div>
          </div>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Riders</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {riders.length} registered riders
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, phone, email, or referral code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200"
          />
        </div>
        <div className="relative">
          <FiFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-48 pl-12 pr-10 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none cursor-pointer"
          >
            <option value="name">Sort by Name</option>
            <option value="totalOrders">Sort by Orders</option>
            <option value="createdAt">Sort by Date</option>
          </select>
        </div>
      </div>

      {/* Riders List */}
      {filteredRiders.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredRiders.map((rider) => (
              <div key={rider.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {rider.profileImage ? (
                      <img
                        src={rider.profileImage}
                        alt={rider.name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <FiTruck className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {rider.name || 'Unknown Rider'}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                        {rider.referralCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {rider.phoneNumber && (
                        <div className="flex items-center gap-1">
                          <FiPhone className="w-3 h-3" />
                          <span>{rider.phoneNumber}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <FiCalendar className="w-3 h-3" />
                        <span>Joined {formatDate(rider.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6 shrink-0">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                        <FiShoppingBag className="w-4 h-4 text-primary-600" />
                        {rider.totalOrders || 0}
                      </div>
                      <p className="text-xs text-gray-500">Deliveries</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                        <FiMapPin className="w-4 h-4 text-green-600" />
                        {rider.addresses?.length || 0}
                      </div>
                      <p className="text-xs text-gray-500">Areas</p>
                    </div>
                  </div>

                  {/* Mobile Stats */}
                  <div className="sm:hidden flex flex-col items-end text-right shrink-0">
                    <div className="text-sm font-semibold text-gray-900">
                      {rider.totalOrders || 0} deliveries
                    </div>
                    <div className="text-xs text-gray-500">
                      {rider.addresses?.length || 0} areas
                    </div>
                  </div>
                </div>

                {/* Additional Info - Collapsible on mobile */}
                <div className="mt-3 pl-16 sm:hidden">
                  <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                    {rider.email && (
                      <div className="flex items-center gap-1">
                        <FiMail className="w-3 h-3" />
                        <span className="truncate max-w-32">{rider.email}</span>
                      </div>
                    )}
                    {rider.addresses && rider.addresses.length > 0 && (
                      <div className="flex items-center gap-1">
                        <FiMapPin className="w-3 h-3" />
                        <span>Serves {rider.addresses.length} area{rider.addresses.length > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-linear-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FiTruck className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No matching riders found' : 'No riders registered yet'}
          </h3>
          <p className="text-sm text-gray-600">
            {searchTerm 
              ? 'Try adjusting your search criteria.' 
              : 'Riders will appear here once they register through the rider app.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default Riders;