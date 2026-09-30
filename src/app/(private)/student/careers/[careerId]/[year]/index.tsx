import { useEffect, useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { theme } from "@/constants/theme";
import { useSession } from "@/features/auth/useSession";
import { getMyStudyPlan } from "@/features/student/services/student.service";
import { StudentStudyPlanItem } from "@/features/student/student.types";
import {
    Skeleton,
    SubjectCardSkeleton,
} from "@/components/ui/Skeleton";

export default function StudentYearSubjectsScreen() {
    const { token } = useSession();

    const { careerId, year } = useLocalSearchParams<{
        careerId: string;
        year: string;
    }>();

    const [subjects, setSubjects] =
        useState<StudentStudyPlanItem[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadSubjects = async () => {
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await getMyStudyPlan(token);

                const selectedYear = Number(year);

                const subjectsOfYear = response.data.items
                    .filter((item) => item.year === selectedYear)
                    .sort((a, b) => a.sortOrder - b.sortOrder);

                setSubjects(subjectsOfYear);
            } catch (error) {
                console.error("ERROR YEAR SUBJECTS:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSubjects();
    }, [token, year]);

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>

                    {/* Título */}
                    <Skeleton
                        width="65%"
                        height={26}
                        borderRadius={8}
                    />

                    {/* Subtítulo */}
                    <View style={{ marginTop: theme.spacing.sm }}>
                        <Skeleton
                            width="32%"
                            height={13}
                        />
                    </View>

                    {/* Tarjetas */}
                    <View
                        style={[
                            styles.subjects,
                            { marginTop: theme.spacing.md },
                        ]}
                    >
                        {[1, 2, 3, 4, 5].map((item) => (
                            <SubjectCardSkeleton
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
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >

                <Text style={styles.title}>
                    Materias de {year}.º Año
                </Text>

                <Text style={styles.subtitle}>
                    Plan de estudios
                </Text>

                <View style={styles.subjects}>
                    {subjects.map((item) => (
                        <Pressable
                            key={item.id}
                            style={styles.card}
                            onPress={() =>
                                router.push({
                                    pathname:
                                        "/(private)/student/careers/[careerId]/[year]/[subjectId]",
                                    params: {
                                        careerId,
                                        year,
                                        subjectId: item.subject.id,
                                    },
                                })
                            }
                        >
                            <View style={styles.cardContent}>
                                <Text style={styles.subjectName}>
                                    {item.subject.name}
                                </Text>

                                <Text style={styles.subjectCode}>
                                    {item.subject.code}
                                </Text>

                                <Text style={styles.subjectInfo}>
                                    {item.term === "ANNUAL"
                                        ? "Anual"
                                        : item.semester === 1
                                            ? "1.er semestre"
                                            : "2.º semestre"}
                                </Text>
                            </View>

                            <Text style={styles.arrow}>›</Text>
                        </Pressable>
                    ))}
                </View>



                <AppButton
                    title="Volver"
                    onPress={() => router.back()}
                />

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },

    container: {
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.xl,
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

    subjects: {
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

    subjectName: {
        fontSize: theme.fontSize.md,
        fontWeight: "700",
        color: theme.colors.primary,
    },

    subjectCode: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },

    subjectInfo: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text,
        marginTop: 2,
    },

    arrow: {
        fontSize: 28,
        color: theme.colors.textSecondary,
    },

    


});