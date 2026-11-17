import axios from "axios";

const apiBaseUrl = 'https://definitelynotharmony.dev/api';

/**
 * get toutes les salons de la bd
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function getSalons(token) {
    return axios.get(`${apiBaseUrl}/salons`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then((response) => response.data);
}

/**
 * get un salon par son id
 * @param salonId
 * @param token
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function getSalonsById(salonId, token) {
    return axios.get(`${apiBaseUrl}/salons/${salonId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then((response) => response.data);
}

/**
 * get les salons d'un user
 * @param userId
 * @param token
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function getSalonsByUser(userId, token) {
    return axios.get(`${apiBaseUrl}/salons_members/${userId}/salons`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then((response) => response.data);
}

/**
 * get les membres d'un salon
 * @param salonId
 * @param token
 * @returns {Promise<axios.AxiosResponse<any>>}
 */


export function getNonMembersBySalon(salonId, token) {
    return axios.get(`${apiBaseUrl}/salons_members/${salonId}/notmembers`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then((response) => response.data);
}

export function getUserBySalon(salonId, token) {
    return axios.get(`${apiBaseUrl}/salons_members/${salonId}/members`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

        .then((response) => response.data);
}

/**
 * create un salon
 * @param salon
 * @param token
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function createSalon(salon, token) {
    return axios.post(`${apiBaseUrl}/salons`, salon, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then((response) => response.data);
}

/**
 * ajoute un membre à un salon
 * @param salon_id
 * @param user_id
 * @param token
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function addMemberToSalon(salon_id, user_id, token) {
    return axios.post(`${apiBaseUrl}/salons_members/salons/members`
        , {user_id, salon_id}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then((response) => response.data);
}

/**
 * get la liste des users de la bd
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function getUsers(token) {
    return axios.get(`${apiBaseUrl}/user`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then((response) => response.data);
}

/**
 * get un user par son id
 * @param userId
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function getUserById(userId) {
    return axios.get(`${apiBaseUrl}/user/${userId}`)
        .then((response) => response.data);
}

/**
 * create un user
 * @param userId
 * @param user
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function updateUser(userId, user) {
    return axios.put(`${apiBaseUrl}/users/${userId}`, user)
        .then((response) => response.data);
}

/**
 * set la préférence dark mode d'un user
 * @param userId
 * @param darkMode
 * @param token
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function setDarkModePreference(userId, darkMode, token) {
    return axios.patch(`${apiBaseUrl}/user/${userId}`, {light_mode : darkMode}, {

        headers: {Authorization: `Bearer ${token}`}
    })
        .then((response) => response.data);
}

/**
 * set la préférence de langue d'un user
 * @param userId
 * @param thislanguage
 * @param token
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function setLanguagePreference(userId, thislanguage, token) {
    return axios.patch(`${apiBaseUrl}/user/${userId}`, {language : thislanguage}, {
        headers: {Authorization: `Bearer ${token}`}
    })
        .then((response) => response.data);
}

/**
 * set la préférence de notification d'un user
 * @param userId - id du user
 * @param notifPref - préférence de notification (true/false)
 * @param token - token d'authentification
 * @returns {Promise<void>}
 */
export function setNotificationPreference(userId, notifPref, token) {
    return axios.patch(`${apiBaseUrl}/user/${userId}`, {get_notifications : notifPref}, {
        headers: {Authorization: `Bearer ${token}`}
    })
        .then((response) => response.data);
}

/**
 * get tous les messages
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function getMessages(token) {
    return axios.get(`${apiBaseUrl}/messages`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then((response) => response.data);
}

/**
 * Creer un message.
 * @param message
 * @param token
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export async function createMessage(message, token) {
    console.log(message)
    return axios.post(`${apiBaseUrl}/messages`, message, {
        headers: {Authorization: `Bearer ${token}`}
    })
        .then((response) => response.data);
}

export async function createMessageDoublons(message, token) {
    console.log(message)
    return axios.post(`${apiBaseUrl}/messages/double`, message, {
        headers: {Authorization: `Bearer ${token}`}
    })
        .then((response) => response.data);
}

/**
 * retourne les dms selon le id du user
 * @param userId
 * @param token
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export async function getDmsById(userId, token) {
    return axios.get(`${apiBaseUrl}/dms/user/${userId}`, {
        headers: {Authorization: `Bearer ${token}`}
    })
        .then((response) => response.data);
}

/**
 * retourne les dms selon le id du user
 * @param userId
 * @param token
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export async function getOtherUserByDmId(userId, token) {
    return axios.get(`${apiBaseUrl}/dms/user/${userId}/other`, {
        headers: {Authorization: `Bearer ${token}`}
    })
        .then((response) => response.data);
}

/**
 * retourne les dms selon le id du user
 * @param dmId
 * @param token
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export async function getMessageByDmId(dmId, token, publicKey) {

    return axios.get(`${apiBaseUrl}/messages/${dmId}/${publicKey}`, {
        headers: {Authorization: `Bearer ${token}`}
    })
        .then((response) => response.data);
}

/**
 * retourne les messages selon le id du salon
 * @param salonId
 * @param token
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export async function getMessageBySalonId(salonId, token) {
    return axios.get(`${apiBaseUrl}/messages/${salonId}/salon/message`, {
        headers: {Authorization: `Bearer ${token}`}
    })
        .then((response) => response.data);
}

/**
 * Crée un DM entre userId1 et userId2 s'il n'existe pas.
 * Retour: { already: boolean, dm: { id, user_id1, user_id2 } }
 */
export async function createDm(ids, token) {
    return axios.post(`${apiBaseUrl}/dms`, ids, {
        headers: {Authorization: `Bearer ${token}`}
    })
        .then((response) => response.data);

}

 /** retourne les salons publics dont l'utilisateur n'est pas membre
 * @param userId - id de l'utilisateur
 * @param token - token d'authentification
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export async function getSalonsPublicsNotMember(userId, token) {
    return axios.get(`${apiBaseUrl}/salons_members/public/notMembers/${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then((response) => response.data);
}

/**
 * supprime un membre d'un salon
 * @param salon_id - id du salon
 * @param user_id - id de l'utilisateur
 * @param token - token d'authentification
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export async function removeMemberFromSalon(salon_id, user_id, token) {
    return axios.delete(`${apiBaseUrl}/salons_members/${salon_id}/members/${user_id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then((response) => response.data);
}

/**
 * retourne le DM entre deux utilisateurs s'il existe
 * @param user_id1 - id du user 1
 * @param user_id2 - id du user 2
 * @param token - token d'authentification
 * @returns {Promise<axios.AxiosResponse<any>>}
 */

export async function getDmEntreUsers (user_id1, user_id2, token) {
    return axios.get(`${apiBaseUrl}/dms/entre/${user_id1}/${user_id2}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then((response) => response.data);
}

export async function updatePresence(userId, payload, token) {
    return axios.post(`${apiBaseUrl}/user/${userId}/presence`, payload, {
        headers: {Authorization: `Bearer ${token}`}
    })
        .then((response) => response.data);
}

export function sendTyping(dmId, payload, token) {
    return axios.post(`${apiBaseUrl}/dms/${dmId}/typing`, payload, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
        .then((response) => response.data);
}

/**
 * Récupère la clé publique d'un autre utilisateur.
 * @param userId
 * @param token
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function getOtherUserPublicKey(userId, token) {
    return axios.get(`${apiBaseUrl}/keys/${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
        .then((response) => response.data);
}

/**
 * Crée un tag pour un message.
 * @param tag_name
 * @param message_id
 * @param token
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function createTags(tag_name,message_id, token) {
    return axios.post(`${apiBaseUrl}/tags`, {tag_name : tag_name, message_id :message_id}, {
        headers: {Authorization: `Bearer ${token}`}
    })
        .then((response) => response.data);
}

/**
 * Récupère les tags d'un message par son ID.
 * @param message_id
 * @param token
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function getTagsByMessageId(message_id, token) {
    return axios.get(`${apiBaseUrl}/tags/${message_id}`, {
        headers: {Authorization: `Bearer ${token}`}
    })
        .then((response) => response.data);
}

/**
 * Met à jour le nom d'un tag pour un message.
 * @param message_id
 * @param new_tag_name
 * @param token
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function updateTag(message_id, new_tag_name, token) {
    return axios.put(`${apiBaseUrl}/tags/${message_id}`, {tag_name: new_tag_name}, {
        headers: {Authorization: `Bearer ${token}`}
    })
        .then((response) => response.data);
}

/**
 * Supprime un tag d'un message par son ID.
 * @param message_id
 * @param token
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function destroyTag(message_id, token) {
    return axios.delete(`${apiBaseUrl}/tags/${message_id}`, {
        headers: {Authorization: `Bearer ${token}`}
    })
        .then((response) => response.data);
}

export async function setBackgroundDm(payload, token) {
    return axios.post(`${apiBaseUrl}/backgroundDm/`, payload, {
        headers: {Authorization: `Bearer ${token}`}
    })
        .then((response) => response.data);
}

/**
 * retourne les dms selon le id du user
 * @param dmId
 * @param token
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export async function getBackgroundDm(dmId, token) {
    return axios.get(`${apiBaseUrl}/backgroundDm/${dmId}`, {
        headers: {Authorization: `Bearer ${token}`}
    })
        .then((response) => response.data);
}

/**
 * Récupère la liste des amis acceptés de l'utilisateur
 * @param token - token d'authentification
 * @returns {Promise<Array>}
 */
export function getFriends(token) {
    return axios.get(`${apiBaseUrl}/friends/`, {
        headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.data);
}

/**
 * Récupère les demandes d'amis en attente
 * @param token
 * @returns {Promise<Array>}
 */
export function getPendingFriendRequests(token) {
    return axios.get(`${apiBaseUrl}/friends/requests`, {
        headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.data);
}

/**
 * Envoie une demande d'ami
 * @param receiverId
 * @param token
 * @returns {Promise<Object>}
 */
export function sendFriendRequest(receiverId, token) {
    return axios.post(`${apiBaseUrl}/friends/send`, { receiver_id: receiverId }, {
        headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.data);
}

/**
 * Accepte une demande d'ami
 * @param requestId
 * @param token
 * @returns {Promise<Object>}
 */
export function acceptFriendRequest(requestId, token) {
    return axios.put(`${apiBaseUrl}/friends/accept/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.data);
}

/**
 * Refuse une demande d'ami
 * @param requestId
 * @param token
 * @returns {Promise<Object>}
 */
export function declineFriendRequest(requestId, token) {
    return axios.put(`${apiBaseUrl}/friends/decline/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.data);
}

/**
 * Récupère les demandes d'amis en attente que l'utilisateur a ENVOYÉES
 * @param token
 * @returns {Promise<Array>}
 */
export function getSentPendingRequests(token) {
    return axios.get(`${apiBaseUrl}/friends/sent-requests`, {
        headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.data);
}

export async function getUserProfilePicture(userId, token) {
    return axios.get(`${apiBaseUrl}/user-profile-picture/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => response.data);
}

export async function setUserProfilePicture(userId, file, token) {
    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("photo", file);

    return axios.post(`${apiBaseUrl}/user-profile-picture`, formData, {
            headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => response.data);
}