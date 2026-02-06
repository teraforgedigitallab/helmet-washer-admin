import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';
import {
    FiClipboard, FiSearch, FiFilter, FiUser, FiPhone, FiDollarSign,
    FiMapPin, FiClock, FiPackage, FiTruck, FiCreditCard, FiCheckCircle,
    FiXCircle, FiAlertCircle, FiEye, FiHome, FiShoppingBag, FiPlus, FiMap
} from 'react-icons/fi';
import BookingDetailsModal from '../components/BookingDetailsModal';

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
    const [deliveryTypeFilter, setDeliveryTypeFilter] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [isCreatingPincodes, setIsCreatingPincodes] = useState(false);

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
            console.log('All Bookings:', bookingsData); // Log all booking documents
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

    const getBookingType = (booking) => {
        const serviceType = booking.serviceType || 'Unknown';
        const deliveryType = booking.deliveryType || 'Unknown';

        return {
            service: serviceType,
            delivery: deliveryType,
            label: `${serviceType} - ${deliveryType === 'doorstep' ? 'Doorstep' : 'Pickup'}`,
            icon: deliveryType === 'doorstep' ? FiHome : FiShoppingBag,
            color: serviceType === 'Waterless Washing' ? 'blue' : 'purple'
        };
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
                {status?.replace(/_/g, ' ').toUpperCase()}
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
                {status?.toUpperCase()}
            </span>
        );
    };

    const openBookingDetails = async (booking) => {
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
        await fetchBookings();

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
        const matchesServiceType = serviceTypeFilter === 'all' || booking.serviceType === serviceTypeFilter;
        const matchesDeliveryType = deliveryTypeFilter === 'all' || booking.deliveryType === deliveryTypeFilter;

        return matchesSearch && matchesStatus && matchesServiceType && matchesDeliveryType;
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

    // Calculate stats
    const stats = {
        total: bookings.length,
        doorstep: bookings.filter(b => b.deliveryType === 'doorstep').length,
        pickup: bookings.filter(b => b.deliveryType === 'pickup').length,
        washing: bookings.filter(b => b.serviceType === 'Waterless Washing').length,
        repair: bookings.filter(b => b.serviceType === 'Helmet Repair').length,
    };

    const createPincodeRanges = async () => {
        if (window.confirm('This will create pincode range documents from 400001-400100 to 499900-500000. Continue?')) {
            setIsCreatingPincodes(true);
            const batchSize = 10; // Process 10 ranges at a time
            const totalRanges = 1000; // Total number of 100-pincode ranges from 400000 to 500000

            try {
                for (let i = 0; i < totalRanges; i += batchSize) {
                    const batchPromises = [];

                    // Process a batch of ranges
                    for (let j = 0; j < batchSize && (i + j) < totalRanges; j++) {
                        const rangeNum = i + j;
                        const startPincode = 400000 + (rangeNum * 100) + 1;
                        const endPincode = Math.min(400000 + ((rangeNum + 1) * 100), 500000);
                        const docId = `${startPincode}---${endPincode}`;

                        // Add the document creation to the batch
                        const docRef = doc(db, 'Pincode', docId);
                        batchPromises.push(
                            setDoc(docRef, { availablePincodes: [] }, { merge: true })
                        );
                    }

                    // Wait for the current batch to complete
                    await Promise.all(batchPromises);
                    console.log(`Processed ranges ${i + 1} to ${Math.min(i + batchSize, totalRanges)}`);
                }

                toast.success('Pincode ranges created successfully!');
            } catch (error) {
                console.error('Error creating pincode ranges:', error);
                toast.error('Failed to create pincode ranges');
            } finally {
                setIsCreatingPincodes(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="animate-pulse space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
                        ))}
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
            {/* <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Bookings</h1>
                    <button
                        onClick={createPincodeRanges}
                        disabled={isCreatingPincodes}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isCreatingPincodes
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        {isCreatingPincodes ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating...
                            </>
                        ) : (
                            <>
                                <FiMap className="w-4 h-4" />
                                Create Pincode Ranges
                            </>
                        )}
                    </button>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                        {bookings.length} total bookings
                    </p>
                </div>
            </div> */}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bookings</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                        {bookings.length} total bookings
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4">
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

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="relative">
                        <FiFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-12 pr-10 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none cursor-pointer"
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
                        <FiPackage className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        <select
                            value={serviceTypeFilter}
                            onChange={(e) => setServiceTypeFilter(e.target.value)}
                            className="w-full pl-12 pr-10 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none cursor-pointer"
                        >
                            <option value="all">All Services</option>
                            <option value="Waterless Washing">Waterless Washing</option>
                            <option value="Helmet Repair">Helmet Repair</option>
                        </select>
                    </div>

                    <div className="relative">
                        <FiTruck className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        <select
                            value={deliveryTypeFilter}
                            onChange={(e) => setDeliveryTypeFilter(e.target.value)}
                            className="w-full pl-12 pr-10 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none cursor-pointer"
                        >
                            <option value="all">All Types</option>
                            <option value="doorstep">Doorstep</option>
                            <option value="pickup">Manual Pickup</option>
                        </select>
                    </div>

                    <div className="relative col-span-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none cursor-pointer"
                        >
                            <option value="createdAt">Sort by Date</option>
                            <option value="totalAmount">Sort by Amount</option>
                            <option value="customerName">Sort by Name</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Bookings List */}
            {filteredBookings.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {filteredBookings.map((booking) => {
                            const bookingType = getBookingType(booking);

                            return (
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
                                                <bookingType.icon className="w-3 h-3" />
                                                <span className="truncate">{bookingType.label}</span>
                                                <span className="text-gray-300">•</span>
                                                <span>{booking.helmetDetails?.type || 'N/A'} Helmet</span>
                                            </div>
                                        </div>

                                        {/* Single Action Button */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {booking.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => openBookingDetails(booking)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm"
                                                >
                                                    <FiEye className="w-4 h-4" />
                                                    Manage
                                                </button>
                                            )}
                                        </div>

                                        {/* Amount (Desktop) */}
                                        <div className="hidden md:block text-right shrink-0">
                                            <div className="flex items-center gap-1 font-bold text-gray-900">
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
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <div className="w-16 h-16 bg-linear-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <FiClipboard className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {searchTerm || statusFilter !== 'all' || serviceTypeFilter !== 'all' || deliveryTypeFilter !== 'all'
                            ? 'No matching bookings found'
                            : 'No bookings yet'}
                    </h3>
                    <p className="text-sm text-gray-600">
                        {searchTerm || statusFilter !== 'all' || serviceTypeFilter !== 'all' || deliveryTypeFilter !== 'all'
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