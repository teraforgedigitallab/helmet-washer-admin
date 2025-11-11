import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link } from 'react-router-dom';
import { FiMapPin, FiUsers, FiTrendingUp, FiDollarSign, FiPlus, FiArrowUp, FiArrowRight, FiActivity } from 'react-icons/fi';

const Dashboard = () => {
  const [stats, setStats] = useState({
    serviceCenters: 0,
    totalUsers: 0,
    totalBookings: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const serviceCentersSnapshot = await getDocs(collection(db, 'serviceCenters'));
      setStats(prev => ({
        ...prev,
        serviceCenters: serviceCentersSnapshot.size
      }));
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
      change: '+12%',
      bgColor: 'from-blue-500 to-blue-600',
      lightBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: FiUsers,
      change: '+8%',
      bgColor: 'from-green-500 to-green-600',
      lightBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: FiTrendingUp,
      change: '+23%',
      bgColor: 'from-primary-500 to-primary-600',
      lightBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
    },
    {
      title: 'Revenue',
      value: `₹${stats.revenue.toLocaleString()}`,
      icon: FiDollarSign,
      change: '+15%',
      bgColor: 'from-yellow-500 to-yellow-600',
      lightBg: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
    }
  ];

  const quickActions = [
    {
      title: 'Add Service Center',
      description: 'Create a new service center location',
      icon: FiMapPin,
      link: '/service-centers/add',
      gradient: 'from-primary-500 to-primary-600',
      lightBg: 'bg-primary-50',
      iconColor: 'text-primary-600'
    },
    {
      title: 'View All Centers',
      description: 'Manage existing service centers',
      icon: FiActivity,
      link: '/service-centers',
      gradient: 'from-blue-500 to-blue-600',
      lightBg: 'bg-blue-50',
      iconColor: 'text-blue-600'
    }
  ];

  const recentActivities = [
    { action: 'New service center added in Mumbai', time: '2 hours ago', type: 'success', icon: FiMapPin },
    { action: 'Service center details updated', time: '4 hours ago', type: 'info', icon: FiActivity },
    { action: 'User registration milestone reached', time: '6 hours ago', type: 'warning', icon: FiUsers },
    { action: 'Monthly report generated', time: '1 day ago', type: 'success', icon: FiTrendingUp }
  ];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-8">
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
            <div className="h-4 bg-gray-200 rounded w-96"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome back! 👋</h1>
        <p className="text-sm sm:text-base text-gray-600">Here's what's happening with your service centers today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="group bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.lightBg} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <FiArrowUp className="w-3 h-3" />
                {stat.change}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-500">Active</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.link}
                  className="group relative p-5 rounded-xl border-2 border-gray-100 hover:border-transparent hover:bg-linear-to-br hover:from-gray-50 hover:to-white transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-linear-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none" 
                    style={{ backgroundImage: `linear-gradient(to bottom right, var(--color-primary-500), var(--color-primary-600))` }}
                  />
                  <div className="relative flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${action.lightBg} group-hover:scale-110 transition-all duration-300 shadow-sm`}>
                      <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {action.description}
                      </p>
                    </div>
                    <FiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all duration-300 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors">
                View all
              </button>
            </div>
            
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="group flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    activity.type === 'success' ? 'bg-green-100' :
                    activity.type === 'info' ? 'bg-blue-100' :
                    activity.type === 'warning' ? 'bg-yellow-100' : 'bg-gray-100'
                  }`}>
                    <activity.icon className={`w-4 h-4 ${
                      activity.type === 'success' ? 'text-green-600' :
                      activity.type === 'info' ? 'text-blue-600' :
                      activity.type === 'warning' ? 'text-yellow-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-1 leading-tight">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="relative bg-linear-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl p-6 sm:p-8 lg:p-10 text-white overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYweiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to expand your network?</h2>
            <p className="text-primary-100 text-sm sm:text-base mb-6 max-w-2xl leading-relaxed">
              Add more service centers to reach more customers and grow your business. Start expanding your presence today!
            </p>
            <Link
              to="/service-centers/add"
              className="inline-flex items-center gap-2 bg-white text-primary-600 px-6 py-3 rounded-xl font-semibold hover:bg-primary-50 hover:shadow-lg transition-all duration-200"
            >
              <FiPlus className="w-5 h-5" />
              Add Service Center
            </Link>
          </div>
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
              <FiMapPin className="w-16 h-16 text-white/80" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;