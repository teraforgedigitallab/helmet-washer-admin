import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';
import {
    FiClipboard, FiSearch, FiFilter, FiUser, FiPhone, FiDollarSign,
    FiMapPin, FiClock, FiPackage, FiTruck, FiCreditCard, FiCheckCircle,
    FiXCircle, FiAlertCircle, FiEye
} from 'react-icons/fi';
import BookingDetailsModal from '../components/BookingDetailsModal';

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const querySnapshot = await getDocs(collection(db, 'Bookings'));
            const bookingsData = [];
            querySnapshot.forEach((doc) => {
                bookingsData.push({ id: doc.id, ...doc.data() });
            });
            setBookings(bookingsData);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return '₹0';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: FiAlertCircle },
            'assigned_for_pickup': { bg: 'bg-blue-100', text: 'text-blue-800', icon: FiTruck },
            'in_progress': { bg: 'bg-purple-100', text: 'text-purple-800', icon: FiPackage },
            'ready_for_delivery': { bg: 'bg-orange-100', text: 'text-orange-800', icon: FiTruck },
            'assigned_for_delivery': { bg: 'bg-blue-100', text: 'text-blue-800', icon: FiTruck },
            'completed': { bg: 'bg-green-100', text: 'text-green-800', icon: FiCheckCircle },
            'cancelled': { bg: 'bg-red-100', text: 'text-red-800', icon: FiXCircle }
        };

        const config = statusConfig[status] || statusConfig['pending'];

        return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.text}`}>
                <config.icon className="w-3 h-3" />
                {status?.replace('_', ' ').toUpperCase()}
            </span>
        );
    };

    const getPaymentStatusBadge = (status) => {
        const statusConfig = {
            'pending': { bg: 'bg-orange-100', text: 'text-orange-800', icon: FiCreditCard },
            'completed': { bg: 'bg-green-100', text: 'text-green-800', icon: FiCheckCircle },
            'failed': { bg: 'bg-red-100', text: 'text-red-800', icon: FiXCircle }
        };

        const config = statusConfig[status] || statusConfig['pending'];

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.text}`}>
                <config.icon className="w-3 h-3" />
                PAY {status?.toUpperCase()}
            </span>
        );
    };

    const openBookingDetails = async (booking) => {
        // Fetch fresh data before opening modal
        try {
            const bookingDoc = await getDoc(doc(db, 'Bookings', booking.id));
            if (bookingDoc.exists()) {
                const freshBooking = { id: bookingDoc.id, ...bookingDoc.data() };
                setSelectedBooking(freshBooking);
                setShowDetailsModal(true);
            }
        } catch (error) {
            console.error('Error fetching booking:', error);
            setSelectedBooking(booking);
            setShowDetailsModal(true);
        }
    };

    const handleModalClose = () => {
        setShowDetailsModal(false);
        setSelectedBooking(null);
    };

    const handleModalSuccess = async () => {
        // Refresh bookings list
        await fetchBookings();
        
        // If modal is still open, refresh the selected booking
        if (selectedBooking && showDetailsModal) {
            try {
                const bookingDoc = await getDoc(doc(db, 'Bookings', selectedBooking.id));
                if (bookingDoc.exists()) {
                    const freshBooking = { id: bookingDoc.id, ...bookingDoc.data() };
                    setSelectedBooking(freshBooking);
                }
            } catch (error) {
                console.error('Error refreshing selected booking:', error);
            }
        }
    };

    const filteredBookings = bookings.filter(booking => {
        const matchesSearch =
            booking.bookingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.customerDetails?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.customerDetails?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.customerDetails?.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        switch (sortBy) {
            case 'createdAt':
                return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
            case 'totalAmount':
                return (b.pricing?.totalAmount || 0) - (a.pricing?.totalAmount || 0);
            case 'customerName':
                const nameA = `${a.customerDetails?.firstName || ''} ${a.customerDetails?.lastName || ''}`;
                const nameB = `${b.customerDetails?.firstName || ''} ${b.customerDetails?.lastName || ''}`;
                return nameA.localeCompare(nameB);
            default:
                return 0;
        }
    });

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="animate-pulse space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
                    </div>
                    <div className="space-y-3">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bookings</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                        {bookings.length} helmet washing bookings
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                    <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by booking number, customer name, phone, or transaction ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200"
                    />
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <FiFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full sm:w-48 pl-12 pr-10 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="assigned_for_pickup">Assigned for Pickup</option>
                            <option value="in_progress">In Progress</option>
                            <option value="ready_for_delivery">Ready for Delivery</option>
                            <option value="assigned_for_delivery">Assigned for Delivery</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full sm:w-48 pl-4 pr-10 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none cursor-pointer"
                        >
                            <option value="createdAt">Sort by Date</option>
                            <option value="totalAmount">Sort by Amount</option>
                            <option value="customerName">Sort by Name</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Bookings List - Compact Design */}
            {filteredBookings.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {filteredBookings.map((booking) => (
                            <div key={booking.id} className="p-4 hover:bg-gray-50 transition-colors">
                                {/* Main Booking Row */}
                                <div className="flex items-center gap-4">
                                    {/* Booking Number & Status */}
                                    <div className="shrink-0 min-w-0">
                                        <h3 className="font-bold text-gray-900 text-sm mb-1">
                                            {booking.bookingNumber}
                                        </h3>
                                        <div className="flex flex-wrap gap-1">
                                            {getStatusBadge(booking.status)}
                                            {getPaymentStatusBadge(booking.paymentStatus)}
                                        </div>
                                    </div>

                                    {/* Customer Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FiUser className="w-4 h-4 text-gray-400 shrink-0" />
                                            <span className="font-medium text-gray-900 truncate">
                                                {`${booking.customerDetails?.firstName || ''} ${booking.customerDetails?.lastName || ''}`.trim() || 'N/A'}
                                            </span>
                                            {booking.customerDetails?.phone && (
                                                <>
                                                    <span className="text-gray-300">•</span>
                                                    <FiPhone className="w-3 h-3 text-gray-400" />
                                                    <span className="text-sm text-gray-600">{booking.customerDetails.phone}</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <FiPackage className="w-3 h-3" />
                                            <span className="truncate">{booking.serviceType}</span>
                                            <span className="text-gray-300">•</span>
                                            <span>{booking.helmetDetails?.type || 'N/A'} Helmet</span>
                                        </div>
                                    </div>

                                    {/* Single Action Button */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => openBookingDetails(booking)}
                                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm"
                                        >
                                            <FiEye className="w-4 h-4" />
                                            Manage Booking
                                        </button>
                                    </div>

                                    {/* Amount (Desktop) */}
                                    <div className="hidden md:block text-right shrink-0">
                                        <div className="flex items-center gap-1 font-bold text-gray-900">
                                            <FiDollarSign className="w-4 h-4 text-green-600" />
                                            {formatCurrency(booking.pricing?.totalAmount)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {formatDate(booking.createdAt)}
                                        </div>
                                    </div>
                                </div>

                                {/* Secondary Info Row */}
                                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-600">
                                    {booking.addressDetails?.fullAddress && (
                                        <div className="flex items-center gap-1">
                                            <FiMapPin className="w-3 h-3 text-gray-400" />
                                            <span className="truncate max-w-48">{booking.addressDetails.fullAddress}</span>
                                        </div>
                                    )}

                                    {booking.tracking?.currentStage && (
                                        <div className="flex items-center gap-1">
                                            <FiTruck className="w-3 h-3 text-gray-400" />
                                            <span className="capitalize">Stage: {booking.tracking.currentStage.replace(/_/g, ' ')}</span>
                                        </div>
                                    )}

                                    {booking.timeSlot?.time && (
                                        <div className="flex items-center gap-1">
                                            <FiClock className="w-3 h-3 text-gray-400" />
                                            <span>{booking.timeSlot.time}</span>
                                        </div>
                                    )}

                                    {/* Show assigned riders */}
                                    {booking.pickupRider && (
                                        <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded text-blue-700">
                                            <FiTruck className="w-3 h-3" />
                                            <span>Pickup: {booking.pickupRider.riderName}</span>
                                        </div>
                                    )}

                                    {booking.deliveryRider && (
                                        <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded text-green-700">
                                            <FiTruck className="w-3 h-3" />
                                            <span>Delivery: {booking.deliveryRider.riderName}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Mobile Amount */}
                                <div className="md:hidden mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                                    <div className="font-bold text-gray-900">
                                        {formatCurrency(booking.pricing?.totalAmount)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {formatDate(booking.createdAt)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <div className="w-16 h-16 bg-linear-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <FiClipboard className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {searchTerm || statusFilter !== 'all' ? 'No matching bookings found' : 'No bookings yet'}
                    </h3>
                    <p className="text-sm text-gray-600">
                        {searchTerm || statusFilter !== 'all'
                            ? 'Try adjusting your search or filter criteria.'
                            : 'Bookings will appear here once customers start using your service.'
                        }
                    </p>
                </div>
            )}

            {/* Unified Details Modal */}
            <BookingDetailsModal
                booking={selectedBooking}
                isOpen={showDetailsModal}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
};

export default Bookings;