// app/notifications-setup.ts
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase } from './config';

// How notifications behave when received in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return null;
  }

  // EAS project id (needed on dev / bare builds)
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  if (!projectId) {
    console.log('No EAS projectId found in app config');
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  console.log('Expo push token:', tokenData.data);
  return tokenData.data;
}

// Call this right after login success
export async function setupPushTokenAfterLogin() {
  const token = await registerForPushNotificationsAsync();
  if (!token) return;

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) {
    console.log('getUser error', userErr);
    return;
  }
  if (!user) return;

  // Save or update token in push_tokens
  const { error } = await supabase.from('push_tokens').upsert(
    {
      user_id: user.id,
      expo_push_token: token,
      revoked: false,
    },
    {
      // one row per token, but many tokens per user
      onConflict: 'expo_push_token',
    },
  );

  if (error) {
    console.log('Error saving push token', error);
  } else {
    console.log('Push token saved successfully');
  }
}