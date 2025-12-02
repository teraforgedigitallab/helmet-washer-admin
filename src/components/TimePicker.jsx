import React from 'react';

const TimePicker = ({ value, onChange, disabled }) => {
    const [time, period] = value.split(' ');
    const [hour, minute] = time.split(':');

    const handleHourChange = (e) => {
        onChange(`${e.target.value}:${minute} ${period}`);
    };

    const handleMinuteChange = (e) => {
        onChange(`${hour}:${e.target.value} ${period}`);
    };

    const handlePeriodChange = (e) => {
        onChange(`${hour}:${minute} ${e.target.value}`);
    };

    return (
        <div className="flex items-center gap-2">
            <select
                value={hour}
                onChange={handleHourChange}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
                {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                        {String(i + 1).padStart(2, '0')}
                    </option>
                ))}
            </select>
            <span>:</span>
            <select
                value={minute}
                onChange={handleMinuteChange}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
                {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={String(i).padStart(2, '0')}>
                        {String(i).padStart(2, '0')}
                    </option>
                ))}
            </select>
            <select
                value={period}
                onChange={handlePeriodChange}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
            </select>
        </div>
    );
};

export default TimePicker;
