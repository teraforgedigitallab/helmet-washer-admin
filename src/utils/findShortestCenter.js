import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const findShortestCenter = async (longitude, latitude, pincode) => {
    const pincodeNumber = parseInt(pincode, 10);

    if (isNaN(pincodeNumber)) {
        console.log('Invalid pincode');
        return;
    }

    const lowerBound = Math.floor(pincodeNumber / 100) * 100 + 1;
    const upperBound = lowerBound + 99;
    const docId = `${lowerBound}-${upperBound}`;

    try {
        const docRef = doc(db, 'Pincode', docId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            console.log('This pincode is not serviceable');
            return;
        }

        const data = docSnap.data();
        const { availablePincode, availableCenters } = data;

        if (!availablePincode || availablePincode.length === 0) {
            console.log('This pincode is not serviceable');
            return;
        }

        let closestPincode = availablePincode[0];
        let minDiff = Math.abs(pincodeNumber - closestPincode);

        for (let i = 1; i < availablePincode.length; i++) {
            const diff = Math.abs(pincodeNumber - availablePincode[i]);
            if (diff < minDiff) {
                minDiff = diff;
                closestPincode = availablePincode[i];
            }
        }

        const matchingCenters = availableCenters.filter(
            (center) => center.pincode === closestPincode
        );

        if (matchingCenters.length > 0) {
            console.log('Found matching centers:', matchingCenters);
        } else {
            console.log('No centers found for the closest pincode');
        }
    } catch (error) {
        console.error('Error fetching pincode data:', error);
    }
};
