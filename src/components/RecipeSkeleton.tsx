import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    useSharedValue,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    style?: any;
    isDark: boolean;
}

const SkeletonItem: React.FC<SkeletonProps> = ({
    width: w = '100%',
    height: h = 20,
    borderRadius = 8,
    style,
    isDark
}) => {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 1000 }),
                withTiming(0.3, { duration: 1000 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    width: w as any,
                    height: h as any,
                    borderRadius,
                    backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
                },
                animatedStyle,
                style,
            ]}
        />
    );
};

export const RecipeSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => {
    const isDesktop = width >= 1024;

    return (
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <View
                        key={i}
                        style={{
                            width: isDesktop ? '31%' : '100%',
                            marginBottom: 24,
                            padding: 20,
                            borderRadius: 24,
                            backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                            borderWidth: 1,
                            borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9'
                        }}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                            <View style={{ flex: 1, marginRight: 12 }}>
                                <SkeletonItem width="80%" height={24} borderRadius={8} style={{ marginBottom: 8 }} isDark={isDark} />
                                <SkeletonItem width={60} height={12} borderRadius={4} isDark={isDark} />
                            </View>
                            <SkeletonItem width={40} height={40} borderRadius={12} isDark={isDark} />
                        </View>

                        <View style={{ height: 1, backgroundColor: isDark ? '#1E293B' : '#F1F5F9', marginBottom: 16 }} />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <SkeletonItem width={40} height={16} borderRadius={4} isDark={isDark} />
                            <SkeletonItem width={40} height={16} borderRadius={4} isDark={isDark} />
                            <SkeletonItem width={40} height={16} borderRadius={4} isDark={isDark} />
                            <SkeletonItem width={40} height={16} borderRadius={4} isDark={isDark} />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};
