import { useEffect, useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    Skeleton,
    YearCardSkeleton,
} from "@/components/ui/Skeleton";

import { SafeAreaView } from "react-native-safe-area-context";

import {
    router,
    useLocalSearchParams
} from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { theme } from "@/constants/theme";
import { useSession } from "@/features/auth/useSession";
import { getMyStudyPlan } from "@/features/student/services/student.service";

export default function StudentCareerScreen() {
    const { token } = useSession();

    const [years, setYears] = useState<number[]>([]);
    const [careerName, setCareerName] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const { careerId } = useLocalSearchParams<{ careerId: string }>();

    useEffect(() => {
        const loadStudyPlan = async () => {
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await getMyStudyPlan(token);

                setCareerName(response.data.career.name);

                const uniqueYears = [
                    ...new Set(
                        response.data.items.map((item) => item.year)
                    ),
                ].sort((a, b) => a - b);

                setYears(uniqueYears);
            } catch (error) {
                console.error("ERROR CAREER YEARS:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadStudyPlan();
    }, [token]);

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>

                {/* Nombre de la carrera */}
                <Skeleton
                    width="80%"
                    height={26}
                    borderRadius={8}
                />

                {/* Seleccioná un año */}
                <View
                    style={{
                        marginTop: theme.spacing.sm,
                        marginBottom: theme.spacing.md,
                    }}
                >
                    <Skeleton
                        width="35%"
                        height={13}
                    />
                </View>

                {/* Años */}
                <View style={styles.years}>
                    {[1, 2, 3].map((item) => (
                        <YearCardSkeleton
                            key={item}
                        />
                    ))}
                </View>

            </View>
        </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>

                <Text style={styles.title}>
                    {careerName}
                </Text>

                <Text style={styles.subtitle}>
                    Seleccioná un año
                </Text>

                <View style={styles.years}>
                    {years.map((year) => (
                        <Pressable
                            key={year}
                            style={styles.card}
                            onPress={() =>
                                router.push({
                                    pathname:
                                        "/(private)/student/careers/[careerId]/[year]",
                                    params: {
                                        careerId,
                                        year: String(year),
                                    },
                                })
                            }
                        >
                            <View style={styles.cardContent}>
                                <Text style={styles.yearTitle}>
                                    {year}.º Año
                                </Text>

                                <Text style={styles.yearDescription}>
                                    Ver materias
                                </Text>
                            </View>

                            <Text style={styles.arrow}>›</Text>
                        </Pressable>
                    ))}
                </View>

                <View style={styles.spacer} />

                <AppButton
                    title="Volver"
                    onPress={() => router.back()}
                />

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },

    container: {
        flex: 1,
        padding: theme.spacing.lg,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    loadingText: {
        marginTop: theme.spacing.sm,
        color: theme.colors.textSecondary,
    },

    title: {
        fontSize: theme.fontSize.xl,
        fontWeight: "700",
        color: theme.colors.text,
    },

    subtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
        marginBottom: theme.spacing.md,
    },

    years: {
        gap: theme.spacing.sm,
    },

    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },

    cardContent: {
        flex: 1,
    },

    yearTitle: {
        fontSize: theme.fontSize.md,
        fontWeight: "700",
        color: theme.colors.primary,
    },

    yearDescription: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },

    arrow: {
        fontSize: 28,
        color: theme.colors.textSecondary,
    },

    spacer: {
        flex: 1,
    },
});