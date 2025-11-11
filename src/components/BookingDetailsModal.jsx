import React, { useState, useEffect } from 'react';
import { doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';
import { 
  FiX, FiCheckCircle, FiClock, FiPackage, FiTruck, 
  FiAlertCircle, FiPlay, FiUser, FiPhone, FiMapPin,
  FiUserPlus
} from 'react-icons/fi';
import BookingAssignmentModal from './BookingAssignmentModal';

const BookingDetailsModal = ({ booking: initialBooking, isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [booking, setBooking] = useState(initialBooking);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (isOpen && initialBooking) {
      setBooking(initialBooking);
      setRefreshKey(prev => prev + 1);
    }
  }, [initialBooking, isOpen]);

  if (!isOpen || !booking) return null;

  const refreshBookingData = async () => {
    try {
      const bookingDoc = await getDoc(doc(db, 'Bookings', booking.id));
      if (bookingDoc.exists()) {
        const updatedBooking = { id: bookingDoc.id, ...bookingDoc.data() };
        setBooking(updatedBooking);
        setRefreshKey(prev => prev + 1);
        return updatedBooking;
      }
    } catch (error) {
      console.error('Error refreshing booking:', error);
    }
    return booking;
  };

  const getStageInfo = () => {
    const currentStage = booking?.tracking?.currentStage;
    
    const stageMap = {
      'pickup_scheduled': {
        type: 'assignment_required',
        assignmentType: 'pickup',
        title: 'Assign Pickup Rider',
        description: 'A rider needs to be assigned to pick up the helmet',
        actionText: 'Assign Pickup Rider',
        icon: FiUserPlus,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-900',
        descColor: 'text-blue-800',
        buttonColor: 'bg-blue-600 hover:bg-blue-700',
        iconBgColor: 'bg-blue-500',
        nextStage: 'helmet_picked_up'
      },
      'helmet_picked_up': {
        type: 'rider_action',
        title: 'Waiting for Pickup Completion',
        description: 'Rider needs to confirm helmet pickup',
        actionText: 'Confirm Pickup (Rider)',
        icon: FiTruck,
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-900',
        descColor: 'text-orange-800',
        buttonColor: 'bg-orange-600 hover:bg-orange-700',
        iconBgColor: 'bg-orange-500',
        nextStage: 'quality_check'
      },
      'quality_check': {
        type: 'admin_action',
        title: 'Quality Check Required',
        description: 'Perform initial quality assessment of the helmet',
        actionText: 'Complete Quality Check',
        icon: FiCheckCircle,
        bgColor: 'bg-primary-50',
        borderColor: 'border-primary-200',
        textColor: 'text-primary-900',
        descColor: 'text-primary-800',
        buttonColor: 'bg-primary-600 hover:bg-primary-700',
        iconBgColor: 'bg-primary-500',
        nextStage: 'cleaning_started'
      },
      'cleaning_started': {
        type: 'admin_action',
        title: 'Complete Cleaning Process',
        description: 'Mark the helmet cleaning as completed',
        actionText: 'Complete Cleaning',
        icon: FiPackage,
        bgColor: 'bg-primary-50',
        borderColor: 'border-primary-200',
        textColor: 'text-primary-900',
        descColor: 'text-primary-800',
        buttonColor: 'bg-primary-600 hover:bg-primary-700',
        iconBgColor: 'bg-primary-500',
        nextStage: 'cleaning_completed'
      },
      'cleaning_completed': {
        type: 'admin_action',
        title: 'Final Quality Check',
        description: 'Perform final quality assurance check',
        actionText: 'Complete Quality Assurance',
        icon: FiCheckCircle,
        bgColor: 'bg-primary-50',
        borderColor: 'border-primary-200',
        textColor: 'text-primary-900',
        descColor: 'text-primary-800',
        buttonColor: 'bg-primary-600 hover:bg-primary-700',
        iconBgColor: 'bg-primary-500',
        nextStage: 'quality_assurance'
      },
      'quality_assurance': {
        type: 'admin_action',
        title: 'Mark Ready for Delivery',
        description: 'Helmet is cleaned and ready for delivery',
        actionText: 'Mark Ready for Delivery',
        icon: FiCheckCircle,
        bgColor: 'bg-primary-50',
        borderColor: 'border-primary-200',
        textColor: 'text-primary-900',
        descColor: 'text-primary-800',
        buttonColor: 'bg-primary-600 hover:bg-primary-700',
        iconBgColor: 'bg-primary-500',
        nextStage: 'ready_for_delivery'
      },
      'ready_for_delivery': {
        type: 'assignment_required',
        assignmentType: 'delivery',
        title: 'Assign Delivery Rider',
        description: 'A rider needs to be assigned to deliver the helmet',
        actionText: 'Assign Delivery Rider',
        icon: FiUserPlus,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-900',
        descColor: 'text-green-800',
        buttonColor: 'bg-green-600 hover:bg-green-700',
        iconBgColor: 'bg-green-500',
        nextStage: 'out_for_delivery'
      },
      'out_for_delivery': {
        type: 'rider_action',
        title: 'Waiting for Delivery Completion',
        description: 'Rider needs to confirm helmet delivery',
        actionText: 'Confirm Delivery (Rider)',
        icon: FiTruck,
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-900',
        descColor: 'text-orange-800',
        buttonColor: 'bg-orange-600 hover:bg-orange-700',
        iconBgColor: 'bg-orange-500',
        nextStage: 'delivered'
      },
      'delivered': {
        type: 'completed',
        title: 'Booking Completed',
        description: 'Helmet has been successfully delivered',
        icon: FiCheckCircle,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-900',
        descColor: 'text-green-800',
        iconBgColor: 'bg-green-500'
      }
    };
    
    return stageMap[currentStage] || null;
  };

  const handleAction = async () => {
    const stageInfo = getStageInfo();
    if (!stageInfo) return;

    if (stageInfo.type === 'assignment_required') {
      setShowAssignmentModal(true);
    } else if (stageInfo.type === 'admin_action') {
      await updateBookingStage(stageInfo.nextStage);
    }
  };

  const handleRiderAction = async () => {
    const stageInfo = getStageInfo();
    if (!stageInfo || stageInfo.type !== 'rider_action') return;

    try {
      setLoading(true);
      const now = Timestamp.now();
      
      let newStatus = 'in_progress';
      if (stageInfo.nextStage === 'delivered') {
        newStatus = 'completed';
      }

      const updatedStages = booking.tracking.stages.map(stage => {
        if (stage.stage === booking.tracking.currentStage) {
          return { ...stage, status: 'completed', completedAt: now };
        }
        if (stage.stage === stageInfo.nextStage) {
          if (stageInfo.nextStage === 'delivered') {
            return { ...stage, status: 'completed', completedAt: now };
          }
          return { ...stage, status: 'in_progress', startedAt: now };
        }
        return stage;
      });

      const updateData = {
        tracking: {
          ...booking.tracking,
          currentStage: stageInfo.nextStage,
          stages: updatedStages
        },
        status: newStatus,
        updatedAt: now
      };

      await updateDoc(doc(db, 'Bookings', booking.id), updateData);
      
      toast.success('Action completed successfully!');
      
      // Refresh booking data from Firestore
      await refreshBookingData();
      
      // Notify parent to refresh
      onSuccess && onSuccess();
    } catch (error) {
      console.error('Error completing rider action:', error);
      toast.error('Failed to complete action');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStage = async (targetStage) => {
    try {
      setLoading(true);
      const now = Timestamp.now();
      
      const updatedStages = booking.tracking.stages.map(stage => {
        if (stage.stage === booking.tracking.currentStage) {
          return { ...stage, status: 'completed', completedAt: now };
        }
        if (stage.stage === targetStage) {
          return { ...stage, status: 'in_progress', startedAt: now };
        }
        return stage;
      });

      let newStatus = 'in_progress';
      if (targetStage === 'ready_for_delivery') {
        newStatus = 'ready_for_delivery';
      }

      const updateData = {
        tracking: {
          ...booking.tracking,
          currentStage: targetStage,
          stages: updatedStages
        },
        status: newStatus,
        updatedAt: now
      };

      await updateDoc(doc(db, 'Bookings', booking.id), updateData);
      
      toast.success('Stage updated successfully!');
      
      // Refresh booking data from Firestore
      await refreshBookingData();
      
      // Notify parent to refresh
      onSuccess && onSuccess();
    } catch (error) {
      console.error('Error updating stage:', error);
      toast.error('Failed to update stage');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentSuccess = async () => {
    setShowAssignmentModal(false);
    
    // Refresh booking data from Firestore
    await refreshBookingData();
    
    // Notify parent to refresh
    onSuccess && onSuccess();
  };

  const stageInfo = getStageInfo();

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" key={refreshKey}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-linear-to-r from-primary-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {booking.bookingNumber}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Customer & Booking Info */}
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Details */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                    Customer Information
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <FiUser className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {`${booking.customerDetails?.firstName || ''} ${booking.customerDetails?.lastName || ''}`.trim()}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <FiPhone className="w-3 h-3" />
                        {booking.customerDetails?.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 mt-3">
                    <FiMapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Delivery Address</p>
                      <p className="text-sm text-gray-600">{booking.addressDetails?.fullAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                    Service Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service Type:</span>
                      <span className="font-medium text-gray-900">{booking.serviceType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Helmet Type:</span>
                      <span className="font-medium text-gray-900">{booking.helmetDetails?.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time Slot:</span>
                      <span className="font-medium text-gray-900">{booking.timeSlot?.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-bold text-green-600">
                        ₹{booking.pricing?.totalAmount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Stage Info */}
            {stageInfo && (
              <div className="p-6 border-b border-gray-200">
                <div className={`${stageInfo.bgColor} border ${stageInfo.borderColor} rounded-xl p-4`}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-10 h-10 ${stageInfo.iconBgColor} rounded-lg flex items-center justify-center shrink-0`}>
                      <stageInfo.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-base font-bold ${stageInfo.textColor} mb-1`}>
                        {stageInfo.title}
                      </h3>
                      <p className={`text-sm ${stageInfo.descColor}`}>
                        {stageInfo.description}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {stageInfo.type === 'admin_action' || stageInfo.type === 'assignment_required' ? (
                    <button
                      onClick={handleAction}
                      disabled={loading}
                      className={`w-full ${stageInfo.buttonColor} text-white px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2`}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <stageInfo.icon className="w-4 h-4" />
                          {stageInfo.actionText}
                        </>
                      )}
                    </button>
                  ) : stageInfo.type === 'rider_action' ? (
                    <div>
                      <div className="bg-orange-100 border border-orange-300 rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <FiAlertCircle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-orange-900">Waiting for Rider</p>
                            <p className="text-xs text-orange-700 mt-1">
                              The assigned rider needs to complete this step. Admin cannot proceed until rider confirms.
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleRiderAction}
                        disabled={loading}
                        className="w-full bg-orange-600 text-white px-4 py-2.5 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2 text-sm"
                      >
                        {loading ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <FiPlay className="w-4 h-4" />
                            {stageInfo.actionText} (Testing)
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
                      <FiCheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-900">Booking Completed</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Assigned Riders */}
            {(booking.pickupRider || booking.deliveryRider) && (
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                  Assigned Riders
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {booking.pickupRider && (
                    <div className="bg-linear-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <FiTruck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-blue-600">Pickup Rider</p>
                          <p className="font-semibold text-blue-900">{booking.pickupRider.riderName}</p>
                        </div>
                      </div>
                      <p className="text-sm text-blue-800">{booking.pickupRider.riderPhone}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Assigned: {booking.pickupRider.assignedAt?.toDate().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  )}
                  
                  {booking.deliveryRider && (
                    <div className="bg-linear-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                          <FiTruck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-green-600">Delivery Rider</p>
                          <p className="font-semibold text-green-900">{booking.deliveryRider.riderName}</p>
                        </div>
                      </div>
                      <p className="text-sm text-green-800">{booking.deliveryRider.riderPhone}</p>
                      <p className="text-xs text-green-600 mt-1">
                        Assigned: {booking.deliveryRider.assignedAt?.toDate().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Progress Timeline */}
            <div className="p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                Progress Timeline
              </h3>
              <div className="space-y-4">
                {booking.tracking?.stages?.map((stage, index) => {
                  const isCompleted = stage.status === 'completed';
                  const isInProgress = stage.status === 'in_progress';
                  
                  return (
                    <div key={stage.stage} className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isCompleted ? 'bg-green-500 text-white' :
                        isInProgress ? 'bg-blue-500 text-white' :
                        'bg-gray-200 text-gray-400'
                      }`}>
                        {isCompleted ? (
                          <FiCheckCircle className="w-4 h-4" />
                        ) : isInProgress ? (
                          <FiClock className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-bold">{index + 1}</span>
                        )}
                      </div>
                      
                      <div className="flex-1 pb-4">
                        <h4 className={`font-semibold text-sm ${
                          isCompleted ? 'text-green-700' :
                          isInProgress ? 'text-blue-700' :
                          'text-gray-500'
                        }`}>
                          {stage.description}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            isCompleted ? 'bg-green-100 text-green-800' :
                            isInProgress ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {stage.status.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          
                          {(stage.completedAt || stage.startedAt) && (
                            <span className="text-xs text-gray-500">
                              {stage.completedAt ? 
                                stage.completedAt.toDate().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) :
                                stage.startedAt.toDate().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <BookingAssignmentModal
          booking={booking}
          isOpen={showAssignmentModal}
          onClose={() => setShowAssignmentModal(false)}
          onSuccess={handleAssignmentSuccess}
        />
      )}
    </>
  );
};

export default BookingDetailsModal;