import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { FiPlus, FiTrash2, FiEdit2, FiTag } from 'react-icons/fi';
import toast from 'react-hot-toast';
import CouponModal from '../components/CouponModal';

const Coupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [couponToEdit, setCouponToEdit] = useState(null);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'Coupons'), (snapshot) => {
            const couponsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCoupons(couponsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching coupons:", error);
            toast.error("Failed to load coupons");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this coupon?')) {
            try {
                await deleteDoc(doc(db, 'Coupons', id));
                toast.success('Coupon deleted successfully');
            } catch (error) {
                console.error('Error deleting coupon:', error);
                toast.error('Failed to delete coupon');
            }
        }
    };

    const handleToggleStatus = async (coupon) => {
        try {
            await updateDoc(doc(db, 'Coupons', coupon.id), {
                isActive: !coupon.isActive
            });
            toast.success(`Coupon ${coupon.isActive ? 'deactivated' : 'activated'}`);
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const openModal = (coupon = null) => {
        setCouponToEdit(coupon);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCouponToEdit(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
                    <p className="text-gray-600">Manage discount codes and offers</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                    <FiPlus className="mr-2" />
                    Add Coupon
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {coupons.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        <FiTag className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                        <p>No coupons created yet</p>
                                    </td>
                                </tr>
                            ) : (
                                coupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="font-mono text-sm font-bold bg-gray-100 px-2 py-1 rounded text-primary-700">
                                                    {coupon.code}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">{coupon.description}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {coupon.discountType?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                                            {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggleStatus(coupon)}
                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${coupon.isActive ? 'bg-green-600' : 'bg-gray-200'
                                                    }`}
                                                role="switch"
                                                aria-checked={coupon.isActive}
                                            >
                                                <span className="sr-only">Use setting</span>
                                                <span
                                                    aria-hidden="true"
                                                    className={`${coupon.isActive ? 'translate-x-5' : 'translate-x-0'
                                                        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                                />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => openModal(coupon)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                <FiEdit2 className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(coupon.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <FiTrash2 className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CouponModal
                isOpen={isModalOpen}
                onClose={closeModal}
                couponToEdit={couponToEdit}
                onCouponSaved={() => {
                    // No need to manually refresh as we use onSnapshot
                }}
            />
        </div>
    );
};

export default Coupons;
