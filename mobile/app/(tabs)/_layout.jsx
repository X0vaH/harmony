import {Tabs} from 'expo-router';
import React, {useState, useEffect, useContext} from 'react';
import {HapticTab} from '@/components/haptic-tab';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {Colors} from '@/constants/theme';
import {useTranslation} from "react-i18next";
import NetInfo from '@react-native-community/netinfo';
import {View, Text, StyleSheet, TouchableOpacity, useColorScheme, Switch, Appearance} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import {
    setLang,
    setTheme,
    setNotifications
} from '@/data/apiManager';
import {ConnectionContext} from '../context/ConnectionContext';

function useNetInfoConnection(setIsConnected) {
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected);
        });
        return () => unsubscribe();
    }, [setIsConnected]);
}

function useAdminFlag() {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const admin = await SecureStore.getItemAsync('is_admin');
                if (mounted) {
                    setIsAdmin(admin === 'true');
                }
            } catch (error) {
                console.error('[AdminFlag] Error reading is_admin:', error);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    return isAdmin;
}

function useNotificationPreference() {
    const [notifPref, setNotifPref] = useState(null); // null | bool

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const pref = await SecureStore.getItemAsync('get_notif');
                if (mounted) {
                    setNotifPref(pref === 'true');
                }
            } catch (error) {
                console.error('[NotifPref] Error loading preference:', error);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    const toggleNotifPref = async () => {
        const oldPref = notifPref;
        const newPrefBool = !(notifPref === true);
        setNotifPref(newPrefBool);

        try {
            const userId = await SecureStore.getItemAsync('userId');
            if (!userId) {
                console.error('User ID not found');
                setNotifPref(oldPref);
                return;
            }

            await SecureStore.setItemAsync('get_notif', newPrefBool ? 'true' : 'false');
            await setNotifications(userId, newPrefBool ? 1 : 0);
        } catch (error) {
            console.error('[NotifPref] Error updating notification preference:', error);
            setNotifPref(oldPref);
        }
    };

    return {notifPref, toggleNotifPref};
}

function useThemeChanger() {
    return async (currentColorScheme) => {
        const newTheme = currentColorScheme === 'dark' ? 'light' : 'dark';
        Appearance.setColorScheme(newTheme);
        console.log('changement de theme ', newTheme);

        try {
            const userId = await SecureStore.getItemAsync('userId');
            if (!userId) {
                console.error('User ID not found');
                return;
            }

            console.log('Changement de theme pour le user:', userId);

            await setTheme(userId, newTheme === 'light' ? 1 : 0);
            console.log('pref is_light mode = ', newTheme === 'light' ? 1 : 0);
        } catch (error) {
            console.error('[Theme] Error updating theme preference:', error);
        }
    };
}

function useLanguageChanger() {
    return async (i18n) => {
        const newLanguage = i18n.language === 'en' ? 'fr' : 'en';
        i18n.changeLanguage(newLanguage);

        console.log('Changing language to:', newLanguage);

        try {
            const userId = await SecureStore.getItemAsync('userId');
            if (!userId) {
                console.error('User ID not found');
                return;
            }

            console.log('Updating language for user ID:', userId);

            await setLang(userId, newLanguage);
            console.log('Language updated successfully in the API');
        } catch (error) {
            console.error('[Lang] Error updating language in the API:', error);
        }
    };
}

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const {t, i18n} = useTranslation();
    const {isConnected, setIsConnected} = useContext(ConnectionContext);

    useNetInfoConnection(setIsConnected);
    const isAdmin = useAdminFlag();
    const {notifPref, toggleNotifPref} = useNotificationPreference();
    const changementDeTheme = useThemeChanger();
    const changeLang = useLanguageChanger();

    return (
        <View style={{flex: 1}}>
            <SafeAreaView style={styles.funnyButtons}>
                <TouchableOpacity
                    style={styles.languageButton}
                    onPress={() => changeLang(i18n)}
                >
                    <Text style={styles.languageButtonText}>
                        {i18n.language === 'en' ? 'FR' : 'EN'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.themeButton}>
                    <Text style={styles.themeButtonText}>Mode</Text>
                    <Switch
                        value={colorScheme === 'dark'}
                        onChange={() => changementDeTheme(colorScheme)}
                    />
                </View>

                <TouchableOpacity
                    style={styles.notifButton}
                    onPress={toggleNotifPref}
                >
                    <Text style={styles.languageButtonText}>
                        {t('notif')} {notifPref === null ? '' : notifPref ? 'on' : 'off'}
                    </Text>
                </TouchableOpacity>

            </SafeAreaView>

            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                    headerShown: false,
                    tabBarButton: HapticTab,
                }}
                options={{
                    headerShown: false,
                }}>
                <Tabs.Screen
                    name="index"
                    options={{
                        title: t('accueil'),
                        tabBarIcon: ({color}) => <IconSymbol size={28} name="house.fill" color={color}/>,
                    }}
                />
                <Tabs.Screen
                    name="salons"
                    options={{
                        title: t('salons'),
                        tabBarIcon: ({color}) => <IconSymbol size={28} name="salons.fill" color={color}/>,
                    }}
                />
                <Tabs.Screen
                    name="dm"
                    options={{
                        title: t('dm'),
                        tabBarIcon: ({color}) => <IconSymbol size={28} name="message.fill" color={color}/>,
                    }}
                />
                <Tabs.Screen
                    name="friends"
                    options={{
                        title: t('friends'),
                        tabBarIcon: ({color}) => <IconSymbol size={28} name="message.fill" color={color}/>,
                    }}
                />
                <Tabs.Screen
                    name="profil"
                    options={{
                        title: "Profil",
                        tabBarIcon: ({color}) => <IconSymbol size={28} name="profil.fill" color={color}/>,
                    }}
                />
                <Tabs.Screen
                    name="admin"
                    options={{
                        href: isAdmin ? 'admin' : null,
                        title: t('admin'),
                        tabBarIcon: ({color}) => <IconSymbol size={28} name="admin.fill" color={color}/>,
                    }}
                />
            </Tabs>


            {!isConnected && (
                <View style={styles.offlineBanner}>
                    <Text style={styles.offlineText}>{t('noInternet')}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    languageButton: {
        padding: 10,
        backgroundColor: '#007AFF',
        borderRadius: 5,
        marginLeft: 8,
    },
    notifButton: {
        padding: 10,
        backgroundColor: '#007AFF',
        borderRadius: 5,
        marginLeft: 8,
    },
    funnyButtons: {
        marginTop: 28,
        paddingHorizontal: 12,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        // optional: add space on very small devices
        gap: 8,
    },
    themeButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: '#007AFF',
        borderRadius: 20,
        marginLeft: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    themeButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 13,
    },
    languageButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    offlineBanner: {
        backgroundColor: 'red',
        padding: 10,
        alignItems: 'center',
    },
    offlineText: {
        color: 'white',
        fontWeight: 'bold',
    },
});