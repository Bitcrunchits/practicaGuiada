

  const { user } = useSession();

  return (
    <Screen>
        <Text>Hola, {user?.name}</Text>
        <Text>Esta es un area protegida.</Text>
        <Link href="/(private)/profile" asChild>
            <AppButton title="Ver Perfil" />
        </Link>
    </Screen>
  );
