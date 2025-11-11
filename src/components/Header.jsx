import React from 'react';
import { FiBell, FiSearch, FiMenu } from 'react-icons/fi';

const Header = ({ title, subtitle, onMenuClick }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 shrink-0 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={onMenuClick}
            className="flex lg:hidden items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <FiMenu className="w-5 h-5" />
          </button>
          
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {title || 'Dashboard'}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search */}
          <div className="relative hidden md:block">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2.5 w-56 lg:w-64 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white outline-none transition-all duration-200 text-sm placeholder:text-gray-400"
            />
          </div>
          
          {/* Notifications */}
          <button className="relative flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
            <FiBell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full ring-2 ring-white"></span>
          </button>
          
          {/* Profile */}
          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            <div className="w-10 h-10 bg-linear-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 leading-tight">Admin User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;