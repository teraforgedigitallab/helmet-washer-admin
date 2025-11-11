import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiMapPin, FiClock, FiStar, FiSearch, FiFilter } from 'react-icons/fi';

const ServiceCenters = () => {
  const [serviceCenters, setServiceCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchServiceCenters();
  }, []);

  const fetchServiceCenters = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'serviceCenters'));
      const centers = [];
      querySnapshot.forEach((doc) => {
        centers.push({ id: doc.id, ...doc.data() });
      });
      setServiceCenters(centers);
    } catch (error) {
      console.error('Error fetching service centers:', error);
      toast.error('Failed to fetch service centers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'serviceCenters', id));
        setServiceCenters(serviceCenters.filter(center => center.id !== id));
        toast.success('Service center deleted successfully');
      } catch (error) {
        console.error('Error deleting service center:', error);
        toast.error('Failed to delete service center');
      }
    }
  };

  const filteredCenters = serviceCenters.filter(center => {
    const matchesSearch = center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         center.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || center.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      'Open': { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
      'Closed': { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
      'Closing Soon': { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' }
    };
    
    const config = statusConfig[status] || statusConfig['Closed'];
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`}></div>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-10 bg-gray-200 rounded-lg w-64"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-40"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Service Centers</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage and monitor all {serviceCenters.length} service center locations
          </p>
        </div>
        <Link
          to="/service-centers/add"
          className="inline-flex items-center justify-center gap-2 bg-linear-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
        >
          <FiPlus className="w-5 h-5" />
          <span>Add Center</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 placeholder:text-gray-400"
          />
        </div>
        <div className="relative">
          <FiFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-48 pl-12 pr-10 py-3.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
            <option value="Closing Soon">Closing Soon</option>
          </select>
        </div>
      </div>

      {/* Service Centers Grid */}
      {filteredCenters.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCenters.map((center) => (
            <div key={center.id} className="group bg-white rounded-2xl border border-gray-200 hover:border-primary-200 hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-linear-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                      <FiMapPin className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 truncate text-lg mb-1">
                        {center.name}
                      </h3>
                      <StatusBadge status={center.status} />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Link
                      to={`/service-centers/edit/${center.id}`}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <FiEdit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(center.id, center.name)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Address */}
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed min-h-10">
                  {center.address}
                </p>

                {/* Services */}
                <div>
                  <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                    Available Services
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {center.services?.slice(0, 3).map((service, index) => (
                      <span
                        key={index}
                        className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium hover:bg-gray-200 transition-colors"
                      >
                        {service}
                      </span>
                    )) || <span className="text-xs text-gray-400 italic">No services listed</span>}
                    {center.services?.length > 3 && (
                      <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-xs rounded-lg font-semibold">
                        +{center.services.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <FiStar className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-gray-900">{center.rating || 'N/A'}</span>
                    <span className="text-gray-500 text-sm">({center.reviewCount || 0})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <FiClock className="w-4 h-4" />
                    <span className="text-xs font-medium">{center.operatingHours?.weekday || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 sm:py-20">
          <div className="w-24 h-24 bg-linear-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <FiMapPin className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {searchTerm || filterStatus !== 'all' ? 'No matching centers found' : 'No service centers yet'}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-8 max-w-md mx-auto px-4 leading-relaxed">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria to find what you\'re looking for.' 
              : 'Get started by adding your first service center location to expand your network.'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <Link
              to="/service-centers/add"
              className="inline-flex items-center gap-2 bg-linear-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <FiPlus className="w-5 h-5" />
              Add Your First Center
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceCenters;