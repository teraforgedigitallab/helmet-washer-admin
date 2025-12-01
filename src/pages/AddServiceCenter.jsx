import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { OpenStreetMapProvider, GeoSearchControl } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiMapPin, FiClock, FiPhone, FiPackage, FiStar, FiCheckCircle, FiNavigation } from 'react-icons/fi';

const AddServiceCenter = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const markerRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    pincode: '',
    city: '',
    locality: '',
    rating: 4.5,
    reviewCount: 0,
    distance: '',
    status: 'Open',
    phone: '',
    coordinates: {
      latitude: 19.0760,
      longitude: 72.8777
    },
    operatingHours: {
      weekday: '9:00 AM - 8:00 PM',
      saturday: '9:00 AM - 9:00 PM',
      sunday: '10:00 AM - 7:00 PM',
    },
    services: []
  });

  const availableServices = [
    'Waterless Cleaning',
    'Quick Repair',
    'Deep Clean',
    'Helmet Repair',
    'Maintenance Service'
  ];

  const LocationMarker = () => {
    const map = useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setFormData(prev => ({
          ...prev,
          coordinates: { latitude: lat, longitude: lng }
        }));
        reverseGeocode(lat, lng);
      },
      locationfound(e) {
        const { lat, lng } = e.latlng;
        setFormData(prev => ({
          ...prev,
          coordinates: { latitude: lat, longitude: lng }
        }));
        map.flyTo(e.latlng, 15);
        reverseGeocode(lat, lng);
      },
    });

    useEffect(() => {
      map.flyTo([formData.coordinates.latitude, formData.coordinates.longitude], 15);
    }, [formData.coordinates.latitude, formData.coordinates.longitude, map]);

    useEffect(() => {
      const searchControl = new GeoSearchControl({
        provider: new OpenStreetMapProvider(),
        style: 'bar',
        showMarker: false,
        showPopup: false,
        autoClose: true,
        retainZoomLevel: false,
        animateZoom: true,
        keepResult: true,
      });
      const mapInstance = map;
      mapInstance.addControl(searchControl);

      mapInstance.on('geosearch/showlocation', (result) => {
        const { x, y, label } = result.location;
        setFormData(prev => ({
          ...prev,
          address: label,
          coordinates: { latitude: y, longitude: x }
        }));
        reverseGeocode(y, x);
      });

      return () => { mapInstance.removeControl(searchControl) }
    }, [map]);


    return formData.coordinates === null ? null : (
      <Marker
        position={[formData.coordinates.latitude, formData.coordinates.longitude]}
        draggable={true}
        ref={markerRef}
        eventHandlers={{
          dragend() {
            const marker = markerRef.current;
            if (marker != null) {
              const { lat, lng } = marker.getLatLng();
              setFormData(prev => ({
                ...prev,
                coordinates: { latitude: lat, longitude: lng }
              }));
              reverseGeocode(lat, lng);
            }
          },
        }}
      />
    );
  }

  const reverseGeocode = async (lat, lng) => {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await response.json();
    setFormData(prev => ({
      ...prev,
      address: data.display_name,
      pincode: data.address.postcode,
      city: data.address.city,
      locality: data.address.suburb
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setFormData(prev => ({
            ...prev,
            coordinates: {
              latitude: lat,
              longitude: lng
            }
          }));
          reverseGeocode(lat, lng);
        },
        (error) => {
          toast.error('Unable to get your location');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOperatingHoursChange = (day, value) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: value
      }
    }));
  };

  const handleServiceToggle = (service) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.services.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    try {
      setLoading(true);

      const docData = {
        ...formData,
        rating: parseFloat(formData.rating),
        reviewCount: parseInt(formData.reviewCount),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'ServiceCenters'), docData);
      toast.success('Service center added successfully!');
      navigate('/service-centers');
    } catch (error) {
      console.error('Error adding service center:', error);
      toast.error('Failed to add service center');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/service-centers')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors group"
        >
          <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Service Centers
        </button>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add New Service Center</h1>
          <p className="text-sm sm:text-base text-gray-600">Create a new service center location for your network</p>
        </div>

        {/* Form Container */}
        <div className="max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Map Section */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <FiMapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">Location & Map</h3>
                  <p className="text-sm text-gray-600">Pin the exact location on the map</p>
                </div>
                {/* <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors"
                >
                  <FiNavigation className="w-4 h-4" />
                  <span className="text-sm font-medium">Use Current</span>
                </button> */}
              </div>

              {/* Location Search */}
              {/* <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Search Location
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    id="location-search"
                    type="text"
                    placeholder="Search for a location..."
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>
              </div> */}

              {/* Map Container */}
              <div className="relative">
                <MapContainer
                  center={[formData.coordinates.latitude, formData.coordinates.longitude]}
                  zoom={13}
                  scrollWheelZoom={false}
                  className="w-full h-96 rounded-xl overflow-hidden border border-gray-200"
                  style={{ minHeight: '384px', zIndex: 1 }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationMarker />
                </MapContainer>
              </div>

              {/* Coordinates Display */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    value={formData.coordinates.latitude}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 font-mono text-sm"
                    step="any"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    value={formData.coordinates.longitude}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 font-mono text-sm"
                    step="any"
                  />
                </div>
              </div>
            </div>

            {/* Basic Information Section */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <div className="p-2.5 bg-primary-50 rounded-xl">
                  <FiMapPin className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Basic Information</h3>
                  <p className="text-sm text-gray-600">Essential details about the service center</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Center Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                    placeholder="e.g., Jayanagar Center"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 placeholder:text-gray-400 resize-none"
                  placeholder="123, 4th Block, Jayanagar, Bangalore - 560041"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                    placeholder="e.g., 560041"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                    placeholder="e.g., Bangalore"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Locality
                  </label>
                  <input
                    type="text"
                    name="locality"
                    value={formData.locality}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                    placeholder="e.g., Jayanagar"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="relative">
                    <FiStar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="number"
                      name="rating"
                      value={formData.rating}
                      onChange={handleInputChange}
                      min="0"
                      max="5"
                      step="0.1"
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Review Count
                  </label>
                  <input
                    type="number"
                    name="reviewCount"
                    value={formData.reviewCount}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                    <option value="Closing Soon">Closing Soon</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Operating Hours Section */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <FiClock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Operating Hours</h3>
                  <p className="text-sm text-gray-600">Set the working hours for each day</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Monday - Friday
                  </label>
                  <input
                    type="text"
                    value={formData.operatingHours.weekday}
                    onChange={(e) => handleOperatingHoursChange('weekday', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                    placeholder="9:00 AM - 8:00 PM"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Saturday
                  </label>
                  <input
                    type="text"
                    value={formData.operatingHours.saturday}
                    onChange={(e) => handleOperatingHoursChange('saturday', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                    placeholder="9:00 AM - 9:00 PM"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sunday
                  </label>
                  <input
                    type="text"
                    value={formData.operatingHours.sunday}
                    onChange={(e) => handleOperatingHoursChange('sunday', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                    placeholder="10:00 AM - 7:00 PM"
                  />
                </div>
              </div>
            </div>

            {/* Services Section */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <div className="p-2.5 bg-green-50 rounded-xl">
                  <FiPackage className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Available Services <span className="text-red-500">*</span></h3>
                  <p className="text-sm text-gray-600">Select the services offered at this center</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableServices.map((service) => (
                  <label
                    key={service}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${formData.services.includes(service)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.services.includes(service)}
                      onChange={() => handleServiceToggle(service)}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-900">{service}</span>
                    {formData.services.includes(service) && (
                      <FiCheckCircle className="w-5 h-5 text-primary-600 ml-auto" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => navigate('/service-centers')}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-linear-to-r from-primary-500 to-primary-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Add Service Center
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddServiceCenter;