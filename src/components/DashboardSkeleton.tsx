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

export const DashboardSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => {
    const isDesktop = width >= 768;

    return (
        <View style={{ flex: 1, backgroundColor: isDark ? '#020617' : '#F8FAFC' }}>
            {/* Header Skeleton */}
            <View style={{ paddingHorizontal: 32, height: 100, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                    <SkeletonItem width={80} height={12} borderRadius={4} style={{ marginBottom: 8 }} isDark={isDark} />
                    <SkeletonItem width={180} height={34} borderRadius={8} isDark={isDark} />
                </View>
                <SkeletonItem width={48} height={48} borderRadius={24} isDark={isDark} />
            </View>

            {/* Date Scroll Skeleton */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 32, paddingVertical: 12, marginBottom: 20 }}>
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <SkeletonItem key={i} width={60} height={72} borderRadius={20} style={{ marginRight: 12 }} isDark={isDark} />
                ))}
            </View>

            <View style={{ flexDirection: isDesktop ? 'row' : 'column', paddingHorizontal: isDesktop ? 32 : 0 }}>
                {/* Left Column Skeleton */}
                <View style={{ width: isDesktop ? 460 : '100%', paddingHorizontal: isDesktop ? 0 : 32, marginBottom: 32 }}>
                    <View style={{
                        alignItems: 'center',
                        paddingVertical: 32,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                        borderRadius: 40,
                        marginHorizontal: isDesktop ? 0 : 16
                    }}>
                        <SkeletonItem width={220} height={220} borderRadius={110} isDark={isDark} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 48 }}>
                            <SkeletonItem width={80} height={80} borderRadius={40} isDark={isDark} />
                            <SkeletonItem width={80} height={80} borderRadius={40} isDark={isDark} />
                            <SkeletonItem width={80} height={80} borderRadius={40} isDark={isDark} />
                        </View>
                    </View>
                    <SkeletonItem height={140} borderRadius={32} style={{ marginTop: 32 }} isDark={isDark} />
                </View>

                {/* Right Column Skeleton */}
                <View style={{ flex: 1, paddingHorizontal: isDesktop ? 32 : 16 }}>
                    <SkeletonItem width={120} height={16} borderRadius={4} style={{ marginBottom: 32, marginLeft: 16 }} isDark={isDark} />
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
                        {[1, 2, 3, 4].map((i) => (
                            <SkeletonItem key={i} width={isDesktop ? '45%' : '100%'} height={180} borderRadius={32} isDark={isDark} />
                        ))}
                    </View>
                </View>
            </View>
        </View>
    );
};
