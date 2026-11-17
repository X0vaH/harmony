import mockData from "./mocker.js"; // adapte le chemin si besoin

const HARMONY_KEY = "harmony";
const HARMONY_USERS_KEY = "harmony_users";
/**
 * Récupère l'historique commun (salons, messages, DMs).
 * Si vide, le peuple avec TOUT le mockData (salons, messages, DMs).
 * @returns {any|*[]}
 */
// Historique commun à tous (clé "harmony")
export const getHistorique = () => {
    let historique = localStorage.getItem(HARMONY_KEY);

    // Si vide, on peuple avec TOUT le mockData (salons, messages, DMs)
    if (!historique || historique === "[]") {
        let mockSalons = (mockData.salons || []).map(s => ({
            type: "salon",
            id: s.id,
            name: s.name,
            members: s.members,
        }));

        let mockMessages = [];
        Object.entries(mockData.messagesSalons || {}).forEach(([salonId, messages]) => {
            messages.forEach(m => {
                mockMessages.push({...m, salonId});
            });
        });

        // Ajout des DM du mockData
        let mockDMs = [];
        (mockData.dm || []).forEach(dm => {
            (dm.messages || []).forEach(msg => {
                mockDMs.push({
                    ...msg,
                    userId1: dm.userId1,
                    userId2: dm.userId2,
                    // Optionnel: type: "dm"
                });
            });
        });

        historique = [...mockSalons, ...mockMessages, ...mockDMs];
        localStorage.setItem(HARMONY_KEY, JSON.stringify(historique));
        return historique;
    }
    return JSON.parse(historique);
};

/**
 * Récupère la liste des users.
 * @returns {[{id: string, name: string, password: string},{id: string, name: string, password: string},{id: string, name: string, password: string},{id: string, name: string, password: string}]|*[]|any}
 */
export const getUsers = () => {
    let users = localStorage.getItem(HARMONY_USERS_KEY);
    if (!users || users === "[]") {
        users = (mockData.users || []);
        localStorage.setItem(HARMONY_USERS_KEY, JSON.stringify(users));
        return users;
    }
    return JSON.parse(users);
};

/**
 * Ajoute un user à la liste des users.
 * @param user
 */
export const addUser = (user) => {
    const users = getUsers();
    users.push(user);
    localStorage.setItem(HARMONY_USERS_KEY, JSON.stringify(users));
};

/**
 * Ajoute une entrée à l'historique commun.
 * @param entry
 */
export const addToHistorique = (entry) => {
    const historique = getHistorique();
    historique.push(entry);
    localStorage.setItem(HARMONY_KEY, JSON.stringify(historique));
};

/**
 * Clear l'historique commun
 */
export const clearHistorique = () => {
    localStorage.removeItem(HARMONY_KEY);
};

/**
 * Clear la liste des users
 */
export const clearUsers = () => {
    localStorage.removeItem(HARMONY_USERS_KEY);
};

/** Met à jour un objet mockData avec l'historique courant.
 * @param mockData
 */
export const updateMockDataAvecHistorique = (mockData) => {
    const historique = getHistorique();
    mockData.historique = historique;
};

/**
 * Récupère les infos de l'utilisateur courant (stocké en localStorage).
 * @returns {any}
 */
export const getUserInfo = () => {
    return JSON.parse(localStorage.getItem("current_user") || "null");
};