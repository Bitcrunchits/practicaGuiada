const { user, signOut } = useSession();
return (
<Screen>
<Text>Nombre: {user?.name}</Text>
<Text>Email: {user?.email}</Text>
<AppButton title="Cerrar sesion" onPress={signOut} variant="danger" />
</Screen>
);