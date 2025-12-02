import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';
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

import { FiArrowLeft, FiMapPin, FiClock, FiPhone, FiPackage, FiStar, FiCheckCircle, FiNavigation } from 'react-icons/fi';
import TimePicker from '../components/TimePicker';

const EditServiceCenter = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const markerRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    pincode: '',
    city: '',
    locality: '',
    distance: '',
    phone: '',
    coordinates: {
      latitude: 19.0760,
      longitude: 72.8777
    },
    operatingHours: {
      monday: { open: '09:00 AM', close: '08:00 PM', isClosed: false },
      tuesday: { open: '09:00 AM', close: '08:00 PM', isClosed: false },
      wednesday: { open: '09:00 AM', close: '08:00 PM', isClosed: false },
      thursday: { open: '09:00 AM', close: '08:00 PM', isClosed: false },
      friday: { open: '09:00 AM', close: '08:00 PM', isClosed: false },
      saturday: { open: '09:00 AM', close: '09:00 PM', isClosed: false },
      sunday: { open: '10:00 AM', close: '07:00 PM', isClosed: false },
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

  useEffect(() => {
    fetchServiceCenter();
  }, [id]);

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

  const fetchServiceCenter = async () => {
    try {
      setFetching(true);
      const docRef = doc(db, 'ServiceCenters', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          name: data.name || '',
          address: data.address || '',
          pincode: data.pincode || '',
          city: data.city || '',
          locality: data.locality || '',
          distance: data.distance || '',
          phone: data.phone || '',
          coordinates: data.coordinates || {
            latitude: 19.0760,
            longitude: 72.8777
          },
          operatingHours: data.operatingHours ? Object.entries(data.operatingHours).reduce((acc, [day, hours]) => {
            const [open, close] = hours.split(' - ');
            acc[day] = { open, close, isClosed: hours === '00:00 AM - 00:00 PM' };
            return acc;
          }, {}) : {
            monday: { open: '09:00 AM', close: '08:00 PM', isClosed: false },
            tuesday: { open: '09:00 AM', close: '08:00 PM', isClosed: false },
            wednesday: { open: '09:00 AM', close: '08:00 PM', isClosed: false },
            thursday: { open: '09:00 AM', close: '08:00 PM', isClosed: false },
            friday: { open: '09:00 AM', close: '08:00 PM', isClosed: false },
            saturday: { open: '09:00 AM', close: '09:00 PM', isClosed: false },
            sunday: { open: '10:00 AM', close: '07:00 PM', isClosed: false },
          },
          services: data.services || []
        });
      } else {
        toast.error('Service center not found');
        navigate('/service-centers');
      }
    } catch (error) {
      console.error('Error fetching service center:', error);
      toast.error('Failed to fetch service center details');
    } finally {
      setFetching(false);
    }
  };

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

  const handleOperatingHoursChange = (day, part, value) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: { ...prev.operatingHours[day], [part]: value },
      },
    }));
  };

  const handleOperatingHoursClose = (day, isClosed) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: { ...prev.operatingHours[day], isClosed: isClosed },
      },
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

      const operatingHours = Object.entries(formData.operatingHours).reduce((acc, [day, hours]) => {
        acc[day] = hours.isClosed ? '00:00 AM - 00:00 PM' : `${hours.open} - ${hours.close}`;
        return acc;
      }, {});

      const docData = {
        ...formData,
        operatingHours,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'ServiceCenters', id), docData);
      toast.success('Service center updated successfully!');
      navigate('/service-centers');
    } catch (error) {
      console.error('Error updating service center:', error);
      toast.error('Failed to update service center');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceCenter();
  }, []);

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Service Center</h1>
          <p className="text-sm sm:text-base text-gray-600">Update service center information and settings</p>
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
                  <p className="text-sm text-gray-600">Adjust the location pin on the map</p>
                </div>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors"
                >
                  <FiNavigation className="w-4 h-4" />
                  <span className="text-sm font-medium">Use Current</span>
                </button>
              </div>

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

              {/* View on Google Maps */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                    <FiMapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">Preview Location</h4>
                    <p className="text-xs text-blue-700 mb-3">
                      View this location on Google Maps to verify the exact address
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${formData.coordinates.latitude},${formData.coordinates.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Open in Google Maps
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
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
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                  const isClosed = formData.operatingHours[day]?.isClosed;
                  return (
                    <div key={day} className={`p-4 border rounded-xl transition-all duration-200 ${isClosed ? 'bg-gray-100' : 'bg-white'}`}>
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-semibold text-gray-700 capitalize">
                          {day}
                        </label>
                        <div className="flex items-center">
                          <label htmlFor={`${day}-closed`} className="mr-2 text-sm text-gray-900">Closed</label>
                          <input
                            type="checkbox"
                            id={`${day}-closed`}
                            checked={isClosed}
                            onChange={(e) => handleOperatingHoursClose(day, e.target.checked)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                          />
                        </div>
                      </div>
                      {!isClosed && (
                        <div className="flex items-center gap-4 mt-4">
                          <TimePicker
                            value={formData.operatingHours[day]?.open}
                            onChange={(value) => handleOperatingHoursChange(day, 'open', value)}
                          />
                          <span className="text-gray-500">-</span>
                          <TimePicker
                            value={formData.operatingHours[day]?.close}
                            onChange={(value) => handleOperatingHoursChange(day, 'close', value)}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
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
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </span>
                ) : (
                  'Update Service Center'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditServiceCenter;