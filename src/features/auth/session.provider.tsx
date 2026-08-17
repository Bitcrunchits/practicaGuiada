import {
    createContext,
    ReactNode,
    useState,
    useEffect,
} from "react";

import { User } from "./auth.types";
import { getMe } from "./services/auth.service";

import {
    deleteSessionToken,
    getSessionToken,
    saveSessionToken,
} from "@/lib/storage/secure-storage";

type SessionContextType = {
    isAuthenticated: boolean;
    isLoading: boolean;
    token: string | null;
    user: User | null;
    signIn: (token: string, user: User) => Promise<void>;
    signOut: () => Promise<void>;
};

export const SessionContext =
    createContext<SessionContextType | undefined>(undefined);

type SessionProviderProps = {
    children: ReactNode;
};

export function SessionProvider({
    children,
}: SessionProviderProps) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = token !== null;

    useEffect(() => {
        restoreSession();
    }, []);

    const restoreSession = async () => {
        try {
            const storedToken = await getSessionToken();

            if (!storedToken) {
                return;
            }

            const response = await getMe(storedToken);

            setToken(storedToken);
            setUser(response.data);
        } catch {
            await deleteSessionToken();

            setToken(null);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const signIn = async (
        newToken: string,
        newUser: User
    ) => {
        await saveSessionToken(newToken);

        setToken(newToken);
        setUser(newUser);
       
    };

    const signOut = async () => {
        await deleteSessionToken();
        setIsLoading(false);

        setToken(null);
        setUser(null);
    };

    return (
        <SessionContext.Provider
            value={{
                isAuthenticated,
                isLoading,
                token,
                user,
                signIn,
                signOut,
            }}
        >
            {children}
        </SessionContext.Provider>
    );
}