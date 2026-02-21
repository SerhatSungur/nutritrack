import { Platform } from 'react-native';

/**
 * Defensive wrapper for Expo Haptics to ensure the app doesn't crash 
 * if the dependency is missing or if we are on an unsupported platform.
 * Uses dynamic require to prevent bundling errors.
 */
class HapticsService {
    private isAvailable = Platform.OS !== 'web';
    private hapticsPkg: any = null;

    private getPkg() {
        if (!this.isAvailable) return null;
        if (this.hapticsPkg) return this.hapticsPkg;

        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            this.hapticsPkg = require('expo-haptics');
            return this.hapticsPkg;
        } catch (e) {
            this.isAvailable = false;
            return null;
        }
    }

    async selection() {
        const pkg = this.getPkg();
        if (!pkg) return;
        try {
            await pkg.selectionAsync();
        } catch (e) { }
    }

    async lightImpact() {
        const pkg = this.getPkg();
        if (!pkg) return;
        try {
            await pkg.impactAsync(pkg.ImpactFeedbackStyle.Light);
        } catch (e) { }
    }

    async success() {
        const pkg = this.getPkg();
        if (!pkg) return;
        try {
            await pkg.notificationAsync(pkg.NotificationFeedbackType.Success);
        } catch (e) { }
    }

    async error() {
        const pkg = this.getPkg();
        if (!pkg) return;
        try {
            await pkg.notificationAsync(pkg.NotificationFeedbackType.Error);
        } catch (e) { }
    }

    async warning() {
        const pkg = this.getPkg();
        if (!pkg) return;
        try {
            await pkg.notificationAsync(pkg.NotificationFeedbackType.Warning);
        } catch (e) { }
    }
}

export const haptics = new HapticsService();
