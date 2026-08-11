import * as SecureStore from 'expo-secure-store';

const SESSION_TOKEN_KEY = 'session_token';

export async function saveSessionToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}

export async function getSessionToken(){
  return await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
 }

 export async function deleteSessionToken(){
    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
 } 