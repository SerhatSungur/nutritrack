import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useEffect, useRef, useState } from 'react';
import { searchFoodByBarcode } from '../lib/api/foodApi';
import { ScanLine, X, Zap, RotateCcw } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';

// We use a dynamic import approach so the app doesn't crash if expo-camera isn't installed yet
let Camera: any = null;
let BarcodeScanningResult: any = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const expoCam = require('expo-camera');
    Camera = expoCam.CameraView;
} catch {
    Camera = null;
}

export default function ScannerScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lastBarcode, setLastBarcode] = useState<string | null>(null);

    useEffect(() => {
        if (!Camera) return;
        (async () => {
            try {
                const { Camera: ExpoCam } = require('expo-camera');
                const { status } = await ExpoCam.requestCameraPermissionsAsync();
                setHasPermission(status === 'granted');
            } catch {
                setHasPermission(false);
            }
        })();
    }, []);

    const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
        if (scanned || loading) return;
        setScanned(true);
        setLastBarcode(data);
        setLoading(true);

        const food = await searchFoodByBarcode(data);
        setLoading(false);

        if (food) {
            // Navigate back to create with the found food item encoded as params
            router.replace({
                pathname: '/recipes/create',
                params: {
                    scannedFoodId: food.id,
                    scannedFoodName: food.name,
                    scannedFoodBrand: food.brand,
                    scannedFoodCalories: food.calories.toString(),
                    scannedFoodProtein: food.protein.toString(),
                    scannedFoodCarbs: food.carbs.toString(),
                    scannedFoodFat: food.fat.toString(),
                    scannedFoodUnit: food.unit,
                }
            });
        } else {
            Alert.alert(
                'Produkt nicht gefunden',
                `Der Barcode "${data}" wurde in der Datenbank nicht gefunden. Bitte versuche es manuell zu suchen.`,
                [
                    { text: 'Nochmals scannen', onPress: () => setScanned(false) },
                    { text: 'Zurück', onPress: () => router.back() }
                ]
            );
        }
    };

    if (!Camera) {
        return (
            <View style={styles.container}>
                <View style={styles.notInstalledBox}>
                    <ScanLine size={64} color="#2563EB" />
                    <Text style={styles.notInstalledTitle}>Kamera nicht verfügbar</Text>
                    <Text style={styles.notInstalledText}>
                        Um den Barcode-Scanner zu nutzen, führe diesen Befehl in deinem Terminal aus:
                    </Text>
                    <View style={styles.codeBox}>
                        <Text style={styles.code}>npx expo install expo-camera</Text>
                    </View>
                    <Text style={styles.notInstalledText}>und starte die App danach neu.</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Zurück</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (hasPermission === null) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.permText}>Kamera-Zugriff wird angefragt...</Text>
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={styles.container}>
                <X size={48} color="#EF4444" />
                <Text style={styles.permText}>Kamera-Zugriff verweigert.</Text>
                <Text style={styles.permSub}>Bitte erlaube der App Kamerazugriff in den Einstellungen.</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Zurück</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Camera
                style={StyleSheet.absoluteFillObject}
                barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />

            {/* Overlay UI */}
            <View style={styles.overlay}>
                {/* Header */}
                <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                        <X size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Barcode scannen</Text>
                    <View style={{ width: 44 }} />
                </Animated.View>

                {/* Scanning frame */}
                <View style={styles.frameContainer}>
                    <View style={styles.frame}>
                        <View style={[styles.corner, styles.tl]} />
                        <View style={[styles.corner, styles.tr]} />
                        <View style={[styles.corner, styles.bl]} />
                        <View style={[styles.corner, styles.br]} />
                        {loading && (
                            <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color="#FFFFFF" />
                                <Text style={{ color: '#FFFFFF', marginTop: 12, fontWeight: '600' }}>Produkt wird gesucht...</Text>
                            </Animated.View>
                        )}
                    </View>
                    <Text style={styles.hint}>Halte den Barcode in den Rahmen</Text>
                </View>

                {/* Bottom controls */}
                <Animated.View entering={FadeInDown.delay(200)} style={styles.bottomBar}>
                    {scanned && !loading && (
                        <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
                            <RotateCcw size={20} color="#2563EB" />
                            <Text style={styles.rescanText}>Nochmals scannen</Text>
                        </TouchableOpacity>
                    )}
                    {lastBarcode && (
                        <Text style={styles.barcodeLabel}>Barcode: {lastBarcode}</Text>
                    )}
                </Animated.View>
            </View>
        </View>
    );
}

const FRAME_SIZE = 260;
const CORNER_SIZE = 24;
const CORNER_WIDTH = 4;
const CORNER_COLOR = '#FFFFFF';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20
    },
    closeBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center'
    },
    headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
    frameContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    frame: {
        width: FRAME_SIZE, height: FRAME_SIZE,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'transparent'
    },
    corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
    tl: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderColor: CORNER_COLOR, borderRadius: 4 },
    tr: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderColor: CORNER_COLOR, borderRadius: 4 },
    bl: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderColor: CORNER_COLOR, borderRadius: 4 },
    br: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderColor: CORNER_COLOR, borderRadius: 4 },
    loadingOverlay: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 20, borderRadius: 16, alignItems: 'center' },
    hint: { color: 'rgba(255,255,255,0.7)', marginTop: 20, fontSize: 14 },
    bottomBar: {
        paddingBottom: 48, paddingHorizontal: 24,
        alignItems: 'center', gap: 12
    },
    rescanBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#FFFFFF', paddingHorizontal: 24, paddingVertical: 14,
        borderRadius: 999, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8
    },
    rescanText: { color: '#2563EB', fontWeight: '700', fontSize: 15 },
    barcodeLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
    notInstalledBox: { alignItems: 'center', padding: 32, maxWidth: 340 },
    notInstalledTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginTop: 24, marginBottom: 12 },
    notInstalledText: { color: 'rgba(255,255,255,0.65)', fontSize: 14, textAlign: 'center', lineHeight: 22 },
    codeBox: { backgroundColor: '#1E1E2E', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginVertical: 12 },
    code: { color: '#60A5FA', fontFamily: 'monospace', fontSize: 13 },
    backButton: { marginTop: 24, backgroundColor: '#2563EB', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 999 },
    backButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
    permText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginTop: 16 },
    permSub: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
});
