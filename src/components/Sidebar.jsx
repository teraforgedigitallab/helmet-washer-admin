import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FiHome, 
  FiMapPin, 
  FiSettings, 
  FiUsers, 
  FiTrendingUp,
  FiChevronLeft,
  FiChevronRight,
  FiTruck,
  FiClipboard,
  FiStar,
  FiSliders
} from 'react-icons/fi';
import logo from '../assets/logo.png';

const Sidebar = ({ isOpen, onToggle }) => {
  const menuItems = [
    { name: 'Dashboard', icon: FiHome, path: '/dashboard' },
    { name: 'Service Centers', icon: FiMapPin, path: '/service-centers' },
    { name: 'Users', icon: FiUsers, path: '/users' },
    { name: 'Riders', icon: FiTruck, path: '/riders' },
    { name: 'Bookings', icon: FiClipboard, path: '/bookings' },
    { name: 'Booking Allotment', icon: FiSliders, path: '/booking-allotment-logic' },
    { name: 'Ratings', icon: FiStar, path: '/ratings' },
    { name: 'Analytics', icon: FiTrendingUp, path: '/analytics', disabled: true },
    { name: 'Settings', icon: FiSettings, path: '/settings', disabled: true },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 ease-in-out shadow-xl
        ${isOpen ? 'w-64' : 'w-20'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-gray-200">
          <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${
            isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'
          }`}>
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-md p-1">
              <img 
                src={logo} 
                alt="Helmet Washer Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900 truncate">Helmet Washer</h1>
              <p className="text-xs text-gray-500 truncate">Admin Panel</p>
            </div>
          </div>
          
          <button
            onClick={onToggle}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            {isOpen ? (
              <FiChevronLeft className="w-5 h-5" />
            ) : (
              <FiChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => `
                group relative flex items-center px-3 py-3 rounded-xl font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-primary-50 text-primary-700' 
                  : item.disabled 
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
                ${!isOpen ? 'justify-center' : ''}
              `}
              onClick={(e) => item.disabled && e.preventDefault()}
            >
              <item.icon className={`shrink-0 transition-all duration-200 ${
                isOpen ? 'w-5 h-5 mr-3' : 'w-6 h-6'
              }`} />
              
              {isOpen && (
                <span className="truncate">{item.name}</span>
              )}
              
              {item.disabled && isOpen && (
                <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                  Soon
                </span>
              )}
              
              {/* Tooltip for collapsed state */}
              {!isOpen && (
                <div className="absolute left-full ml-6 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap pointer-events-none z-50">
                  {item.name}
                  <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-2 w-2 h-2 bg-gray-900 rotate-45" />
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className={`p-4 border-t border-gray-200 transition-all duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}>
          {isOpen && (
            <div className="bg-linear-to-br from-gray-50 to-gray-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-700">Version 1.0.0</p>
              <p className="text-xs text-gray-500 mt-0.5">Admin Dashboard</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;