import {useState, useEffect, useRef, useMemo, useContext} from "react";
import {useTranslation} from "react-i18next";
import {useChannel} from "../data/useDmChannel";
import {
    createMessage,
    getMessageByDmId,
    getDmsById,
    getOtherUserByDmId,
    sendTyping, getOtherUserPublicKey, createMessageDoublons,
    getBackgroundDm,
    setBackgroundDm,
    getUserProfilePicture,
} from "../data/apiManager";
import {UserContext} from "./contexts/UserContext.js";
import {useConnectionStatus} from "./contexts/connectionContext.jsx";
import encryptMessage from "../data/useEncryptMessage.js";
import decryptMessage from "../data/useDecryptMessage.js";
import MessageWithTag from "./Shared/MessageWithTag.jsx";
import {TAGS} from "./utils/tags.js";

/**
 * Composant Messenger pour la gestion des messages directs entre utilisateurs.
 * @returns {JSX.Element}
 * @constructor
 */
export default function Messenger() {
    const {t} = useTranslation();

    const {user} = useContext(UserContext);
    const currentUserId = user.user.id;

    const [users, setUsers] = useState([]);
    const [dmConversations, setDmConversations] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [text, setText] = useState("");
    const [typingUser, setTypingUser] = useState(null);
    const messagesEndRef = useRef(null);
    // le status online/offline du user
    const isOnline = useConnectionStatus();
    // array que je vais utiliser pour stocker les messages qui envoyés en offline.
    const listeMessageOffline = useRef([]);

    const personnalPublicKey = window.localStorage.getItem("publicKey")
    const seenIdsRef = useRef(new Set());

    const [backgroundColor, setBackgroundColor] = useState("#ffffff");
    const defaultBackground = "#ffffff";

    const [profilePictures, setProfilePictures] = useState({});

    const toArray = (x) => (Array.isArray(x) ? x : (Array.isArray(x?.data) ? x.data : []));


    // Traite les messages offline lors de la reconnexion
    useEffect(() => {
        if (isOnline) {
            envoieMessageOffline();
        }
    }, [isOnline]);


    // get tout les dms et messages du user
    useEffect(() => {
        if (!currentUserId) return;

        (async () => {
            try {
                const rawDms = await getDmsById(currentUserId, user.token);
                const dms = toArray(rawDms);
                const dataUsers = await getOtherUserByDmId(currentUserId, user.token);
                setUsers(toArray(dataUsers))
                console.log("public key id : ", window.localStorage.getItem("publicKeyId"))
                const convs = await Promise.all(
                    dms.map(async (dm) => {
                        const rawMsgs = await getMessageByDmId(dm.id, user.token, window.localStorage.getItem("publicKeyId")); // GET /messages/{dmId}/message
                        const msgs = toArray(rawMsgs);
                        return {
                            id: dm.id,
                            userId1: dm.user_id1,
                            userId2: dm.user_id2,
                            dm_id: dm.id,
                            messages: msgs.map((m) => {
                                const decryptedContent = decryptMessage(m.contenu); // Decrypt the message content
                                return {
                                    id: m.id,
                                    userId: m.user_id,
                                    content: decryptedContent || "[Unable to decrypt message]", // Fallback if decryption fails
                                    date: new Date(m.date).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"}),
                                    dm_id: dm.id,
                                };
                            }),
                        };
                    })
                );

                convs.forEach(c => c.messages.sort((a, b) => new Date(a.date) - new Date(b.date)));
                setDmConversations(convs);

                if (!selectedUserId && convs.length) {
                    const first = convs[0];
                    setSelectedUserId(first.userId1 === currentUserId ? first.userId2 : first.userId1);
                }
            } catch (e) {
                console.error("[BOOT] load error:", e);
                setDmConversations([]); // évite l'état bancal
            }
        })();
    }, [currentUserId, selectedUserId, user.token]);

    // Scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [dmConversations, selectedUserId]);

    const getUserById = (id) => users.find(u => u.id === id);

    const currentDM = useMemo(() => {
        return dmConversations.find(
            dm =>
                (dm.userId1 === currentUserId && dm.userId2 === selectedUserId) ||
                (dm.userId1 === selectedUserId && dm.userId2 === currentUserId)
        );
    }, [dmConversations, currentUserId, selectedUserId]);

    // Avoir le bon dmId
    const getDmId = (userId, otherUserId) => {
        const dm = dmConversations.find(
            d =>
                (d.userId1 === userId && d.userId2 === otherUserId) ||
                (d.userId1 === otherUserId && d.userId2 === userId)
        );
        return dm?.dm_id ?? null;
    };

    const channelId = getDmId(currentUserId, selectedUserId);

    // Nom du channel ex. dm.1
    const channelName = channelId ? "dm." + channelId : null;

    useEffect(() => {
        if (!channelId) return;

        let cancelled = false;

        const fetchBackground = async () => {
            try {
                const bg = await getBackgroundDm(channelId, user.token);
                console.log(bg);
                const color = bg.data?.couleur ?? defaultBackground;
                if (!cancelled) {
                    setBackgroundColor(color);
                }
            } catch (err) {
                console.error("[DM] Erreur chargement background:", err);
                if (!cancelled) {
                    setBackgroundColor(defaultBackground);
                }
            }
        };

        fetchBackground();

        return () => {
            cancelled = true;
        };
    }, [channelId, user.token]);

    // abonnement au channel
    useChannel(channelName, (event) => {
        if (!currentUserId) return;

        const payload = event;

        switch (payload.type) {
            case "typing": {
                const fromId = payload.user_id ?? payload.userId;
                const isTypingFlag = !!payload.isTyping;

                if (fromId && fromId !== currentUserId) {
                    setTypingUser(isTypingFlag ? fromId : null);
                }
                return;
            }
            case 'presence': {
                const uid = payload.user_id ?? payload.userId;
                const present = !!payload.estPresent;

                setUsers(prev =>
                    prev.map(u =>
                        String(u.id) === String(uid) ? {...u, estOnline: present} : u)
                );
                return;
            }
            case 'message': {
                if (!selectedUserId) return;

                if (payload.public_key !== (window.localStorage.getItem("publicKey"))) {
                    console.warn("Clé publique du message ne correspond pas à la clé locale. Message ignoré.");
                    return;
                }

                const serverId = payload.id ?? null;
                if (serverId) seenIdsRef.current.add(serverId);

                console.log("public key recus par le payload : ", payload.public_key)
                const decryptedContent = decryptMessage(payload.contenu);
                console.log("message décrypté reçu:", decryptedContent);
                const newMsg = {
                    id: serverId ?? Date.now(),
                    userId: payload.user_id ?? payload.userId,
                    content: decryptedContent,
                    date: new Date(payload.date).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"}),
                    userId1: currentUserId,
                    userId2: selectedUserId,
                    dm_id: payload.dm_id,
                };

                setDmConversations(prev => {
                    const idx = prev.findIndex(dm => dm.dm_id === payload.dm_id);
                    if (idx !== -1) {
                        const copy = [...prev];
                        copy[idx] = {
                            ...copy[idx],
                            dm_id: copy[idx].dm_id ?? newMsg.dm_id,
                            messages: [...copy[idx].messages, newMsg],
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
                console.warn('[WS] event sans type connu', payload);
                return;
        }
    }, [".message.sent", ".presence.updated", ".typing.updated"]);

    // envoi message du client et réponse de l'api
    const sendMessage = async (msgText) => {
        if (!msgText.trim() || !selectedUserId) return;
        console.log("création de message selectedUserId:", selectedUserId);

        const otherUserPublicKey = await getOtherUserPublicKey(selectedUserId, user.token)

        console.log("clé publique du receveur", otherUserPublicKey.data.public_key);

        const messageEncrypt = encryptMessage(msgText, otherUserPublicKey.data.public_key);

        console.log("message encrypté:", messageEncrypt);

        if (isOnline) {
            if (!msgText.trim() || !selectedUserId) return;

            const newMsg = {
                id: Date.now(), // Temporary ID
                userId: currentUserId,
                content: msgText, // Unencrypted content
                date: new Date().toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"}),
                userId1: currentUserId,
                userId2: selectedUserId,
                dm_id: channelId,
            };

            // Add the message to the local state
            setDmConversations((prev) => {
                const idx = prev.findIndex((dm) => dm.dm_id === channelId);
                if (idx !== -1) {
                    const copy = [...prev];
                    copy[idx] = {
                        ...copy[idx],
                        messages: [...copy[idx].messages, newMsg],
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

            // Send the message to the server
            try {
                const otherUserPublicKey = await getOtherUserPublicKey(selectedUserId, user.token);
                const messageEncrypt = encryptMessage(msgText, otherUserPublicKey.data.public_key);

                await createMessage({
                    dm_id: channelId,
                    salon_id: null,
                    user_id: currentUserId,
                    contenu: messageEncrypt,
                    public_key: otherUserPublicKey.data.public_key,
                }, user.token);

                console.info("[Client] Message sent to server");

                const userConnectedKey = await getOtherUserPublicKey(currentUserId, user.token)

                console.log("clé publique perso:", userConnectedKey);
                const messageRecrypt = encryptMessage(msgText, userConnectedKey.data.public_key);
                // message doublon pour que le user qui envoie ai aussi son message dans sa bdd
                await createMessageDoublons({
                    dm_id: channelId,
                    salon_id: null,
                    user_id: currentUserId,
                    contenu: messageRecrypt,
                    public_key: userConnectedKey.data.public_key,
                }, user.token)

                setText("");

            } catch (error) {
                console.error("[Client] Error sending message:", error);
            }

            setText(""); // Clear the input field
            if (Notification.permission === "granted" && document.hidden) {
                // envoyer notification si l'utilisateur a activé les notifications
                if (user.user.get_notifications === true) {
                    new Notification(selectedUserId.name, {
                        body: "autoMessage",
                        icon: "harmony.png",
                    });
                }
            }
        } else {

            const offlineMessage = {
                dm_id: channelId,
                content: msgText,
            };

            listeMessageOffline.current.push(offlineMessage);

            setText('');

        }
    };

    // Liste contacts et dernier message
    const userDMs = dmConversations
        .map(dm => {
            const otherId = dm.userId1 === currentUserId ? dm.userId2 : dm.userId1;
            const otherUser = users.find(u => u.id === otherId);
            return {...dm, otherUser, lastMessage: dm.messages.at(-1)};
        })
        .filter(dm => dm.otherUser);

    const currentDMView = currentDM || {messages: []};

    // envoi des messages stockés en offline lors de la reconnexion duh
    const envoieMessageOffline = async () => {
        if (listeMessageOffline.current.length === 0) return;
        while (listeMessageOffline.current.length > 0) {
            const message = listeMessageOffline.current.shift();

            try {
                // On envoie le message au serveur
                await createMessage({
                    dm_id: message.dm_id,
                    salon_id: null,
                    user_id: currentUserId,
                    contenu: message.content,
                    channel_id: channelId,
                    publicKey: "abcdefghijklmnopqrst"
                }, user.token);

                //log pour être sur que ca marche
                console.info('[Offline] Message sent:', message.content);

                // ne devrais pas être utiliser car on fait déja ca dans le CreateMessage....
                // echo.channel(`dm.${message.dm_id}`).whisper('message.sent', message);

            } catch (error) {
                //log pcq alert fait planterre l'app
                console.error('[Offline] Error sending message:', error);

            }
        }
    };

    const typingTimeoutRef = useRef(null);
    const [isTyping, setIsTyping] = useState(false);

    function notifyTyping(isTypingFlag) {
        if (!channelId || !channelName) return;
        const payload = {
            channel: channelName,
            user_id: currentUserId,
            isTyping: isTypingFlag,
        }
        sendTyping(channelId, payload, user.token)
            .catch(err => console.warn('[typing] send failed', err));
    }

    const [filterTag, setFilterTag] = useState("");

    const handleSaveBackground = async () => {
        if (!channelId) return;
        try {
            console.log(backgroundColor)
            await setBackgroundDm({
                dm_id: channelId,
                couleur: backgroundColor
            }, user.token);
            console.info("[DM] Background sauvegardé");
        } catch (err) {
            console.error("[DM] Erreur sauvegarde background:", err);
        }
    };

    useEffect(() => {
        if (!users.length || !user.token) return;

        let cancelled = false;

        const loadPictures = async () => {
            const map = {};
            for (const u of users) {
                try {
                    const res = await getUserProfilePicture(u.id, user.token);
                    map[u.id] = res?.data?.photo_url ?? null;
                } catch (e) {
                    console.warn("[DM] erreur chargement photo user", u.id, e);
                }
            }
            if (!cancelled) setProfilePictures(map);
        };

        loadPictures();

        return () => {
            cancelled = true;
        };
    }, [users, user.token]);

    return (
        <div style={{display: "flex", height: "100vh"}}>
            <aside style={{width: "250px", borderRight: "1px solid #ccc", padding: "1rem"}}>
                <h2>{t("contacts")}</h2>
                {userDMs.map((dm) => (
                    <div
                        key={dm.id}
                        style={{
                            padding: "0.5rem",
                            cursor: "pointer",
                            border:
                                selectedUserId === dm.otherUser.id
                                    ? "1px solid #ccc"
                                    : "transparent",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                        }}
                        onClick={() => setSelectedUserId(dm.otherUser.id)}
                    >
                        <div
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                overflow: "hidden",
                                backgroundColor: "#e5e7eb",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.9rem",
                                fontWeight: 600,
                            }}
                        >
                            {profilePictures[dm.otherUser.id] ? (
                                <img
                                    src={profilePictures[dm.otherUser.id]}
                                    alt={dm.otherUser.name}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                <span>{dm.otherUser.name?.[0]?.toUpperCase?.() ?? "?"}</span>
                            )}
                        </div>
                        <div>
                            <div>{dm.otherUser.name}</div>
                            <div style={{fontSize: "0.8rem", color: "gray"}}>
                                {dm.lastMessage ? dm.lastMessage.content : "Aucun message"}
                            </div>
                        </div>
                    </div>
                ))}
            </aside>

            <main style={{flex: 1, display: "flex", flexDirection: "column"}}>
                <header
                    style={{
                        padding: "1rem",
                        borderBottom: "1px solid #ccc",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "1rem",
                    }}
                >
                    <div>
                        {getUserById(selectedUserId)?.name}{" "}
                        {getUserById(selectedUserId)?.estOnline ? "🟢" : "⚪"}
                    </div>

                    <div style={{display: "flex", alignItems: "center", gap: "1rem"}}>
                        <div style={{display: "flex", alignItems: "center", gap: "0.4rem"}}>
                            <input
                                id="dm-bg-color"
                                type="color"
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                disabled={!channelId}
                                style={{
                                    width: 28,
                                    height: 28,
                                    border: "none",
                                    padding: 0,
                                    cursor:
                                        !channelId
                                            ? "default"
                                            : "pointer",
                                    borderRadius: 6,
                                    background: "transparent",
                                }}
                            />

                            <button
                                type="button"
                                onClick={handleSaveBackground}
                                disabled={!channelId}
                                style={{
                                    padding: "0.25rem 0.6rem",
                                    borderRadius: 6,
                                    border: "1px solid #ccc",
                                    fontSize: "0.8rem",
                                    cursor:
                                        !channelId
                                            ? "default"
                                            : "pointer",
                                }}
                            >
                                {t("save")}
                            </button>
                        </div>

                        <div>
                            <select
                                value={filterTag}
                                onChange={(e) => setFilterTag(e.target.value)}
                                style={{
                                    padding: "0.3rem",
                                    borderRadius: "4px",
                                }}
                            >
                                <option value="">-- {t("select_a_tag")} --</option>
                                {TAGS.map((tag) => (
                                    <option key={tag} value={tag}>
                                        {tag}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </header>

                <div
                    style={{
                        flex: 1,
                        padding: "1rem",
                        overflowY: "auto",
                        backgroundColor: backgroundColor,
                    }}
                >
                    {currentDMView.messages.map((m) => (
                        <MessageWithTag
                            key={m.id}
                            message={m}
                            token={user.token}
                            isCurrentUser={m.userId === user.user.id}
                            filterTag={filterTag}
                        />
                    ))}
                    <div ref={messagesEndRef} />

                    {typingUser &&
                        String(typingUser) === String(selectedUserId) && (
                            <div style={{padding: "0.5rem 1rem", color: "gray"}}>
                                {getUserById(typingUser)?.name} {t("enTraitDeTaper")}
                            </div>
                        )}
                </div>

                <div
                    style={{
                        display: "flex",
                        borderTop: "1px solid #ccc",
                        padding: "0.5rem",
                    }}
                >
                    <input
                        style={{flex: 1, padding: "0.5rem"}}
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value);

                            if (!isTyping) {
                                setIsTyping(true);
                                notifyTyping(true);
                            }

                            clearTimeout(typingTimeoutRef.current);
                            typingTimeoutRef.current = setTimeout(() => {
                                setIsTyping(false);
                                notifyTyping(false);
                            }, 2000);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                sendMessage(text);
                                setIsTyping(false);
                                notifyTyping(false);
                            }
                        }}
                        placeholder={t("écrireMessage")}
                    />
                    <button
                        onClick={() => {
                            sendMessage(text);
                            setIsTyping(false);
                            notifyTyping(false);
                        }}
                        style={{marginLeft: "0.5rem"}}
                    >
                        {t("send")}
                    </button>
                </div>
            </main>
        </div>
    );
}