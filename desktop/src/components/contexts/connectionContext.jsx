import { createContext, useContext, useEffect, useState } from "react";

const ConnectionStatusContext = createContext();

export const ConnectionStatusProvider = ({ children }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <ConnectionStatusContext.Provider value={isOnline}>
            {children}
        </ConnectionStatusContext.Provider>
    );
};

export const useConnectionStatus = () => useContext(ConnectionStatusContext);