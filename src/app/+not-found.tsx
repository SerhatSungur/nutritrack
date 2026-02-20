import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
    return (
        <>
            <Stack.Screen options={{ title: 'Oops!' }} />
            <View className="flex-1 items-center justify-center p-5 bg-background">
                <Text className="text-xl font-bold text-text">This screen doesn't exist.</Text>
                <Link href="/" className="mt-4 p-4">
                    <Text className="text-primary text-lg">Go to home screen!</Text>
                </Link>
            </View>
        </>
    );
}
