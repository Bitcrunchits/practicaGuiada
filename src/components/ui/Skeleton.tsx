import { useEffect, useRef } from "react";
import {
    Animated,
    StyleSheet,
    View,
} from "react-native";

import { theme } from "@/constants/theme";

type SkeletonProps = {
    width?: number | `${number}%`;
    height?: number;
    borderRadius?: number;
};

export function Skeleton({
    width = "100%",
    height = 16,
    borderRadius = 8,
}: SkeletonProps) {

    const opacity = useRef(
        new Animated.Value(0.4)
    ).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.9,
                    duration: 700,
                    useNativeDriver: true,
                }),

                Animated.timing(opacity, {
                    toValue: 0.4,
                    duration: 700,
                    useNativeDriver: true,
                }),
            ])
        );

        animation.start();

        return () => {
            animation.stop();
        };
    }, [opacity]);

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                    opacity,
                },
            ]}
        />
    );
}


// Skeleton específico para las tarjetas de materias

export function SubjectCardSkeleton() {
    return (
        <View style={styles.card}>

            <Skeleton
                width={42}
                height={42}
                borderRadius={21}
            />

            <View style={styles.cardContent}>

                <Skeleton
                    width="70%"
                    height={17}
                />

                <Skeleton
                    width="30%"
                    height={11}
                />

                <Skeleton
                    width="45%"
                    height={11}
                />

            </View>

            <Skeleton
                width={8}
                height={22}
                borderRadius={4}
            />

        </View>
    );
}
export function YearCardSkeleton() {
    return (
        <View style={styles.card}>

            <View style={styles.cardContent}>
                <Skeleton
                    width="35%"
                    height={18}
                />

                <Skeleton
                    width="25%"
                    height={12}
                />
            </View>

            <Skeleton
                width={8}
                height={22}
                borderRadius={4}
            />

        </View>
    );
}
export function CareerCardSkeleton() {
    return (
        <View style={styles.card}>

            {/* Simula el icono 🎓 */}
            <Skeleton
                width={42}
                height={42}
                borderRadius={21}
            />

            {/* Información de la carrera */}
            <View style={styles.cardContent}>

                {/* Nombre */}
                <Skeleton
                    width="85%"
                    height={18}
                />

                {/* Código */}
                <Skeleton
                    width="25%"
                    height={11}
                />

                {/* Plan */}
                <Skeleton
                    width="55%"
                    height={12}
                />

            </View>

            {/* Flecha */}
            <Skeleton
                width={8}
                height={22}
                borderRadius={4}
            />

        </View>
    );
}
const styles = StyleSheet.create({

    skeleton: {
        backgroundColor: theme.colors.border,
    },

    card: {
        flexDirection: "row",
        alignItems: "center",

        backgroundColor: theme.colors.surface,

        padding: theme.spacing.md,

        borderRadius: theme.radius.lg,

        borderWidth: 1,
        borderColor: theme.colors.border,

        gap: theme.spacing.md,
    },

    cardContent: {
        flex: 1,
        gap: 8,
    },

});