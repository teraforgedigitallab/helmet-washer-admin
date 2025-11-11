import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link } from 'react-router-dom';
import { FiMapPin, FiUsers, FiDollarSign, FiPlus, FiArrowRight, FiActivity, FiTruck, FiClipboard } from 'react-icons/fi';

const Dashboard = () => {
  const [stats, setStats] = useState({
    serviceCenters: 0,
    totalUsers: 0,
    totalRiders: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingBookings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch service centers
      const serviceCentersSnapshot = await getDocs(collection(db, 'ServiceCenters'));
      
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'Users'));
      
      // Fetch riders
      const ridersSnapshot = await getDocs(collection(db, 'Riders'));
      
      // Fetch bookings
      const bookingsSnapshot = await getDocs(collection(db, 'Bookings'));
      
      let totalRevenue = 0;
      let pendingBookings = 0;
      
      bookingsSnapshot.forEach((doc) => {
        const booking = doc.data();
        if (booking.pricing?.totalAmount) {
          totalRevenue += booking.pricing.totalAmount;
        }
        if (booking.status === 'pending') {
          pendingBookings += 1;
        }
      });

      setStats({
        serviceCenters: serviceCentersSnapshot.size,
        totalUsers: usersSnapshot.size,
        totalRiders: ridersSnapshot.size,
        totalBookings: bookingsSnapshot.size,
        totalRevenue,
        pendingBookings
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Service Centers',
      value: stats.serviceCenters,
      icon: FiMapPin,
      bgColor: 'from-blue-500 to-blue-600',
      lightBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      link: '/service-centers'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: FiUsers,
      bgColor: 'from-green-500 to-green-600',
      lightBg: 'bg-green-50',
      iconColor: 'text-green-600',
      link: '/users'
    },
    {
      title: 'Total Riders',
      value: stats.totalRiders,
      icon: FiTruck,
      bgColor: 'from-purple-500 to-purple-600',
      lightBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      link: '/riders'
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: FiClipboard,
      bgColor: 'from-primary-500 to-primary-600',
      lightBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
      link: '/bookings'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: FiDollarSign,
      bgColor: 'from-yellow-500 to-yellow-600',
      lightBg: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      link: '/bookings'
    },
    {
      title: 'Pending Bookings',
      value: stats.pendingBookings,
      icon: FiClipboard,
      bgColor: 'from-red-500 to-red-600',
      lightBg: 'bg-red-50',
      iconColor: 'text-red-600',
      link: '/bookings'
    }
  ];

  const quickActions = [
    {
      title: 'Add Service Center',
      description: 'Create a new service center location',
      icon: FiMapPin,
      link: '/service-centers/add',
      lightBg: 'bg-primary-50',
      iconColor: 'text-primary-600'
    },
    {
      title: 'View All Centers',
      description: 'Manage existing service centers',
      icon: FiActivity,
      link: '/service-centers',
      lightBg: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Manage Users',
      description: 'View and manage registered users',
      icon: FiUsers,
      link: '/users',
      lightBg: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'Track Bookings',
      description: 'Monitor all helmet washing bookings',
      icon: FiClipboard,
      link: '/bookings',
      lightBg: 'bg-purple-50',
      iconColor: 'text-purple-600'
    }
  ];

  const recentActivities = [
    { action: 'New booking received from Mumbai', time: '2 hours ago', type: 'success', icon: FiClipboard },
    { action: 'New user registered', time: '3 hours ago', type: 'info', icon: FiUsers },
    { action: 'Service center details updated', time: '4 hours ago', type: 'info', icon: FiActivity },
    { action: 'New rider joined the team', time: '6 hours ago', type: 'success', icon: FiTruck }
  ];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-8">
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
            <div className="h-4 bg-gray-200 rounded w-96"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Welcome back! Here's what's happening with your helmet washing service.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {statCards.map((card, index) => (
          <Link
            key={index}
            to={card.link}
            className="group bg-white rounded-2xl p-5 border border-gray-200 hover:border-primary-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${card.lightBg} group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{card.value}</h3>
                <p className="text-sm text-gray-600 font-medium truncate">{card.title}</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <FiArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
                <p className="text-sm text-gray-600">Manage your service efficiently</p>
              </div>
              <FiActivity className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.link}
                  className="group relative p-5 rounded-xl border-2 border-gray-100 hover:border-primary-200 hover:bg-gray-50 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2.5 rounded-xl ${action.lightBg} group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className={`w-5 h-5 ${action.iconColor}`} />
                    </div>
                    <h4 className="font-semibold text-gray-900 flex-1">
                      {action.title}
                    </h4>
                    <FiArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {action.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                <p className="text-sm text-gray-600">Latest updates</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    activity.type === 'success' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    <activity.icon className={`w-4 h-4 ${
                      activity.type === 'success' ? 'text-green-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 leading-relaxed">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="relative bg-linear-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl p-6 sm:p-8 text-white overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
        <div className="relative">
          <div className="max-w-2xl">
            <h3 className="text-xl sm:text-2xl font-bold mb-3">
              Ready to expand your network?
            </h3>
            <p className="text-primary-100 mb-6 leading-relaxed">
              Add more service centers to reach customers across different locations and grow your helmet washing business.
            </p>
            <Link
              to="/service-centers/add"
              className="inline-flex items-center gap-2 bg-white text-primary-600 px-6 py-3 rounded-xl font-semibold hover:bg-primary-50 hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <FiPlus className="w-5 h-5" />
              Add Service Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;