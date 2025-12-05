// supabase/functions/send-due-notifications/types.d.ts
declare module 'npm:expo-server-sdk@4' {
    export type ExpoPushMessage = {
        to: string | string[];
        sound?: 'default' | null;
        title?: string;
        body?: string;
        data?: Record<string, any>;
        ttl?: number;
        expiration?: number;
        priority?: 'default' | 'normal' | 'high';
    };

    export interface ExpoPushTicket {
        status: 'ok' | 'error';
        id?: string;
        message?: string;
        details?: any;
    }

    export default class Expo {
        constructor(options?: any);
        static isExpoPushToken(token: string): boolean;
        chunkPushNotifications(
            messages: ExpoPushMessage[],
        ): ExpoPushMessage[][];
        sendPushNotificationsAsync(
            messages: ExpoPushMessage[],
        ): Promise<ExpoPushTicket[]>;
    }
}