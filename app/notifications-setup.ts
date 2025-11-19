// app/notifications-setup.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Foreground handling style
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// Android channel (required for Android to show heads-up)
export async function ensureAndroidChannel() {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('alarms', {
            name: 'Alarms & Reminders',
            importance: Notifications.AndroidImportance.MAX,
            sound: 'default',
            vibrationPattern: [250, 250, 250, 250],
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
    }
}