import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    FlatList,
    Alert,
    useColorScheme,
    Modal, Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {useEffect, useMemo, useRef, useState, useContext} from 'react';
import {
    createDm,
    createMessage, createMessageDoublons,
    getDmsById, getMessageByBmIdAndKey,
    getOtherUserByDmId, getPublicKey,
    getUsers,
    sendTyping,
    getBackgroundDm,
    setBackgroundDm, getUserProfilePicture
} from '../../data/apiManager';
import {useChannel} from '../../data/useDmChannel';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import {Colors} from '../../constants/theme';
import RNPickerSelect from 'react-native-picker-select';
import {ConnectionContext} from '../context/ConnectionContext';
import {decryptMessage, encryptMessage} from "../../data/useEncryption";
import MessageWithTag from "../../components/MessageWithTag";
import {TAGS} from "../utils/tags";

// Configuration des notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

function useSecureUserId() {
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                const id = await SecureStore.getItemAsync('userId');
                if (mounted) {
                    setUserId(id);
                }
            } catch (e) {
                Alert.alert('Error fetching userId', String(e?.message ?? e));
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    return userId;
}

function useDmBootstrap(
    currentUserId,
    dmAdded,
    selectedUserId,
    setSelectedUserId,
    setUsers,
    setDmConversations,
    t,
    myPrivateKey,
    myPublicKeyId
) {
    const toArray = (x) =>
        Array.isArray(x) ? x : Array.isArray(x?.data) ? x.data : [];

    useEffect(() => {
        // ⬅ bloque tant que tout n'est pas prêt
        if (!currentUserId || !myPrivateKey || !myPublicKeyId) {
            return;
        }

        (async () => {
            try {
                const rawDms = await getDmsById(currentUserId);
                const dms = toArray(rawDms);

                const dataUsers = await getOtherUserByDmId(currentUserId);
                setUsers(toArray(dataUsers));
                console.log("ma cle public", myPublicKeyId);

                const convs = await Promise.all(
                    dms.map(async (dm) => {
                        const rawMsgs = await getMessageByBmIdAndKey(dm.id, myPublicKeyId);
                        const msgs = toArray(rawMsgs);
                        return {
                            id: dm.id,
                            userId1: dm.user_id1,
                            userId2: dm.user_id2,
                            dm_id: dm.id,
                            messages: msgs.map((m) => {
                                const decryptedContent = decryptMessage(m.contenu, myPrivateKey);
                                return {
                                    id: m.id,
                                    userId: m.user_id,
                                    content: decryptedContent || "[Unable to decrypt message]",
                                    date: m.date,
                                    dm_id: dm.id,
                                };
                            }),
                        };
                    })
                );

                convs.forEach((c) =>
                    c.messages.sort(
                        (a, b) => new Date(a.date) - new Date(b.date)
                    )
                );
                setDmConversations(convs);

                if (!selectedUserId && convs.length) {
                    const first = convs[0];
                    setSelectedUserId(
                        first.userId1 === currentUserId
                            ? first.userId2
                            : first.userId1
                    );
                }
            } catch (e) {
                console.error('[BOOT] load error raw:', e); // 🔍 pour debug console
                Alert.alert(
                    '[BOOT] load error',
                    String(e?.message ?? t('erreur'))
                );
                setDmConversations([]);
            }
        })();
    }, [
        currentUserId,
        dmAdded,
        selectedUserId,
        setSelectedUserId,
        setUsers,
        setDmConversations,
        t,
        myPrivateKey,
        myPublicKeyId
    ]);
}

function useAllUsers(currentUserId, dmConversations) {
    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
        if (!currentUserId) return;

        (async () => {
            try {
                const res = await getUsers();
                const all = res.data;

                const existingDmUserIds = new Set(
                    dmConversations.map((dm) =>
                        dm.userId1 === currentUserId
                            ? dm.userId2
                            : dm.userId1
                    )
                );

                const others = all.filter(
                    (u) =>
                        u.id !== currentUserId &&
                        !existingDmUserIds.has(u.id)
                );

                setAllUsers(others);
            } catch (e) {
                console.error(
                    'Erreur lors du chargement des utilisateurs:',
                    e
                );
            }
        })();
    }, [currentUserId, dmConversations]);

    return allUsers;
}

