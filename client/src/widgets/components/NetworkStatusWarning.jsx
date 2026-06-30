import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
const NetworkStatusWarning = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            toast.success('Good news! Your internet connection is back.', {
                position: toast.POSITION.TOP_CENTER,
                autoClose: 60000,
            });
        }
        const handleOffline = () => {
            setIsOnline(false);
            toast.warning('Oops! It seems you\'re offline. Please check your internet connection and try again.', {
                position: toast.POSITION.TOP_CENTER,
                autoClose: 60000,
            });
        }

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if(!navigator.onLine) handleOffline();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <></>
    );
};

export default NetworkStatusWarning;
