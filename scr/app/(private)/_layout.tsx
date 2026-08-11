export default function PrivateLayout() {
    const { user, isLoadin } = useSession();

    if (isLoadin) {
        return <FeedbackState title="Validando sesión..."/>;
     }

     if (!user) {
        return <Redirect href="/(public)/login" />;
     }

     return <Stack />
    }