export default function DmPage() {
    const {t} = useTranslation();


    const [filterTag, setFilterTag] = useState(null);

    const [users, setUsers] = useState([]);
    const [dmConversations, setDmConversations] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const [text, setText] = useState('');
    const [dmAdded, setDmAdded] = useState(false);

    const seenIdsRef = useRef(new Set());
    const listRef = useRef(null);
    const messagesEndRef = useRef(null);
    const listeMessageOffline = useRef([]);

    // track whether we should auto-scroll (true when user is at/near bottom)
    const autoScrollRef = useRef(true);

    const userId = useSecureUserId();
    const currentUserId = userId ? parseInt(userId, 10) : null;

    const {isConnected} = useContext(ConnectionContext);

    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];

    const [myPublicKey, setMyPublicKey] = useState(null);
    const [myPrivateKey, setMyPrivateKey] = useState(null);
    const [myPublicKeyId, setMyPublicKeyId] = useState(null);

    const [backgroundColor, setBackgroundColor] = useState(themeColors.background);

    const [profilePictures, setProfilePictures] = useState({});

    useEffect(() => {
        (async () => {
            const pk = await SecureStore.getItemAsync('myPublicKey');
            const myPublicKeyId = await SecureStore.getItemAsync('myPublicKeyId');

            const myPrivateKey = await SecureStore.getItemAsync('myPrivateKey');
            setMyPublicKey(pk);
            setMyPrivateKey(myPrivateKey);
            setMyPublicKeyId(myPublicKeyId);
        })();
    }, []);

    useDmBootstrap(
        currentUserId,
        dmAdded,
        selectedUserId,
        setSelectedUserId,
        setUsers,
        setDmConversations,
        t,
        myPrivateKey,
        myPublicKeyId,
    );

    const allUsers = useAllUsers(currentUserId, dmConversations);

    useEffect(() => {
        if (!users || users.length === 0) return;

        let cancelled = false;

        (async () => {
            try {
                const updates = {};

                await Promise.all(users.map(async (u) => {
                        if (profilePictures[u.id] !== undefined) return;

                        try {
                            const res = await getUserProfilePicture(u.id);
                            const url = res?.data?.photo_url ?? null;
                            updates[u.id] = url;
                        } catch (e) {
                            console.warn('[DM Expo] erreur load profile pic user', u.id, e);
                            updates[u.id] = null;
                        }
                    })
                );
                if (!cancelled && Object.keys(updates).length > 0) {
                    setProfilePictures((prev) => ({...prev, ...updates}));
                }
            } catch (e) {
                console.error('[DM Expo] erreur chargement profile pics:', e);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [users, profilePictures]);

    useEffect(() => {
        registerForNotifications();
    }, []);

    const handleNotif = async (
        title = 'Nouveau message',
        body = 'Le message recu'
    ) => {
        const userGetNotif = await SecureStore.getItemAsync('userId');

        if (userGetNotif !== 'true') {
            await Notifications.scheduleNotificationAsync({
                content: {title, body},
                trigger: null,
            });
        }
    };

    const getUserById = (id) => users.find((u) => u.id === id);

    const currentDM = useMemo(() => {
        return dmConversations.find(
            (dm) =>
                (dm.userId1 === currentUserId &&
                    dm.userId2 === selectedUserId) ||
                (dm.userId1 === selectedUserId &&
                    dm.userId2 === currentUserId)
        );
    }, [dmConversations, currentUserId, selectedUserId]);

    const getDmId = (userIdParam, otherUserId) => {
        const dm = dmConversations.find(
            (d) =>
                (d.userId1 === userIdParam &&
                    d.userId2 === otherUserId) ||
                (d.userId1 === otherUserId &&
                    d.userId2 === userIdParam)
        );
        return dm?.dm_id ?? null;
    };

    const channelId = getDmId(currentUserId, selectedUserId);
    const channelName = channelId ? 'dm.' + channelId : null;

    // Background
    useEffect(() => {
        if (!channelId) return;

        let cancelled = false;

        const fetchBackground = async () => {
            try {
                const bg = await getBackgroundDm(channelId);
                console.log(bg);
                const color = bg?.data?.couleur ?? themeColors.background;
                if (!cancelled) {
                    setBackgroundColor(color);
                }
            } catch (err) {
                console.error('[DM] Erreur chargement background (Expo):', err);
                if (!cancelled) {
                    setBackgroundColor(themeColors.background);
                }
            }
        };

        fetchBackground();

        return () => {
            cancelled = true;
        };
    }, [channelId, themeColors.background]);

    // Abonnement au channel
    useChannel(
        channelName,
        async (event) => {
            if (!currentUserId) return;

            const payload = event;

            switch (payload.type) {
                case 'typing': {
                    const fromId = payload.user_id ?? payload.userId;
                    const isTypingFlag = !!payload.isTyping;

                    console.log('[WS typing handler]', {
                        fromId,
                        isTypingFlag,
                    });

                    if (fromId && fromId !== currentUserId) {
                        setTypingUser(isTypingFlag ? fromId : null);
                    }
                    return;
                }

                case 'presence': {
                    const uid = payload.user_id ?? payload.userId;
                    const present = !!payload.estPresent;

                    if (uid && uid !== currentUserId) {
                        setUsers((prev) =>
                            prev.map((u) =>
                                String(u.id) === String(uid)
                                    ? {...u, estOnline: present}
                                    : u
                            )
                        );
                    }
                    console.log('[presence]', payload);
                    return;
                }

                case 'message': {
                    if (!selectedUserId || !myPublicKey) return;

                    if (payload.public_key !== myPublicKey) {
                        console.warn("Clé publique du message ne correspond pas à la clé locale. Message ignoré.");
                        return;
                    }

                    console.log("public key: ", payload.public_key)

                    const serverId = payload.id ?? null;
                    if (serverId) seenIdsRef.current.add(serverId);

                    const decryptedContent = await decryptMessage(payload.contenu, myPrivateKey);

                    const newMsg = {
                        id: serverId ?? Date.now(),
                        userId: payload.user_id,
                        content: decryptedContent,
                        date: payload.date,
                        userId1: currentUserId,
                        userId2: selectedUserId,
                        dm_id: payload.dm_id,
                    };

                    setDmConversations((prev) => {
                        const idx = prev.findIndex(
                            (dm) => dm.dm_id === payload.dm_id
                        );
                        if (idx !== -1) {
                            const copy = [...prev];
                            copy[idx] = {
                                ...copy[idx],
                                dm_id:
                                    copy[idx].dm_id ??
                                    newMsg.dm_id,
                                messages: [
                                    ...copy[idx].messages,
                                    newMsg,
                                ],
                            };
                            return copy;
                        }
                        return [
                            ...prev,
                            {
                                id: channelId,
                                userId1: currentUserId,
                                userId2: selectedUserId,
                                messages: [newMsg],
                            },
                        ];
                    });
                    return;
                }

                default:
                    console.warn(
                        '[WS] event sans type connu',
                        payload
                    );
                    return;
            }
        },
        ['.message.sent', '.presence.updated', '.typing.updated']
    );

    // When messages count changes, scroll only if user is at bottom
    useEffect(() => {
        const len = currentDM?.messages?.length ?? 0;
        if (len > 0 && autoScrollRef.current) {
            setTimeout(() => listRef.current?.scrollToEnd({animated: true}), 100);
        }
    }, [currentDM?.messages?.length]);

    // Envoie message du client
    const sendMessage = async (msgText) => {
        if (!msgText || !selectedUserId) return;

        console.log('[sendMessage] :', {msgText, selectedUserId, channelId});

        try {
            const otherRes = await getPublicKey(selectedUserId)

            const otherPublicKey = otherRes.data.public_key;

            const encryptedForOther = encryptMessage(msgText, otherPublicKey);
            const encryptedForMe = encryptMessage(msgText, myPublicKey);

            console.log('[sendMessage] mesage crypté :', encryptedForOther);

            if (isConnected) {
                const newMsg = {
                    id: Date.now(),
                    userId: currentUserId,
                    content: msgText,
                    date: new Date(),
                    userId1: currentUserId,
                    userId2: selectedUserId,
                    dm_id: channelId,
                };

                setDmConversations((prev) => {
                    const idx = prev.findIndex(
                        (dm) => dm.dm_id === channelId
                    );
                    if (idx !== -1) {
                        const copy = [...prev];
                        copy[idx] = {
                            ...copy[idx],
                            dm_id:
                                copy[idx].dm_id ??
                                newMsg.dm_id,
                            messages: [
                                ...copy[idx].messages,
                                newMsg,
                            ],
                        };
                        return copy;
                    }
                    return [
                        ...prev,
                        {
                            id: channelId,
                            userId1: currentUserId,
                            userId2: selectedUserId,
                            messages: [newMsg],
                        },
                    ];
                });

                await createMessage({
                    dm_id: channelId,
                    salon_id: null,
                    user_id: currentUserId,
                    contenu: encryptedForOther,
                    public_key: otherPublicKey,
                });

                console.info('[Client] Message chiffré envoyé');

                await createMessageDoublons({
                    dm_id: channelId,
                    salon_id: null,
                    user_id: currentUserId,
                    contenu: encryptedForMe,
                    public_key: myPublicKey,
                });

                console.info('[Client] Message doublon chiffré envoyé pour moi');

                setText('');
                // scroll only if user was at bottom
                if (autoScrollRef.current) {
                    setTimeout(() => listRef.current?.scrollToEnd({animated: true}), 100);
                }
            } else {
                Alert.alert(t('connexionPerdue'));

                const offlineMessage = {
                    dm_id: channelId,
                    content: msgText,
                };
                listeMessageOffline.current.push(offlineMessage);

                setText('');
            }
        } catch (error) {
            console.error('[sendMessage] erreur', error);
            Alert.alert(t('erreur'), "Impossible d'envoyer le message.");
        }
    };


    const userDms = dmConversations
        .map((dm) => {
            const otherId =
                dm.userId1 === currentUserId
                    ? dm.userId2
                    : dm.userId1;
            const otherUser = users.find((u) => u.id === otherId);
            return {
                ...dm,
                otherUser,
                messages: dm.messages || [],
                lastMessage: (dm.messages || []).at(-1),
            };
        })
        .filter((dm) => dm.otherUser);

    const currentDMView = currentDM || {messages: []};

    const popUpSelectUsername = () => setShowModal(true);

    const handleCreateDm = async () => {
        if (!selectedUser) {
            Alert.alert(
                t('erreur'),
                t('selectionnerUtilisateur')
            );
            return;
        }

        const alreadyExists = dmConversations.some(
            (dm) =>
                (dm.userId1 === currentUserId &&
                    dm.userId2 === selectedUser) ||
                (dm.userId1 === selectedUser &&
                    dm.userId2 === currentUserId)
        );

        if (alreadyExists) {
            Alert.alert(t('dmExisteDeja'));
            setShowModal(false);
            return;
        }

        try {
            const response = await createDm({
                user_id1: currentUserId,
                user_id2: selectedUser,
            });
            const newDm = response.data;

            setDmConversations((prev) => [
                ...prev,
                {
                    ...newDm,
                    messages: [],
                },
            ]);

            setSelectedUserId(selectedUser);
            setShowModal(false);
            Alert.alert(t('succes'), t('dmCree'));

            setDmAdded((prev) => !prev);
        } catch (e) {
            console.error(e);
            Alert.alert(
                t('erreur'),
                e?.message || t('errCreationDm')
            );
        }
    };

    const envoieMessageOffline = async () => {
        console.log('{Envoi des messages offline...}');
        if (listeMessageOffline.current.length === 0) return;
        Alert.alert(t('connexionRecup'));

        while (listeMessageOffline.current.length > 0) {
            const message = listeMessageOffline.current.shift();

            try {
                await createMessage({
                    dm_id: message.dm_id,
                    salon_id: null,
                    user_id: currentUserId,
                    contenu: message.content,
                    channel_id: channelId,
                    publicKey: "abcdefghijklmnopqrst"
                });

                console.info(
                    '[Offline] Message sent:',
                    message.content
                );
            } catch (error) {
                console.error(
                    "Erreur lors de l'envoi du message offline:",
                    error
                );
            }
        }
    };

    useEffect(() => {
        if (isConnected) {
            envoieMessageOffline();
        }
    }, [isConnected]);

    const typingTimeoutRef = useRef(null);
    const [isTyping, setIsTyping] = useState(false);

    function notifyTyping(isTypingFlag) {
        if (!channelId || !channelName) return;
        const payload = {
            channel: channelName,
            user_id: currentUserId,
            isTyping: isTypingFlag,
        };
        sendTyping(channelId, payload).catch((err) =>
            console.warn('[typing] send failed', err)
        );
    }

    const handleSelectBackgroundColor = async (color) => {
        if (!channelId) return;

        setBackgroundColor(color);

        try {
            await setBackgroundDm(
                {
                    dm_id: channelId,
                    couleur: color,
                }
            );
            console.info('[DM Expo] Background sauvegardé');
        } catch (err) {
            console.error('[DM Expo] Erreur sauvegarde background:', err);
            Alert.alert('Erreur de sauvegarde de la couleur.');
        }
    };

    // handle scroll events to detect if user is at bottom
    const handleScroll = (e) => {
        const {contentOffset, layoutMeasurement, contentSize} = e.nativeEvent;
        const isBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 40;
        autoScrollRef.current = isBottom;
    };

    return (
        <SafeAreaView
            style={{flex: 1, backgroundColor: themeColors.background}}
        >
            <View
                style={[
                    styles.container,
                    {backgroundColor: themeColors.background},
                ]}
            >
                <View
                    style={[
                        styles.sidebar,
                        {backgroundColor: themeColors.background},
                    ]}
                >
                    <Text style={{color: themeColors.text}}>
                        {t('contacts')}
                    </Text>

                    <FlatList
                        data={userDms}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({item}) => {
                            const other = item.otherUser;
                            const avatarUrl = profilePictures[other.id] ?? null;
                            const initial = (other.name?.[0] || '?').toUpperCase();

                            return (
                                <TouchableOpacity
                                    onPress={() => setSelectedUserId(other.id)}
                                    style={[
                                        styles.dmItem,
                                        selectedUserId === other.id && styles.selectedDmItem,
                                    ]}
                                >
                                    {avatarUrl ? (
                                        <Image
                                            source={{uri: avatarUrl}}
                                            style={styles.avatar}
                                        />
                                    ) : (
                                        <View style={styles.avatar}>
                                            <Text style={styles.avatarInitial}>{initial}</Text>
                                        </View>
                                    )}

                                    <View style={{flex: 1}}>
                                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                            <View
                                                style={[
                                                    styles.statusDot,
                                                    {
                                                        backgroundColor: other.estOnline ? 'green' : 'gray',
                                                    },
                                                ]}
                                            />
                                            <Text
                                                style={[
                                                    styles.contactName,
                                                    {color: themeColors.text},
                                                ]}
                                            >
                                                {' '}
                                                {other.name}
                                            </Text>
                                        </View>

                                        <Text style={styles.lastMessage}>
                                            {item.lastMessage ? item.lastMessage.content : 'Aucun message'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                    />

                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={popUpSelectUsername}
                    >
                        <Text style={{color: 'white'}}>
                            {t('ajouter')}
                        </Text>
                    </TouchableOpacity>

                    <Modal
                        visible={showModal}
                        transparent
                        animationType="slide"
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContainer}>
                                <Text style={styles.modalTitle}>
                                    {t('selectionnerUtilisateur')}
                                </Text>

                                <RNPickerSelect
                                    onValueChange={(value) =>
                                        setSelectedUser(value)
                                    }
                                    items={allUsers.map((u) => ({
                                        label: u.name,
                                        value: u.id,
                                    }))}
                                    placeholder={{
                                        label: t('choisirUtilisateur'),
                                        value: null,
                                    }}
                                    style={pickerSelectStyles}
                                    value={selectedUser}
                                />

                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        onPress={() => setShowModal(false)}
                                    >
                                        <Text style={{marginRight: 15}}>
                                            {t('annuler')}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleCreateDm}
                                    >
                                        <Text
                                            style={{
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {t('confirmer')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </View>

                <View style={styles.main}>
                    <View style={styles.header}>
                        <Text
                            style={[
                                styles.contactName,
                                {color: themeColors.text},
                            ]}
                        >
                            {getUserById(selectedUserId)?.name}{' '}
                            {getUserById(selectedUserId)?.estOnline ? '🟢' : '⚪'}
                        </Text>
                    </View>

                    <View style={[
                        styles.messages,
                        {backgroundColor: backgroundColor},
                    ]} ref={messagesEndRef}>
                        <FlatList
                            ref={listRef}
                            data={currentDMView.messages}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({item}) => (
                                <MessageWithTag
                                    message={item}
                                    isCurrentUser={item.userId === currentUserId}
                                    filterTag={filterTag}
                                />
                            )}
                            onContentSizeChange={() => {
                                if (autoScrollRef.current) {
                                    listRef.current?.scrollToEnd({animated: true});
                                }
                            }}
                            onScroll={handleScroll}
                            scrollEventThrottle={100}
                        />

                        {typingUser &&
                            String(typingUser) ===
                            String(selectedUserId) && (
                                <Text
                                    style={[
                                        styles.typingIndicator,
                                        {
                                            color:
                                            themeColors.text,
                                        },
                                    ]}
                                >
                                    {getUserById(typingUser)?.name}{' '}
                                    {t('enTraitDeTaper')}
                                </Text>
                            )}
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.textInput}
                            value={text}
                            onChangeText={(e) => {
                                const newText = e;
                                setText(newText);

                                const nowTyping =
                                    newText.trim().length > 0;

                                if (nowTyping && !isTyping) {
                                    setIsTyping(true);
                                    notifyTyping(true);
                                }

                                if (!nowTyping && isTyping) {
                                    setIsTyping(false);
                                    notifyTyping(false);
                                }

                                if (typingTimeoutRef.current) {
                                    clearTimeout(
                                        typingTimeoutRef.current
                                    );
                                }
                                if (nowTyping) {
                                    typingTimeoutRef.current =
                                        setTimeout(() => {
                                            setIsTyping(false);
                                            notifyTyping(false);
                                        }, 3000);
                                }
                            }}
                            onSubmitEditing={() => {
                                sendMessage(text);
                                setIsTyping(false);
                                notifyTyping(false);
                            }}
                            placeholder={t('écrireMessage')}
                        />
                        <TouchableOpacity
                            style={styles.sendButton}
                            onPress={() => sendMessage(text)}
                        >
                            <Text>{t('envoyer')}</Text>
                        </TouchableOpacity>
                    </View>
                    {channelId && (
                        <View style={styles.colorPickerRow}>
                            <View style={styles.colorDotsRow}>
                                {DM_COLORS.map((c) => (
                                    <TouchableOpacity
                                        key={c}
                                        onPress={() => handleSelectBackgroundColor(c)}
                                        style={[
                                            styles.colorDot,
                                            {
                                                backgroundColor: c,
                                                borderColor:
                                                    c === backgroundColor ? '#fff' : 'transparent',
                                                borderWidth: c === backgroundColor ? 2 : 1,
                                            },
                                        ]}
                                    />
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

async function registerForNotifications() {
    if (!Device.isDevice) {
        Alert.alert(
            'Les notifications nécessitent un appareil physique!'
        );
        return;
    }
    const {status: existingStatus} =
        await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const {status} =
            await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted') {
        Alert.alert('Permission refusée pour les notifications !');
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    sidebar: {
        width: 150,
        borderRightWidth: 1,
        borderRightColor: '#ccc',
        padding: 16,
    },
    sidebarTitle: {
        fontSize: 20,
        marginBottom: 16,
    },
    contactName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    dmItem: {
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    selectedDmItem: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#4b5563',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    avatarInitial: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    headerUserRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4b5563',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    lastMessage: {
        marginBottom: 10,
        fontSize: 12,
        color: 'gray',
    },
    main: {
        flex: 1,
        flexDirection: 'column',
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    messages: {
        flex: 1,
        padding: 16,
    },
    messageContainer: {
        marginBottom: 8,
        flexDirection: 'row',
    },
    messageBubble: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 16,
        maxWidth: '60%',
    },
    messageDate: {
        fontSize: 10,
        color: 'gray',
        textAlign: 'right',
        marginTop: 4,
    },
    typingIndicator: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        color: 'gray',
    },
    inputContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        padding: 8,
        alignItems: 'center',
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        color: 'white',
    },
    sendButton: {
        marginLeft: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 6,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: 300,
    },
    modalTitle: {
        fontSize: 18,
        marginBottom: 10,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    addButton: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        alignItems: 'center',
    },
    colorPickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    colorDotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    colorDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        marginHorizontal: 2,
    },
    filterContainer: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 15,
        fontSize: 16,
        color: '#000',
    },
    inputAndroid: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 15,
        fontSize: 16,
        color: '#000',
    },
});

const DM_COLORS = [
    '#1d4ed8',
    '#047857',
    '#f97316',
    '#facc15',
    '#ffffff',
    '#eb3734',
    '#34eb3a'
];