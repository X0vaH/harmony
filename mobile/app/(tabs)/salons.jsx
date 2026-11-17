import React, {
    useState,
    useEffect,
    useRef,
    useMemo,
    useContext,
} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    FlatList,
    Alert,
    useColorScheme,
    Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import {
    getUserSalons,
    createSalon,
    getSalonsPublicsNotMember,
    addMemberToSalon,
    removeMemberFromSalon,
    getUserBySalonId,
    sendTyping,
    createMessage,
    getMessageBySalonId,
} from '../../data/apiManager';
import { useChannel } from '../../data/useDmChannel';
import { ConnectionContext } from '../context/ConnectionContext';

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

export default function SalonsScreen() {
    const {t} = useTranslation();
    const colorScheme = useColorScheme();
    const themeColors =
        colorScheme === 'dark'
            ? {background: '#111', text: '#fff'}
            : {background: '#fff', text: '#000'};

    const [salons, setSalons] = useState([]);
    const [selectedSalon, setSelectedSalon] = useState(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState({});
    const listRef = useRef(null);
    const [publicSalons, setPublicSalons] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newSalonName, setNewSalonName] = useState('');
    const [salonMembers, setSalonMembers] = useState([]);
    const typingTimeoutRef = useRef(null);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState(null);

    // Liste de messages offline pour les salons
    const listeMessageOfflineSalons = useRef([]);

    // Connexion
    const {isConnected} = useContext(ConnectionContext);

    // userId via hook
    const userId = useSecureUserId();


    useEffect(() => {
        if (!userId) return;

        const fetchSalons = async () => {
            try {
                const data = await getUserSalons(userId);
                setSalons(data.data || data);
            } catch (e) {
                Alert.alert(t('erreur'), e?.message ?? String(e));
            }
        };

        const fetchPublicSalons = async () => {
            try {
                const data = await getSalonsPublicsNotMember(userId);
                setPublicSalons(data.data || data);
            } catch (e) {
                Alert.alert(t('erreur'), e?.message ?? String(e));
            }
        };

        fetchSalons();
        fetchPublicSalons();
    }, [userId, t]);

    const handleSelectSalon = async (salon) => {
        setSelectedSalon(salon);
        setShowSidebar(false);
        try {
            const salonMembersData = await getUserBySalonId(salon.id);
            const arr = Array.isArray(salonMembersData)
                ? salonMembersData
                : salonMembersData?.data || [];
            setSalonMembers(arr);
        } catch (e) {
            Alert.alert(t('erreur'), e?.message ?? String(e));
        }
    };

    const activeSalonId = selectedSalon?.id ?? null;

    // Nom du channel ex. salon.13
    const salonChannelName = useMemo(() => {
        if (!activeSalonId) return null;
        return `salon.${String(activeSalonId)}`;
    }, [activeSalonId]);

    const seenSalonMsgIdsRef = useRef(new Set());

    function notifyTyping(isTypingFlag) {
        if (!activeSalonId || !salonChannelName || !userId) return;

        const payload = {
            channel: salonChannelName,
            user_id: userId,
            isTyping: isTypingFlag,
        };

        sendTyping(activeSalonId, payload).catch((err) =>
            console.warn('[typing salon] send failed', err)
        );
    }

    // WS
    useChannel(
        salonChannelName,
        async (event) => {
            if (!activeSalonId) return;

            const payload = event;

            switch (payload.type) {
                case 'typing': {
                    const fromId = payload.user_id ?? payload.userId;
                    const isTypingFlag = !!payload.isTyping;

                    console.log('[WS typing handler salon]', {
                        fromId,
                        isTypingFlag,
                    });

                    if (fromId && fromId !== userId) {
                        setTypingUser(isTypingFlag ? fromId : null);
                    }
                    return;
                }

                case 'presence': {
                    const uid = payload.user_id;
                    const present = !!payload.estPresent;

                    if (uid && uid !== userId) {
                        setSalonMembers((prev) =>
                            prev.map((u) =>
                                u.id === uid
                                    ? {...u, estOnline: present}
                                    : u
                            )
                        );
                    }
                    console.log('[presence salon]', payload);
                    return;
                }

                case 'message': {
                    const {
                        id,
                        user_id,
                        contenu,
                        salon_id,
                        date,
                    } = payload;

                    // Anti-doublon
                    if (id && seenSalonMsgIdsRef.current.has(id)) return;
                    if (id) seenSalonMsgIdsRef.current.add(id);

                    const newMsg = {
                        id: id ?? Date.now(),
                        userId: user_id,
                        content: contenu,
                        date: date,
                        salonId: salon_id,
                    };

                    setMessages((prev) => {
                        const list = prev[salon_id] ?? [];
                        const next = {
                            ...prev,
                            [salon_id]: [...list, newMsg],
                        };

                        next[salon_id].sort(
                            (a, b) =>
                                new Date(a.date) - new Date(b.date)
                        );
                        return next;
                    });
                    return;
                }

                default:
                    console.warn(
                        '[WS salon] event sans type connu',
                        payload
                    );
                    return;
            }
        },
        ['.message.sent', '.presence.updated', '.typing.updated']
    );

    useEffect(() => {
        if (!activeSalonId) return;

        async function fetchMessagesSalon() {
            try {
                const res = await getMessageBySalonId(activeSalonId);
                const arr = Array.isArray(res)
                    ? res
                    : Array.isArray(res?.data)
                        ? res.data
                        : [];

                const msgs = arr.map((m) => ({
                    id: m.id,
                    userId: m.user_id,
                    content: m.contenu,
                    date: m.date,
                    salonId: activeSalonId,
                }));

                msgs.sort(
                    (a, b) => new Date(a.date) - new Date(b.date)
                );

                setMessages((prev) => ({
                    ...prev,
                    [activeSalonId]: msgs,
                }));
            } catch (e) {
                console.error(
                    '[SALON] getMessageBySalonId failed:',
                    e
                );
                setMessages((prev) => ({
                    ...prev,
                    [activeSalonId]: [],
                }));
            }
        }

        fetchMessagesSalon();
    }, [activeSalonId]);

    const handleSelectPublicSalon = async (salon) => {
        Alert.alert(
            t('confirmation'),
            t('voulezVousRejoindre', {salon: salon.name}),
            [
                {
                    text: t('non'),
                    style: 'cancel',
                },
                {
                    text: t('oui'),
                    onPress: async () => {
                        try {
                            await addMemberToSalon(userId, salon.id);
                            const dataSalons =
                                await getUserSalons(userId);
                            setSalons(dataSalons.data || dataSalons);

                            const dataPublic =
                                await getSalonsPublicsNotMember(
                                    userId
                                );
                            setPublicSalons(
                                dataPublic.data || dataPublic
                            );

                            Alert.alert(
                                t('succes'),
                                t('vousAvezRejoint', {
                                    salon: salon.name,
                                })
                            );
                        } catch (e) {
                            Alert.alert(
                                t('erreur'),
                                e?.message ?? String(e)
                            );
                        }
                    },
                },
            ]
        );
    };

    const handleLeave = async (salon) => {
        Alert.alert(
            t('confirmation'),
            t('voulezVousQuitter', {salon: salon.name}),
            [
                {
                    text: t('non'),
                    style: 'cancel',
                },
                {
                    text: t('oui'),
                    onPress: async () => {
                        try {
                            await removeMemberFromSalon(
                                salon.id,
                                userId
                            );

                            const dataSalons =
                                await getUserSalons(userId);
                            setSalons(dataSalons.data || dataSalons);

                            const dataPublic =
                                await getSalonsPublicsNotMember(
                                    userId
                                );
                            setPublicSalons(
                                dataPublic.data || dataPublic
                            );

                            Alert.alert(
                                t('succes'),
                                t('vousAvezQuitte', {
                                    salon: salon.name,
                                })
                            );
                            setSelectedSalon(null);
                        } catch (e) {
                            Alert.alert(
                                t('erreur'),
                                e?.message ?? String(e)
                            );
                        }
                    },
                },
            ]
        );
    };

    const handleSendMessage = async () => {
        if (!selectedSalon || !message.trim()) return;

        if (isConnected) {
            try {
                await createMessage({
                    dm_id: null,
                    salon_id: activeSalonId,
                    user_id: userId,
                    contenu: message,
                    channel_id: activeSalonId,
                });
                setMessage('');
                setIsTyping(false);
                notifyTyping(false);
                console.info('[Client] message salon créé');
                listRef.current?.scrollToEnd({animated: true});
            } catch (e) {
                Alert.alert(t('erreur'), e?.message ?? String(e));
            }
        } else {
            Alert.alert(t('connexionPerdue'));

            const offlineMsg = {
                salon_id: activeSalonId,
                contenu: message,
            };
            listeMessageOfflineSalons.current.push(offlineMsg);
            setMessage('');
            setIsTyping(false);
            notifyTyping(false);
        }
    };

    const envoieMessageHorsLigne = async () => {
        if (listeMessageOfflineSalons.current.length === 0) return;
        Alert.alert(t('connexionRecup'));

        while (listeMessageOfflineSalons.current.length > 0) {
            const msg = listeMessageOfflineSalons.current.shift();

            try {
                await createMessage({
                    dm_id: null,
                    salon_id: msg.salon_id,
                    user_id: userId,
                    contenu: msg.contenu,
                    channel_id: msg.salon_id,
                });
                console.info(
                    '[Online] Salon offline message sent OK'
                );
            } catch (e) {
                console.error(
                    '[Online] Failed to send salon message:',
                    e?.message ?? e
                );
                Alert.alert(t('erreur'), e?.message ?? String(e));
            }
        }
    };

    useEffect(() => {
        if (isConnected) {
            envoieMessageHorsLigne();
        }
    }, [isConnected]);

    const popUpConfirmSalonName = () => setShowModal(true);

    const handleAddSalon = async (name) => {
        try {
            const salon = await createSalon(name);

            Alert.alert(
                t('succes'),
                t('salonCree', {salon: name})
            );

            await addMemberToSalon(userId, salon.data.id);

            const dataSalons = await getUserSalons(userId);
            setSalons(dataSalons.data || dataSalons);

            const dataPublic =
                await getSalonsPublicsNotMember(userId);
            setPublicSalons(dataPublic.data || dataPublic);
        } catch (e) {
            Alert.alert(
                t('nomInvalide'),
                e?.message ?? String(e)
            );
        }
    };

    const typingLabel = typingUser
        ? `${
            salonMembers?.find(
                (u) =>
                    String(u.id) === String(typingUser)
            )?.name
        } ${t('enTraitDeTaper')}`
        : '';

    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: themeColors.background,
            }}
        >
            <View
                style={[
                    styles.container,
                    {backgroundColor: themeColors.background},
                ]}
            >
                {showSidebar && (
                    <View
                        style={[
                            styles.sidebar,
                            {
                                backgroundColor:
                                themeColors.background,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.sidebarTitle,
                                {color: themeColors.text},
                            ]}
                        >
                            {t('salons')}
                        </Text>

                        <FlatList
                            data={salons}
                            keyExtractor={(item) =>
                                item.id.toString()
                            }
                            renderItem={({item}) => (
                                <TouchableOpacity
                                    onPress={() =>
                                        handleSelectSalon(item)
                                    }
                                >
                                    <Text
                                        style={[
                                            styles.salonItem,
                                            {
                                                color:
                                                themeColors.text,
                                            },
                                        ]}
                                    >
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />

                        <Text
                            style={[
                                styles.sidebarTitle,
                                {color: themeColors.text},
                            ]}
                        >
                            {t('salonsPublics')}
                        </Text>
                        <FlatList
                            data={publicSalons}
                            keyExtractor={(item) =>
                                item.id.toString()
                            }
                            renderItem={({item}) => (
                                <TouchableOpacity
                                    onPress={() =>
                                        handleSelectPublicSalon(
                                            item
                                        )
                                    }
                                >
                                    <Text
                                        style={[
                                            styles.salonItem,
                                            {
                                                color:
                                                themeColors.text,
                                            },
                                        ]}
                                    >
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />

                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={popUpConfirmSalonName}
                        >
                            <Text style={{color: 'white'}}>
                                {t('ajouter')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {selectedSalon && (
                    <View
                        style={[
                            styles.chatContainer,
                            {
                                backgroundColor:
                                themeColors.background,
                            },
                        ]}
                    >
                        <View
                            style={[
                                styles.chatHeader,
                                {
                                    backgroundColor:
                                    themeColors.background,
                                },
                            ]}
                        >
                            <TouchableOpacity
                                onPress={() => setShowSidebar(true)}
                            >
                                <Text
                                    style={[
                                        styles.backButton,
                                        {color: themeColors.text},
                                    ]}
                                >
                                    {t('retour')}
                                </Text>
                            </TouchableOpacity>
                            <Text
                                style={[
                                    styles.chatTitle,
                                    {color: themeColors.text},
                                ]}
                            >
                                {selectedSalon.name}
                            </Text>

                            <TouchableOpacity
                                style={{
                                    backgroundColor: 'red',
                                    padding: 10,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                    marginTop: 10,
                                }}
                                onPress={() =>
                                    handleLeave(selectedSalon)
                                }
                            >
                                <Text
                                    style={{
                                        color: 'white',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {t('leave')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            ref={listRef}
                            style={styles.chatMessages}
                            data={
                                selectedSalon
                                    ? messages[selectedSalon.id] ||
                                    []
                                    : []
                            }
                            keyExtractor={(item) =>
                                String(item.id)
                            }
                            renderItem={({item}) => {
                                const author =
                                    salonMembers?.find(
                                        (u) =>
                                            String(u.id) ===
                                            String(
                                                item.userId
                                            )
                                    )?.name ??
                                    `#${item.userId}`;

                                return (
                                    <View
                                        style={{
                                            marginBottom: 10,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color:
                                                themeColors.text,
                                                fontWeight: '600',
                                            }}
                                        >
                                            {author}{' '}
                                            <Text
                                                style={{
                                                    color: '#888',
                                                    fontWeight: '400',
                                                }}
                                            >
                                                {item.date
                                                    ? ' ' +
                                                    new Date(
                                                        item.date
                                                    ).toLocaleTimeString(
                                                        [],
                                                        {
                                                            hour: '2-digit',
                                                            minute:
                                                                '2-digit',
                                                        }
                                                    )
                                                    : ''}
                                            </Text>
                                        </Text>
                                        <Text
                                            style={{
                                                color:
                                                themeColors.text,
                                            }}
                                        >
                                            {item.content}
                                        </Text>
                                    </View>
                                );
                            }}
                            onContentSizeChange={() =>
                                listRef.current?.scrollToEnd({
                                    animated: true,
                                })
                            }
                        />

                        {typingLabel && (
                            <Text
                                style={[
                                    styles.typingIndicator,
                                    {color: themeColors.text},
                                ]}
                            >
                                {typingLabel}
                            </Text>
                        )}

                        <View
                            style={[
                                styles.messageInputContainer,
                                {
                                    backgroundColor:
                                    themeColors.background,
                                },
                            ]}
                        >
                            <TextInput
                                style={styles.messageInput}
                                placeholder={t('ecrire')}
                                placeholderTextColor="#888"
                                value={message}
                                onChangeText={(txt) => {
                                    setMessage(txt);

                                    const nowTyping =
                                        txt.trim().length > 0;

                                    if (
                                        nowTyping &&
                                        !isTyping
                                    ) {
                                        setIsTyping(true);
                                        notifyTyping(true);
                                    }

                                    if (
                                        !nowTyping &&
                                        isTyping
                                    ) {
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
                                    handleSendMessage();
                                    setIsTyping(false);
                                    notifyTyping(false);
                                }}
                            />
                            <TouchableOpacity
                                style={styles.sendButton}
                                onPress={handleSendMessage}
                            >
                                <Text style={{color: 'white'}}>
                                    {t('envoyer')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {selectedSalon && (
                    <View
                        style={[
                            styles.membersContainer,
                            {
                                backgroundColor:
                                themeColors.background,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.sidebarTitle,
                                {color: themeColors.text},
                            ]}
                        >
                            {t('membres')}
                        </Text>
                        <FlatList
                            data={salonMembers}
                            keyExtractor={(item) =>
                                item.id.toString()
                            }
                            renderItem={({item}) => (
                                <Text
                                    style={{
                                        color: themeColors.text,
                                    }}
                                >
                                    {item.name}
                                </Text>
                            )}
                        />
                    </View>
                )}

                <Modal
                    visible={showModal}
                    transparent
                    animationType="slide"
                >
                    <View
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                        }}
                    >
                        <View
                            style={{
                                backgroundColor: 'white',
                                padding: 20,
                                borderRadius: 10,
                                width: 300,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 18,
                                    marginBottom: 10,
                                }}
                            >
                                {t('entrerNomSalon')}
                            </Text>
                            <TextInput
                                value={newSalonName}
                                onChangeText={setNewSalonName}
                                placeholder={t('nomSalon')}
                                style={{
                                    borderWidth: 1,
                                    borderColor: '#ccc',
                                    borderRadius: 8,
                                    padding: 8,
                                    marginBottom: 10,
                                }}
                            />
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'flex-end',
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() =>
                                        setShowModal(false)
                                    }
                                >
                                    <Text
                                        style={{marginRight: 15}}
                                    >
                                        {t('annuler')}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        if (
                                            newSalonName.trim()
                                        ) {
                                            handleAddSalon(
                                                newSalonName.trim()
                                            );
                                            setNewSalonName('');
                                            setShowModal(false);
                                        } else {
                                            Alert.alert(
                                                t('erreur'),
                                                t(
                                                    'nomInvalide'
                                                )
                                            );
                                        }
                                    }}
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    membersContainer: {
        width: 100,
        backgroundColor: '#222',
        padding: 10,
        height: 300,
        overflow: 'hidden',
        position: 'absolute',
        bottom: 110,
        right: 0,
    },
    sidebar: {
        width: 200,
        backgroundColor: '#222',
        padding: 10,
    },
    sidebarTitle: {
        color: 'white',
        fontSize: 18,
        marginBottom: 10,
    },
    salonItem: {
        color: '#fff',
        paddingVertical: 8,
    },
    addButton: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        alignItems: 'center',
    },
    chatContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#eee',
        gap: 10,
    },
    backButton: {
        fontSize: 20,
        marginRight: 10,
    },
    chatTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    chatMessages: {
        flex: 1,
        padding: 10,
    },
    typingIndicator: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        color: 'gray',
    },
    messageInputContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#fff',
    },
    messageInput: {
        flex: 1,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        color: '#000',
    },
    sendButton: {
        marginLeft: 10,
        paddingHorizontal: 15,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        justifyContent: 'center',
    },
});