import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import ServiceCenters from './pages/ServiceCenters';
import AddServiceCenter from './pages/AddServiceCenter';
import EditServiceCenter from './pages/EditServiceCenter';
import Users from './pages/Users';
import Riders from './pages/Riders';
import Bookings from './pages/Bookings';
import Ratings from './pages/Ratings';
import Coupons from './pages/Coupons';
import Test from './pages/Test';
import BookingAllotmentLogic from './pages/BookingAllotmentLogic';

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Router>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
          }`}>
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

          <main className="flex-1 overflow-auto bg-gray-50">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/service-centers" element={<ServiceCenters />} />
              <Route path="/service-centers/add" element={<AddServiceCenter />} />
              <Route path="/service-centers/edit/:id" element={<EditServiceCenter />} />
              <Route path="/users" element={<Users />} />
              <Route path="/riders" element={<Riders />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/ratings" element={<Ratings />} />
              <Route path="/coupons" element={<Coupons />} />
              <Route path="/booking-allotment-logic" element={<BookingAllotmentLogic />} />
              <Route path="/test" element={<Test />} />
            </Routes>
          </main>
        </div>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#ffffff',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            success: {
              style: {
                background: '#16a34a',
              },
            },
            error: {
              style: {
                background: '#dc2626',
              },
            },
          }}
        />
      </div>
    </Router>
  );
};

export default App;