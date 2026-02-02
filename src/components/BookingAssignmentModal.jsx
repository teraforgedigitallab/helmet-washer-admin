import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';
import {
  FiX, FiSearch, FiUser, FiMapPin, FiPhone, FiStar, FiTruck,
  FiCheckCircle, FiClock, FiNavigation, FiPackage
} from 'react-icons/fi';

const BookingAssignmentModal = ({ booking, isOpen, onClose, onSuccess }) => {
  const [riders, setRiders] = useState([]);
  const [filteredRiders, setFilteredRiders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRider, setSelectedRider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingRiders, setFetchingRiders] = useState(true);
  const [assignmentType, setAssignmentType] = useState('pickup');

  useEffect(() => {
    if (isOpen && booking) {
      fetchRiders();
      determineAssignmentType();
      setSelectedRider(null);
    }
  }, [isOpen, booking]);

  useEffect(() => {
    filterRiders();
  }, [riders, searchTerm]);

  const determineAssignmentType = () => {
    const currentStage = booking?.tracking?.currentStage;
    if (currentStage === 'pickup_scheduled') {
      setAssignmentType('pickup');
    } else if (currentStage === 'ready_for_delivery') {
      setAssignmentType('delivery');
    } else {
      setAssignmentType('pickup');
    }
  };

  const fetchRiders = async () => {
    try {
      setFetchingRiders(true);
      const querySnapshot = await getDocs(collection(db, 'Riders'));
      const ridersData = [];
      querySnapshot.forEach((doc) => {
        const riderData = { id: doc.id, ...doc.data() };
        ridersData.push(riderData);
      });
      setRiders(ridersData);
    } catch (error) {
      console.error('Error fetching riders:', error);
      toast.error('Failed to fetch riders');
    } finally {
      setFetchingRiders(false);
    }
  };

  const filterRiders = () => {
    if (!searchTerm.trim()) {
      setFilteredRiders(riders);
      return;
    }

    const filtered = riders.filter(rider =>
      rider.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rider.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rider.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRiders(filtered);
  };

  const assignRider = async () => {
    if (!selectedRider) {
      toast.error('Please select a rider');
      return;
    }

    try {
      setLoading(true);
      const now = Timestamp.now();

      // Determine which rider field to update and next stage
      const riderField = assignmentType === 'pickup' ? 'pickupRider' : 'deliveryRider';
      const nextStage = assignmentType === 'pickup' ? 'out_for_pickup' : 'out_for_delivery';

      // Generate OTP for Doorstep services
      const isDoorstep = booking.deliveryType === 'doorstep';
      const otp = isDoorstep ? Math.floor(1000 + Math.random() * 9000).toString() : null;

      console.log('Assigning rider:', assignmentType, 'Next stage:', nextStage);

      // Find the index of current stage (pickup_scheduled or ready_for_delivery)
      const currentStageIndex = booking.tracking.stages.findIndex(
        s => s.stage === booking.tracking.currentStage
      );

      // Find the index of next stage (out_for_pickup or out_for_delivery)
      const nextStageIndex = booking.tracking.stages.findIndex(
        s => s.stage === nextStage
      );

      console.log('Current stage:', booking.tracking.currentStage, 'index:', currentStageIndex);
      console.log('Next stage:', nextStage, 'index:', nextStageIndex);

      if (currentStageIndex === -1 || nextStageIndex === -1) {
        throw new Error('Invalid stage configuration');
      }

      // Update stages array
      const updatedStages = booking.tracking.stages.map((stage, index) => {
        // Complete the current stage (pickup_scheduled or ready_for_delivery)
        if (index === currentStageIndex) {
          return { 
            ...stage, 
            status: 'completed', 
            completedAt: now 
          };
        }
        // Start the next stage (out_for_pickup or out_for_delivery)
        if (index === nextStageIndex) {
          return { 
            ...stage, 
            status: 'in_progress', 
            startedAt: now 
          };
        }
        return stage;
      });

      // Determine booking status
      let newStatus = 'in_progress';
      if (assignmentType === 'pickup') {
        newStatus = 'assigned_for_pickup';
      } else if (assignmentType === 'delivery') {
        newStatus = 'assigned_for_delivery';
      }

      const riderData = {
        riderId: selectedRider.id,
        riderName: selectedRider.name,
        riderPhone: selectedRider.phoneNumber,
        assignedAt: now,
        assignedBy: 'admin',
        ...(isDoorstep && { otp })
      };

      // Determine the rider ID field name for Rider App queries
      const riderIdField = assignmentType === 'pickup' ? 'pickupRiderID' : 'deliveryRiderID';

      const updateData = {
        [riderField]: riderData,
        [riderIdField]: selectedRider.id,
        isAvailableforPickup: false,
        tracking: {
          ...booking.tracking,
          currentStage: nextStage,
          stages: updatedStages
        },
        status: newStatus,
        updatedAt: now
      };

      console.log('Updating booking with:', updateData);

      await updateDoc(doc(db, 'Bookings', booking.id), updateData);

      // Create rider assignment record
      await addDoc(collection(db, 'RiderAssignments'), {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        riderId: selectedRider.id,
        riderName: selectedRider.name,
        assignmentType,
        customerName: `${booking.customerDetails?.firstName || ''} ${booking.customerDetails?.lastName || ''}`.trim(),
        customerAddress: booking.addressDetails?.fullAddress,
        assignedAt: now,
        assignedBy: 'admin',
        status: 'active',
        ...(isDoorstep && { otp })
      });

      toast.success(`${assignmentType === 'pickup' ? 'Pickup' : 'Delivery'} rider assigned successfully!`);

      onSuccess(assignmentType);
      onClose();
    } catch (error) {
      console.error('Error assigning rider:', error);
      toast.error('Failed to assign rider');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Assign Rider for {assignmentType === 'pickup' ? 'Pickup' : 'Delivery'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Booking: {booking.bookingNumber}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row h-[calc(90vh-200px)]">
          {/* Left Panel - Booking Details */}
          <div className="w-full md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-gray-200 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">
                  Booking Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FiUser className="w-4 h-4 text-gray-400" />
                    <span>{`${booking.customerDetails?.firstName || ''} ${booking.customerDetails?.lastName || ''}`.trim()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiPhone className="w-4 h-4 text-gray-400" />
                    <span>{booking.customerDetails?.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiPackage className="w-4 h-4 text-gray-400" />
                    <span>{booking.serviceType}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">
                  {assignmentType === 'pickup' ? 'Pickup' : 'Delivery'} Address
                </h4>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <FiMapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <span>{booking.addressDetails?.fullAddress}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">
                  Schedule
                </h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <FiClock className="w-4 h-4 text-gray-400" />
                    <span>{booking.schedule?.timeSlot?.time || booking.timeSlot?.time || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {assignmentType === 'pickup' && booking.pickupRider && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <h4 className="text-sm font-bold text-yellow-800 mb-1">
                    Currently Assigned (Pickup)
                  </h4>
                  <p className="text-sm text-yellow-700">{booking.pickupRider.riderName}</p>
                </div>
              )}

              {assignmentType === 'delivery' && booking.deliveryRider && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <h4 className="text-sm font-bold text-yellow-800 mb-1">
                    Currently Assigned (Delivery)
                  </h4>
                  <p className="text-sm text-yellow-700">{booking.deliveryRider.riderName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Rider Selection */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search riders by name, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
            </div>

            {/* Riders List */}
            {fetchingRiders ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-gray-600">Loading riders...</p>
                </div>
              </div>
            ) : filteredRiders.length > 0 ? (
              <div className="space-y-3">
                {filteredRiders.map((rider) => (
                  <div
                    key={rider.id}
                    onClick={() => setSelectedRider(rider)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedRider?.id === rider.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
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
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>

                      {/* Rider Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{rider.name}</h3>
                          {selectedRider?.id === rider.id && (
                            <FiCheckCircle className="w-5 h-5 text-primary-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <FiPhone className="w-3 h-3" />
                            <span>{rider.phoneNumber}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-900">
                          {rider.totalOrders || 0}
                        </div>
                        <div className="text-xs text-gray-500">Orders</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FiTruck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No riders found</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              {selectedRider ? (
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="w-5 h-5 text-green-600" />
                  <span>
                    Selected: <strong className="text-gray-900">{selectedRider.name}</strong>
                  </span>
                </div>
              ) : (
                <span>Please select a rider to continue</span>
              )}
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={assignRider}
                disabled={!selectedRider || loading}
                className="flex-1 sm:flex-none px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Assigning...
                  </span>
                ) : (
                  `Confirm & Assign for ${assignmentType === 'pickup' ? 'Pickup' : 'Delivery'}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingAssignmentModal;