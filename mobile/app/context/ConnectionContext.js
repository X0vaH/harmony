import React, {createContext, useState, useEffect} from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Contexte pour gérer l'état de la connexion réseau dans l'application.
 * @type {React.Context<{isConnected: boolean, setIsConnected: function()}>}
 */
export const ConnectionContext = createContext({
    isConnected: true,
    setIsConnected: () => {
    }
});

/**
 * Fournisseur de contexte pour la connexion réseau... meilleur manière de partager l'état de connexion i guess
 * @param children
 * @returns {React.JSX.Element}
 * @constructor
 */
export function ConnectionProvider({children}) {
    const [isConnected, setIsConnected] = useState(true);

    useEffect(() => {
        NetInfo.fetch().then(state => setIsConnected(!!state.isConnected));
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(!!state.isConnected);
        });
        return unsubscribe;
    }, []);

    return (
        <ConnectionContext.Provider value={{isConnected, setIsConnected}}>
            {children}
        </ConnectionContext.Provider>
    );
}
