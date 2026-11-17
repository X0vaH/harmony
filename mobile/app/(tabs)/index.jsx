import {Image} from 'expo-image';
import {StyleSheet, TouchableOpacity, useColorScheme, Alert, View} from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import {ThemedText} from '@/components/themed-text';
import {ThemedView} from '@/components/themed-view';
import {Link, useRouter} from 'expo-router';
import {useTranslation} from "react-i18next";
import {Colors} from "../../constants/theme";
import * as SecureStore from 'expo-secure-store';
import {updatePresence} from "../../data/apiManager";
import {useEffect, useState} from "react";

function useLogoutHandler(t, router, user) {
    const handleLogout = async () => {
        const payloadOff = {
            user_id: user,
            estPresent: false,
        };

        updatePresence(user, payloadOff);

        try {
            await SecureStore.deleteItemAsync('authToken');
            router.replace('/auth');
        } catch (e) {
            console.error(e);
            Alert.alert(t('erreur'), t('decoImp'));
        }
    };

    return handleLogout;
}

function useSecureUserId() {
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                const id = await SecureStore.getItemAsync('userId');
                if (mounted) setUserId(id);
            } catch (e) {
                console.error('Error fetching userId:', e);
                Alert.alert('Error', String(e?.message ?? e));
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    return userId;
}

export default function HomeScreen() {
    const {t} = useTranslation();
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const userId = useSecureUserId();
    const handleLogout = useLogoutHandler(t, router, userId);

    useEffect(() => {
        const syncPresence = async () => {
            if (!userId) return;

            try {
                const payloadOn = {
                    user_id: userId,
                    estPresent: true,
                };

                await updatePresence(userId, payloadOn);
            } catch (e) {
                console.warn('[presence] failed on mount', e);
            }
        };

        syncPresence();
    }, [userId]);

    return (
        <View style={styles.container}>
            <ParallaxScrollView
                headerBackgroundColor={{light: '#A1CEDC', dark: '#1D3D47'}}
                headerImage={
                    <Image
                        source={require('@/assets/images/harmony.png')}
                        style={styles.reactLogo}
                    />
                }
            >
                <ThemedView style={styles.titleContainer}>
                    <ThemedText type="title">{t('bienvenue')}</ThemedText>
                </ThemedView>

                <ThemedView style={styles.stepContainer}>
                    <Link href="/(tabs)/salons" asChild>
                        <TouchableOpacity style={[styles.button, {borderColor: themeColors.tint}]}>
                            <ThemedText
                                style={[styles.buttonText, {color: themeColors.tint}]}>{t("accesSalons")}</ThemedText>
                        </TouchableOpacity>
                    </Link>
                </ThemedView>

                <ThemedView style={styles.stepContainer}>
                    <Link href="/(tabs)/dm" asChild>
                        <TouchableOpacity style={[styles.button, {borderColor: themeColors.tint}]}>
                            <ThemedText
                                style={[styles.buttonText, {color: themeColors.tint}]}>{t("accesDm")}</ThemedText>
                        </TouchableOpacity>
                    </Link>
                </ThemedView>
            </ParallaxScrollView>
            <View style={[styles.logoutContainer, {backgroundColor: themeColors.background}]}>
                <TouchableOpacity
                    style={[styles.button, {backgroundColor: '#FF3B30', borderColor: '#FF3B30'}]}
                    onPress={handleLogout}
                >
                    <ThemedText style={[styles.buttonText, {color: 'white'}]}>{t('deconnexion')}</ThemedText>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        paddingHorizontal: 20
    },
    stepContainer: {
        gap: 8,
        marginBottom: 8,
        paddingHorizontal: 20
    },
    reactLogo: {
        height: 178,
        width: 290,
        bottom: 0,
        left: 0,
        position: 'absolute',
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: 10,
        borderWidth: 2,
        backgroundColor: 'transparent',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '600',
    },
    logoutContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
});
