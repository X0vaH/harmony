import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    FlatList,
    ActivityIndicator,
    useColorScheme,

} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {useRouter} from 'expo-router';
import {useTranslation} from 'react-i18next';
import {
    getUsers,
    getSalons,
    getMessages,
    deleteMessage,
    deleteSalon,
    deleteUser,
    changeSalonsStatus
} from '@/data/apiManager';
import {SafeAreaView} from "react-native-safe-area-context";
import {Colors} from "../../constants/theme";


export default function AdminScreen() {
    const {t} = useTranslation();
    const router = useRouter();

    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeData, setActiveData] = useState(null);
    const [users, setUsers] = useState([]);
    const [salons, setSalons] = useState([]);
    const [messages, setMessages] = useState([]);
    const [showSidebar, setShowSidebar] = useState(true);

    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];

    useEffect(() => {
        const verifAdmin = async () => {
            const admin = await SecureStore.getItemAsync('is_admin');
            if (admin !== 'true') {
                Alert.alert(t('erreur'), t('accesRefuse'));
                router.replace('/(tabs)');
            } else {
                setIsAdmin(true);
            }
        };
        verifAdmin();
    }, []);

    const fetchData = async (dataType, apiFunction, setDataFunction) => {
        setLoading(true);
        setActiveData(dataType);
        setShowSidebar(false);

        try {
            const response = await apiFunction();
            setDataFunction(response.data || response);
        } catch (e) {
            Alert.alert(t('erreur'), e.message || t('erreurRecupDonnees'));
            setActiveData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id) => {
        Alert.alert(
            t('confirmation'),
            t('suppUtilisateur'),
            [
                {text: t('non'), style: 'cancel'},
                {
                    text: t('oui'),
                    onPress: async () => {
                        try {
                            await deleteUser(id);
                            setUsers(users.filter((u) => u.id !== id));
                            Alert.alert(t('succes'), t('utilisateurSupp'));
                        } catch (e) {
                            Alert.alert(t('erreur'), e.message);
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteSalon = async (id) => {
        Alert.alert(
            t('confirmation'),
            t('suppSalon'),
            [
                {text: t('non'), style: 'cancel'},
                {
                    text: t('oui'),
                    onPress: async () => {
                        try {
                            await deleteSalon(id);
                            setSalons(salons.filter((s) => s.id !== id));
                            Alert.alert(t('succes'), t('salonSupp'));
                        } catch (e) {
                            Alert.alert(t('erreur'), e.message);
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteMessage = async (id) => {
        Alert.alert(
            t('confirmation'),
            t('suppMessage'),
            [
                {text: t('non'), style: 'cancel'},
                {
                    text: t('oui'),
                    onPress: async () => {
                        try {
                            await deleteMessage(id);
                            setMessages(messages.filter((m) => m.id !== id));
                            Alert.alert(t('succes'), t('messageSupp'));
                        } catch (e) {
                            Alert.alert(t('erreur'), e.message);
                        }
                    },
                },
            ]
        );
    };

    const handleChangeStatus = async (roomId, isPrivate) => {
        const nouvelleIsPrivate = isPrivate ? 0 : 1;

        const confirmMessage = nouvelleIsPrivate
            ? t("confirmMakePrivate")   // on va le rendre privé
            : t("confirmMakePublic");   // on va le rendre public

        Alert.alert(
            t("confirmation"),
            confirmMessage,
            [
                {
                    text: t("annuler"),
                    style: "cancel",
                },
                {
                    text: t("confirmer"),
                    onPress: async () => {
                        try {
                            await changeSalonsStatus(roomId, nouvelleIsPrivate);

                            setSalons(prev =>
                                prev.map(r =>
                                    r.id === roomId
                                        ? {...r, is_private: nouvelleIsPrivate}
                                        : r
                                )
                            );
                        } catch (e) {
                            Alert.alert(
                                t('erreur'),
                                e?.message ?? t('errSalonStatus')
                            );
                        }
                    },
                },
            ]
        );
    };


    if (!isAdmin) return null;

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: themeColors.background}}>
            <View style={[styles.container, {backgroundColor: themeColors.background}]}>
                {showSidebar && (
                    <View style={[styles.sidebar, {backgroundColor: themeColors.background}]}>
                        <Text style={[styles.sidebarTitle, {color: themeColors.text}]}>{t('panneauAdmin')}</Text>

                        <TouchableOpacity
                            style={styles.sidebarButton}
                            onPress={() => fetchData('users', getUsers, setUsers)}
                        >
                            <Text style={styles.sidebarButtonText}>{t('utilisateurs')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.sidebarButton}
                            onPress={() => fetchData('salons', getSalons, setSalons)}
                        >
                            <Text style={styles.sidebarButtonText}>{t('salons')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.sidebarButton}
                            onPress={() => fetchData('messages', getMessages, setMessages)}
                        >
                            <Text style={styles.sidebarButtonText}>{t('messages')}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {!showSidebar && (
                    <View style={styles.content}>
                        <TouchableOpacity
                            onPress={() => setShowSidebar(true)}
                            style={styles.backButton}
                        >
                            <Text style={styles.backButtonText}>{t('retour')}</Text>
                        </TouchableOpacity>

                        {loading && <ActivityIndicator size="large" color="#fff"/>}

                        {activeData === 'users' && (
                            <FlatList
                                data={users}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({item}) => (
                                    <View style={styles.itemContainer}>
                                        <Text style={styles.itemText}>{item.name}</Text>
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDeleteUser(item.id)}
                                        >
                                            <Text style={styles.deleteText}>{t('supprimer')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                        )}

                        {activeData === 'salons' && (
                            <FlatList
                                data={salons}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({item}) => (
                                    <View style={styles.itemContainer}>
                                        <Text style={styles.itemText}>{item.name}</Text>
                                        <TouchableOpacity
                                            style={styles.salonsStatusButton}
                                            onPress={() => handleChangeStatus(item.id, item.is_private)}
                                        >
                                            <Text style={styles.salonsStatusText}>
                                                {item.is_private ? t('public') : t('privé')}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDeleteSalon(item.id)}
                                        >
                                            <Text style={styles.deleteText}>{t('supprimer')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                        )}

                        {activeData === 'messages' && (
                            <FlatList
                                data={messages}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({item}) => (
                                    <View style={styles.itemContainer}>
                                        <Text style={styles.itemText}>{item.contenu || item.content}</Text>
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDeleteMessage(item.id)}
                                        >
                                            <Text style={styles.deleteText}>{t('supprimer')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                        )}
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    sidebar: {
        width: 200,
        backgroundColor: '#222',
        padding: 10,
    },
    sidebarTitle: {
        color: 'white',
        fontSize: 20,
        marginBottom: 10
    },
    sidebarButton: {
        padding: 10,
        marginVertical: 5,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        alignItems: 'center',
    },
    sidebarButtonText: {
        color: 'white',
        fontWeight: 'bold'
    },
    content: {
        flex: 1,
        padding: 20
    },
    backButton: {
        marginBottom: 10
    },
    backButtonText: {
        color: '#00f',
        fontSize: 16
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#222',
        padding: 10,
        marginVertical: 5,
        borderRadius: 8,
    },
    itemText: {
        color: '#fff'
    },
    deleteButton: {
        backgroundColor: 'red',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
    },
    deleteText: {
        color: 'white',
        fontWeight: 'bold'
    },
    salonsStatusButton: {
        backgroundColor: 'black',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
    },
    salonsStatusText: {
        color: 'white',
        fontWeight: 'bold'
    },
});
