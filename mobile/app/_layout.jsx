import React, {useState, useEffect} from 'react';
import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {StatusBar} from 'expo-status-bar';
import 'react-native-reanimated';
import * as SecureStore from 'expo-secure-store';
import {Stack} from 'expo-router';
import {View, ActivityIndicator, useColorScheme} from 'react-native';
import {ConnectionProvider} from './context/ConnectionContext'
import * as Sentry from '@sentry/react-native';

export const unstable_settings = {};

Sentry.init({
    dsn: 'https://58fdd3a8dfce6146595e3dfd9407741a@o4510359792844800.ingest.us.sentry.io/4510360925700096',

    // Adds more context data to events (IP address, cookies, user, etc.)
    // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
    sendDefaultPii: true,

    // Enable Logs
    enableLogs: true,

    // Configure Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

    // uncomment the line below to enable Spotlight (https://spotlightjs.com)
    // spotlight: __DEV__,
});

function useAuthBootstrap() {
    const [tokenExists, setTokenExists] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const checkAuth = async () => {
            try {
                const token = await SecureStore.getItemAsync('authToken');
                console.log('TOKEN:', token);

                if (token) {
                    if (mounted) {
                        setTokenExists(true);
                    }

                    const userId = await SecureStore.getItemAsync('userId');

                    if (userId) {
                        // si le user est connecté, on l’envoie à Sentry
                        Sentry.setUser({id: userId});
                    } else {
                        // cas weird : token mais pas de userId
                        Sentry.setUser({id: "l'utilisateur n'était pas connecté"});
                    }
                } else {
                    // aucun token → user pas connecté
                    Sentry.setUser({id: "l'utilisateur n'était pas connecté"});
                }
            } catch (e) {
                console.error(e);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        checkAuth();

        return () => {
            mounted = false;
        };
    }, []);

    return {tokenExists, loading};
}


export default Sentry.wrap(function RootLayout() {
    const colorScheme = useColorScheme();
    const {tokenExists, loading} = useAuthBootstrap();

    //Pour le linter
    console.log('tokenExists:', tokenExists);

    if (loading) {
        return (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <ActivityIndicator size="large" color="#4A90E2"/>
            </View>
        );
    }

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <ConnectionProvider>
                <Stack>
                    <Stack.Screen name="auth/index" options={{headerShown: false}}/>
                    <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
                    <Stack.Screen name="modal" options={{presentation: 'modal', title: 'Modal'}}/>
                </Stack>
                <StatusBar style="auto"/>
            </ConnectionProvider>
        </ThemeProvider>
    );
});