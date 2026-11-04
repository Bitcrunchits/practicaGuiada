const SESSION_TOKEN_KEY = 'session_token';
const STORAGE_UNAVAILABLE_MESSAGE = 'No se pudo guardar la sesión en este navegador. Compruebe que el almacenamiento local esté habilitado.';
const STORAGE_DELETE_FAILED_MESSAGE = 'No se pudo cerrar la sesión en este navegador. Compruebe que el almacenamiento local esté habilitado e inténtelo nuevamente.';

function getStorage(): Storage | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

export async function saveSessionToken(token: string): Promise<void> {
    const storage = getStorage();
    if (!storage) {
        throw new Error(STORAGE_UNAVAILABLE_MESSAGE);
    }

    try {
        storage.setItem(SESSION_TOKEN_KEY, token);
    } catch {
        throw new Error(STORAGE_UNAVAILABLE_MESSAGE);
    }
}

export async function getSessionToken(): Promise<string | null> {
    try {
        return getStorage()?.getItem(SESSION_TOKEN_KEY) ?? null;
    } catch {
        return null;
    }
}

export async function deleteSessionToken(): Promise<void> {
    if (typeof window === 'undefined') {
        return;
    }

    const storage = getStorage();
    if (!storage) {
        throw new Error(STORAGE_DELETE_FAILED_MESSAGE);
    }

    let remainingToken: string | null;
    try {
        storage.removeItem(SESSION_TOKEN_KEY);
        remainingToken = storage.getItem(SESSION_TOKEN_KEY);
    } catch {
        throw new Error(STORAGE_DELETE_FAILED_MESSAGE);
    }

    if (remainingToken !== null) {
        throw new Error(STORAGE_DELETE_FAILED_MESSAGE);
    }
}
