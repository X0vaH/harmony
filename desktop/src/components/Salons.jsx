import {useState, useEffect, useRef, useMemo} from "react";
import {useTranslation} from "react-i18next";
import SalonList from "./Salons/SalonList.jsx";
import SalonHeader from "./Salons/SalonHeader.jsx";
import SalonMembers from "./Salons/SalonMembers.jsx";
import ChatInput from "./Shared/ChatInput.jsx";
import SalonsMessages from "./Salons/SalonsMessages.jsx";
import {
    addMemberToSalon, createDm, createMessage,
    createSalon, getMessageBySalonId,
    getNonMembersBySalon,
    getSalonsById,
    getSalonsByUser,
    getUserBySalon,
    getSalonsPublicsNotMember, removeMemberFromSalon, sendTyping
} from "../data/apiManager.js";
import {useContext} from "react";
import {UserContext} from "./contexts/UserContext.js";
import {useChannel} from "../data/useDmChannel.js";
import {useConnectionStatus} from "./contexts/connectionContext.jsx";

/**
 * Composant principal pour la gestion des salons de discussion.
 * @returns {JSX.Element}
 * @constructor
 */
export default function Salons() {
    const {t} = useTranslation();
    const [userSalons, setUserSalons] = useState([]);

    // liste des salons publics non joint par l'utilisateur
    const [salonsPublics,setSalonsPublics] = useState([]);

    const {user} = useContext(UserContext);
    const userId = user.user.id;
    const currentUser = user.user;

    const [users, setUsers] = useState([]);

    const [messagesBySalon, setMessagesBySalon] = useState({});
    const [salonActif, setSalonActif] = useState(null);

    const [activeSalonId, setActiveSalonId] = useState("");
    const [typingUser, setTypingUser] = useState(null);
    const [text, setText] = useState("");
    const [addingSalon, setAddingSalon] = useState(false);
    const [newSalonName, setNewSalonName] = useState("");
    const [addingMember, setAddingMember] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState("");

    // le status online/offline du user
    const isOnline = useConnectionStatus();
    // array que je vais utiliser pour stocker les messages qui envoyés en offline.
    const listeMessageOffline = useRef([]);

    const messagesEndRef = useRef(null);

    // Logique ws

    // Nom du channel ex. dm.13
    const salonChannelName = useMemo(() => {
        if (!activeSalonId) return null;
        return `salon.${String(activeSalonId)}`;
    }, [activeSalonId]);

    const seenSalonMsgIdsRef = useRef(new Set());

    useChannel(salonChannelName, (event) => {
        if (!activeSalonId) return;

        const payload = event;

        switch (payload.type) {
            case "typing": {
                const fromId = payload.user_id ?? payload.userId;
                const isTypingFlag = !!payload.isTyping;

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
                            String(u.id) === String(uid)
                                ? { ...u, estOnline: present }
                                : u
                        )
                    );
                }
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
                    content: contenu ?? "",
                    date: new Date(date).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"}),
                    salonId: salon_id,
                };

                setMessagesBySalon(prev => {
                    const list = prev[salon_id] ?? [];

                    const next = { ...prev, [salon_id]: [...list, newMsg] };

                    next[salon_id].sort((a, b) => new Date(a.date) - new Date(b.date));
                    return next;
                });
                return;
            }

            default:
                console.warn('[WS] event sans type connu', payload);
                return;
        }

    }, [".message.sent", ".presence.updated", ".typing.updated"]);


    // Traite les messages offline lors de la reconnexion
    useEffect(() => {
        if (isOnline) {
            envoieMessageOffline();
        }
    }, [isOnline]);


    // get tout les salons de l'utilisateur connecté
    useEffect(() => {
        async function fetchSalons() {
            const result = await getSalonsByUser(userId, user.token);
            setUserSalons(result?.data || []);
        }

        fetchSalons();
    }, [userId, user.token]); // fixed: add deps

    // get salons publics non membres
    useEffect(() => {
        async function fetchPublicSalons() {
            const result = await getSalonsPublicsNotMember(userId, user.token);
            console.log("salons pub non membres", result.data);
            setSalonsPublics(result?.data || []);
        }

        fetchPublicSalons();
    }, [userId, user.token]); // fixed deps


    useEffect(() => {
        // Si le salon actif n'est plus dans la liste des salons de l'utilisateur, en choisir un autre
        if (!userSalons.find(s => s.id === activeSalonId)) {
            setActiveSalonId(userSalons[0]?.id || "");
        }
    }, [userSalons, userId]); // fixed deps

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messagesBySalon, activeSalonId]);

    useEffect(() => {
        const interval = setInterval(() => {
            setUsers(prev =>
                prev.map(u =>
                    u.id !== userId ? {...u, online: Math.random() > 0.3} : {...u, online: true}
                )
            );
        }, 5000);
        return () => clearInterval(interval);
    }, [userId]);

    const getColorFromString = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return `hsl(${hash % 360}, 60%, 70%)`;
    };

    // Création d'un salon (l'utilisateur connecté est automatiquement membre du salon)
    const confirmAddSalon = async () => {
        if (!newSalonName.trim()) return;
        const newSalon = {name: newSalonName.trim()};
        const userIdLocal = user.user.id;

        const createdSalon = await createSalon(newSalon, user?.token);
        const newSalownId = createdSalon.data.id;
        console.log("igkms created", createdSalon.data.id);
        const addMember = await addMemberToSalon(newSalownId, userIdLocal, user?.token);
        if (addMember.error) {
            console.log("igkms error adding member to salon:", addMember.error);
            return;
        }

        // refaire une fetch
        const result = await getSalonsByUser(userId, user.token);
        setUserSalons(result?.data || []);
        setActiveSalonId(newSalownId);
        setAddingSalon(false);
        setNewSalonName("");
    };

    const confirmAddMember = async () => {
        if (!selectedUserId || !activeSalonId) return;
        const addedMember = await addMemberToSalon(activeSalonId, selectedUserId, user.token);
        if (addedMember.error) {
            console.log("igkms: error adding member to salon:", addedMember.error);
            return;
        }

        const membersResult = await getUserBySalon(activeSalonId, user.token);
        setSalonMembers(membersResult?.data || []);

        const availableResult = await getNonMembersBySalon(activeSalonId, user.token);
        setAvailableUsers(availableResult?.data || []);

        setAddingMember(false);
        setSelectedUserId("");
    };

    const [salonMembers, setSalonMembers] = useState([]);


    useEffect(() => {
        if (!activeSalonId) return;

        let mounted = true;
        async function fetchSalon() {
            if (!activeSalonId) {
                if (mounted) setSalonActif(null);
                return;
            }
            try {
                const res = await getSalonsById(activeSalonId, user.token);
                const salon = res?.data ?? res;
                if (mounted) setSalonActif(salon);
            } catch (err) {
                console.error("fetch salon failed", err);
                if (mounted) setSalonActif(null);
            }
        }
        fetchSalon();
        return () => { mounted = false; };
    }, [activeSalonId, user.token]);



    useEffect(() => {
        async function fetchSalonMembers() {
            if (activeSalonId) {
                const result = await getUserBySalon(activeSalonId, user.token);
                setSalonMembers(result?.data || []);
            }
        }
        fetchSalonMembers();
    }, [activeSalonId, user.token]);

    const [availableUsers, setAvailableUsers] = useState([]);

    useEffect(() => {
        async function fetchAvailableUsers() {
            if (!activeSalonId) {
                setAvailableUsers([]);
                return;
            }
            const result = await getNonMembersBySalon(activeSalonId, user.token);
            setAvailableUsers(result?.data || []);

            // GET Messages salon
            await (async () => {
                try {
                    const res = await getMessageBySalonId(activeSalonId, user.token);
                    const arr = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);



                    const messages = arr.map(m => (
                        {
                        id: m.id,
                        userId: m.user_id,
                        content: m.contenu,
                        date: new Date(m.date).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"}),
                        salonId: activeSalonId,
                    }));


                    messages.sort((a, b) => new Date(a.date) - new Date(b.date));

                    setMessagesBySalon(prev => ({
                        ...prev,
                        [activeSalonId]: messages,
                    }));
                } catch (e) {
                    console.error("[SALON] getMessageBySalonId failed:", e);
                    setMessagesBySalon(prev => ({...prev, [activeSalonId]: []}));
                }
            })();
        }
        fetchAvailableUsers();
    }, [activeSalonId, user.token]);


    const joinSalon = async (salonId) => {
        if (!salonId) return;
        console.log("joinSalon called for", salonId);
        const added = await addMemberToSalon(salonId, userId, user.token);
        if (added?.error) {
            console.error("error adding member to salon:", added.error);
            return;
        }

        // on re-fetch les listes
        const [userRes, pubs] = await Promise.all([
            getSalonsByUser(userId, user.token),
            getSalonsPublicsNotMember(userId, user.token)
        ]);

        setUserSalons(userRes?.data || []);
        setSalonsPublics(pubs?.data || []);

        setActiveSalonId(salonId);
    };

    // function pour leave un salon
    const leaveSalon = async (salonId) => {
        if (!salonId) return;
        try {
            const res = await removeMemberFromSalon(salonId, userId, user.token);
            if (res?.error) {
                console.error("error leaving salon:", res.error);
                return;
            }

            // re-fetch authoritative lists
            const [userRes, pubs] = await Promise.all([
                getSalonsByUser(userId, user.token),
                getSalonsPublicsNotMember(userId, user.token)
            ]);

            setUserSalons(userRes?.data || []);
            setSalonsPublics(pubs?.data || []);

            // Choisi un autre salon si l'utilisateur a quitté le salon actif
            if (salonId === activeSalonId) {
                setActiveSalonId(userRes?.data?.[0]?.id || "");
            }
        } catch (err) {
            console.error("leaveSalon failed:", err);
        }
    };

    const handleCreateDm = async (otherUser) => {
        const ok = window.confirm(t("CreerDmWindow") + otherUser.name + " ?");
        if (!ok) return;

        const res = await createDm({ user_id1: userId, user_id2: otherUser.id }, user.token);
        console.log(res)
    };

    const sendSalonMessage = async (text) => {
        if (!text.trim() || !activeSalonId) return;

        if (isOnline) {
            await createMessage({
                dm_id: null,
                salon_id: activeSalonId,
                user_id: userId,
                contenu: text,
            }, user.token);
            console.info("[Client] message créé");
            setText("");
        } else {
            const offlineMessage = {
                salon_id: activeSalonId,
                content: text,
            };

            listeMessageOffline.current.push(offlineMessage);
            setText("");
        }
    };

    //fait ce que le nom de la fonction indique : envoie les messages stockés en offline dès que la connexion est rétablie
    const envoieMessageOffline = async () => {
        if (listeMessageOffline.current.length === 0) return;

        while (listeMessageOffline.current.length > 0) {
            const message = listeMessageOffline.current.shift();

            try {
                // Envoi du message au serveur
                await createMessage({
                    dm_id: null,
                    salon_id: message.salon_id,
                    user_id: userId,
                    contenu: message.content,
                }, user.token);

                console.info('[Offline] Message sent:', message.content);
            } catch (error) {
                //log pcq les alert fon toute planter
                console.log('[Offline] Error sending message:', error);
            }
        }
    };

    const typingTimeoutRef = useRef(null);
    const [isTyping, setIsTyping] = useState(false);

    function notifyTyping(isTypingFlag) {
        if (!salonChannelName || !activeSalonId) return;
        const payload = {
            channel: salonChannelName,
            user_id: userId,
            isTyping: isTypingFlag,
        }
        sendTyping(activeSalonId, payload, user.token)
            .catch(err => console.warn('[typing] send failed', err));
    }

    const handleSalonTextChange = (newText) => {
        setText(newText);

        const nowTyping = newText.trim().length > 0;

        if (nowTyping && !isTyping) {
            setIsTyping(true);
            notifyTyping(true);
        }

        if (!nowTyping && isTyping) {
            setIsTyping(false);
            notifyTyping(false);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        if (nowTyping) {
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                notifyTyping(false);
            }, 3000);
        }
    };

    const handleSendSalonMessage = async (txt) => {
        if (!txt.trim()) return;
        await sendSalonMessage(txt);
        setText("");
        setIsTyping(false);
        notifyTyping(false);
    };

    return (
        <div style={{display: "flex", height: "100vh"}}>
            <aside style={{width: "250px", borderRight: "1px solid #ccc", padding: "1rem"}}>
                <SalonList
                    userSalons={userSalons}
                    activeSalonId={activeSalonId}
                    setActiveSalonId={setActiveSalonId}
                    addingSalon={addingSalon}
                    setAddingSalon={setAddingSalon}
                    newSalonName={newSalonName}
                    setNewSalonName={setNewSalonName}
                    confirmAddSalon={confirmAddSalon}
                    salonsPublics={salonsPublics}
                    joinSalon={joinSalon}
                    t={t}
                />
            </aside>
            <main>
                <SalonHeader salonActif={salonActif} currentUser={currentUser} users={users} userId={userId} t={t} leaveSalon={leaveSalon}/>
                <SalonMembers salonMembers={salonMembers} t={t} currentUserId={userId}
                              onStartDm={handleCreateDm}/>
                <SalonsMessages messages={messagesBySalon[activeSalonId]} salonMembers={salonMembers}
                                getColorFromString={getColorFromString}/>
                {typingUser ? (
                    <div style={{fontStyle: "italic", color: "#888", margin: "0.5rem 0"}}>
                        {(salonMembers?.find((u) => String(u.id) === String(typingUser))?.name)} {t("enTraitDeTaper")}
                    </div>
                ): null}

                <ChatInput
                    text={text}
                    setText={handleSalonTextChange}
                    sendMessage={handleSendSalonMessage}
                    t={t}
                />

                {addingMember ? (
                    <div style={{marginLeft: "1rem", display: "flex", gap: "0.5rem"}}>
                        <select
                            value={selectedUserId}
                            onChange={e => setSelectedUserId(e.target.value)}
                            style={{padding: "0.3rem"}}
                        >
                            <option value="">-- Choisir un membre --</option>
                            {availableUsers.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.name}
                                </option>
                            ))}
                        </select>
                        <button onClick={confirmAddMember}>{t('ajouter')}</button>
                        <button onClick={() => setAddingMember(false)}>{t('annuler')}</button>
                    </div>
                ) : (
                    <button
                        onClick={() => setAddingMember(true)}
                        style={{marginLeft: "0.5rem", padding: "0.3rem 0.6rem", cursor: "pointer"}}
                    >
                        {t('rajoter')}
                    </button>
                )}
            </main>
        </div>
    );
}
