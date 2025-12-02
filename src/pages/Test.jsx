import { useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config'; // Adjust this import path to match your firebase config file

export default function Test() {
    const [longitude, setLongitude] = useState('');
    const [latitude, setLatitude] = useState('');
    const [pincode, setPincode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [serviceCenters, setServiceCenters] = useState([]);

    const findPincodeRange = (pin) => {
        const pinNum = parseInt(pin);
        const rangeSize = 100;
        const rangeStart = Math.floor((pinNum - 1) / rangeSize) * rangeSize + 1;
        const rangeEnd = rangeStart + rangeSize - 1;
        return `${rangeStart}---${rangeEnd}`;
    };

    const findClosestPincode = (targetPin, availablePincodes) => {
        if (availablePincodes.includes(targetPin)) {
            return targetPin;
        }

        let closest = availablePincodes[0];
        let minDiff = Math.abs(targetPin - closest);

        for (let pin of availablePincodes) {
            const diff = Math.abs(targetPin - pin);
            if (diff < minDiff) {
                minDiff = diff;
                closest = pin;
            }
        }

        return closest;
    };

    const handleCheckServiceCenter = async () => {
        setError('');
        setServiceCenters([]);

        if (!pincode) {
            setError('Please enter a pincode');
            return;
        }

        const pincodeNum = parseInt(pincode);
        if (isNaN(pincodeNum) || pincode.length !== 6) {
            setError('Please enter a valid 6-digit pincode');
            return;
        }

        setLoading(true);

        try {
            const pincodeRange = findPincodeRange(pincodeNum);
            const pincodeCollectionRef = collection(db, 'Pincode');
            const q = query(pincodeCollectionRef, where('__name__', '==', pincodeRange));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError(`No data found for pincode range: ${pincodeRange}`);
                setLoading(false);
                return;
            }

            const doc = querySnapshot.docs[0];
            const data = doc.data();
            const availablePincodes = data.availablePincodes || [];
            const availableCenters = data.availableCenters || [];

            if (availablePincodes.length === 0) {
                setError('No available pincodes in this range');
                setLoading(false);
                return;
            }

            const closestPincode = findClosestPincode(pincodeNum, availablePincodes);

            const matchingCenters = availableCenters.filter(
                center => center.serviceCenterPincode === closestPincode
            );

            if (matchingCenters.length === 0) {
                setError(`No service centers found for pincode ${closestPincode} (closest to ${pincodeNum})`);
            } else {
                setServiceCenters(matchingCenters);
                if (closestPincode !== pincodeNum) {
                    setError(`Showing results for closest available pincode: ${closestPincode}`);
                }
            }
        } catch (err) {
            console.error('Error fetching service centers:', err);
            setError(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">
                        Service Center Lookup
                    </h1>

                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Longitude
                            </label>
                            <input
                                type="text"
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                placeholder="Enter longitude"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Latitude
                            </label>
                            <input
                                type="text"
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                placeholder="Enter latitude"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pin Code
                            </label>
                            <input
                                type="text"
                                value={pincode}
                                onChange={(e) => setPincode(e.target.value)}
                                placeholder="Enter 6-digit pincode"
                                maxLength={6}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleCheckServiceCenter}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                        {loading ? 'Checking...' : 'Check Service Center'}
                    </button>

                    {error && (
                        <div className={`mt-4 p-4 rounded-md ${serviceCenters.length > 0 ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-800'}`}>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {serviceCenters.length > 0 && (
                        <div className="mt-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                Available Service Centers ({serviceCenters.length})
                            </h2>
                            <div className="space-y-4">
                                {serviceCenters.map((center, index) => (
                                    <div
                                        key={index}
                                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-sm text-gray-600">Service Center Name</p>
                                                <p className="font-semibold text-gray-900">
                                                    {center.serviceCenterName}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Service Center ID</p>
                                                <p className="font-semibold text-gray-900">
                                                    {center.serviceCenterID}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Pincode</p>
                                                <p className="font-semibold text-gray-900">
                                                    {center.serviceCenterPincode}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Latitude</p>
                                                <p className="font-semibold text-gray-900">
                                                    {center.latitude}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Longitude</p>
                                                <p className="font-semibold text-gray-900">
                                                    {center.longitude}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}