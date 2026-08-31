import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import React, {
    createContext,
    useEffect,
    useState,
} from 'react';

type NetworkContextType = {
    isOnline: boolean;
};

export const NetworkContext =
    createContext<NetworkContextType>({
        isOnline: true,
    });

export function NetworkProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    console.log("1 - NetworkProvider renderizado");

    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        console.log("2 - useEffect de NetworkProvider ejecutado");

        const unsubscribe = NetInfo.addEventListener(
            (state: NetInfoState) => {
                console.log(
                    "3 - NetInfo:",
                    "isConnected =", state.isConnected,
                    "isInternetReachable =", state.isInternetReachable
                );

                const connected =
                    state.isConnected === true &&
                    state.isInternetReachable !== false;

                setIsOnline(connected);
            }
        );

        return unsubscribe;
    }, []);

    return (
        <NetworkContext.Provider value={{ isOnline }}>
            {children}
        </NetworkContext.Provider>
    );
}