import { useState } from 'react';
import { Redirect } from 'expo-router';
import { useSession } from '../../features/auth/useSession';

export default function LoginScreen() {
    const {user, signIn} = useSession();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submiting, setSubmiting] = useState(false);

    if (user) return <Redirect href="/(private)"/>;

    async function handleSubmit() {
        try{
            setError('');
            setSubmiting(true);
            await signIn({ email, password });
        } catch {
            setError("Credenciales inválidas o problema de conexión");
        } finally {
            setSubmiting(false);
        }
    }
}
        

