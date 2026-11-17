import React, {useEffect, useState} from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    useColorScheme
} from "react-native";
import {useTranslation} from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import {
    getUsers,
    sendFriendRequest,
    getFriends,
    getPendingFriendRequests,
    acceptFriendRequest,
    declineFriendRequest,
    getSentPendingRequests
} from "../../data/apiManager";
import {Colors} from "../../constants/theme";

export default function FriendsScreen() {
    const {t} = useTranslation();
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];

    const [loading, setLoading] = useState(true);
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [sendingRequests, setSendingRequests] = useState(new Set());

    async function loadUserId() {
        try {
            const id = await SecureStore.getItemAsync('userId');
            if (id) {
                setCurrentUserId(parseInt(id, 10));
            }
        } catch (e) {
            console.error("Erreur lors du chargement de l'ID utilisateur:", e);
        }
    }

    async function fetchData() {
        if (currentUserId === null) {
            return;
        }

        try {
            const [
                fList,
                pList,
                sPList,
                uListResponse
            ] = await Promise.all([
                getFriends(),
                getPendingFriendRequests(),
                getSentPendingRequests(),
                getUsers()
            ]);

            const uList = uListResponse?.data || uListResponse;

            setFriends(fList);
            setPendingRequests(pList)

            let excludedIds = new Set();

            excludedIds.add(currentUserId);

            fList.forEach(f => {
                excludedIds.add(f.sender_id);
                excludedIds.add(f.receiver_id);
            });
            pList.forEach(p => {
                excludedIds.add(p.sender_id);
                excludedIds.add(p.receiver_id);
            });
            sPList.forEach(p => {
                excludedIds.add(p.sender_id);
                excludedIds.add(p.receiver_id);
            });

            const filteredUsers = uList.filter(u =>
                !fList.some(f =>
                    (f.sender_id === currentUserId && f.receiver_id === u.id) ||
                    (f.sender_id === u.id && f.receiver_id === currentUserId)
                ) &&
                !pList.some(p =>
                    (p.sender_id === currentUserId && p.receiver_id === u.id) ||
                    (p.sender_id === u.id && p.receiver_id === currentUserId)
                ) &&
                !sPList.some(p =>
                    (p.sender_id === currentUserId && p.receiver_id === u.id) ||
                    (p.sender_id === u.id && p.receiver_id === currentUserId)
                )
            );

            setUsers(filteredUsers);
        } catch (e) {
            console.log("Erreur fetch friends:", e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadUserId();
    }, []);

    useEffect(() => {
        if (currentUserId !== null) {
            fetchData();
        }
    }, [currentUserId]);

    async function handleSendRequest(userId) {
        if (sendingRequests.has(userId)) return;

        setSendingRequests(prev => new Set(prev).add(userId));
        try {
            await sendFriendRequest(userId);
            alert(t('demandeEnvoyée'));
            fetchData();
        } catch (e) {
            alert(e.message);
        } finally {
            setSendingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    }

    async function handleAccept(id) {
        await acceptFriendRequest(id);
        fetchData();
    }

    async function handleDecline(id) {
        await declineFriendRequest(id);
        fetchData();
    }

    if (loading) return <ActivityIndicator size="large" style={{marginTop: 50}}/>;

    return (
        <View style={{flex: 1, padding: 16}}>
            <Text style={[styles.title, {color: themeColors.text}]}>{t('mesAmis')}</Text>
            <FlatList
                data={friends}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({item}) => (
                    <View style={styles.box}>
                        <Text style={{color: themeColors.text}}>{item.sender?.name || item.receiver?.name}</Text>
                    </View>
                )}
                ListEmptyComponent={<Text style={[styles.empty,{color: themeColors.text}]}>{t('aucunAmi')}</Text>}
            />

            <Text style={[styles.title, {color: themeColors.text}]}>{t('demandesRecues')}</Text>
            <FlatList
                data={pendingRequests}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({item}) => (
                    <View style={styles.box}>
                        <Text style={{color: themeColors.text}}>{item.sender.name}</Text>

                        <View style={{flexDirection: "row", gap: 10}}>
                            <TouchableOpacity onPress={() => handleAccept(item.id)}>
                                <Text style={[styles.accept, {color: themeColors.text}]}>{t('accepter')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => handleDecline(item.id)}>
                                <Text style={[styles.decline, {color: themeColors.text}]}>{t('refuser')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={<Text style={[styles.empty, {color: themeColors.text}]}>{t('aucuneDemande')}</Text>}
            />

            <Text style={[styles.title, {color: themeColors.text}]}>{t('ajouterAmi')}</Text>
            <FlatList
                data={users}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({item}) => (
                    <View style={styles.box}>
                        <Text style={{color: themeColors.text}}>{item.name}</Text>

                        <TouchableOpacity onPress={() => handleSendRequest(item.id)}>
                            <Text style={[styles.addBtn, {color: themeColors.text}]}>{t('ajouter')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 20,
        fontWeight: "600",
        marginVertical: 10,
    },
    box: {
        padding: 12,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        marginVertical: 5,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    empty: {
        color: "#888",
        fontStyle: "italic",
        marginBottom: 10
    },
    addBtn: {
        color: "blue",
        fontWeight: "bold"
    },
    accept: {
        color: "green",
        fontWeight: "bold"
    },
    decline: {
        color: "red",
        fontWeight: "bold"
    },
});
