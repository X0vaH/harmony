import * as SecureStore from 'expo-secure-store';
import {router} from 'expo-router';

//REMPLACER IP PAR IP LOCAL (LOCALHOST NE FONCTIONNE PAS)
const API_URL = 'https://definitelynotharmony.dev/api';

/**
 * Effectue une requête API avec gestion de l'authentification et des erreurs.
 * @param endpoint - point de terminaison de l'API
 * @param options - options de la requête (méthode, corps, en-têtes, etc.)
 * @returns {Promise<{}>}
 */
async function request(endpoint, options = {}) {
    const token = await SecureStore.getItemAsync('authToken');

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
        ...options.headers,
    };

    const finalOptions = {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
    };

    const response = await fetch(`${API_URL}${endpoint}`, finalOptions);

    let data;
    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        if (response.status === 401) {
            await SecureStore.deleteItemAsync('authToken');
            router.replace('/auth');
        }
        const error = new Error(data.message || 'Erreur API');
        error.status = response.status;
        throw error;
    }

    return data;
}

/**
 * Connecte l'utilisateur et stocke le token d'authentification.
 * @param name - nom d'utilisateur
 * @param password - mot de passe
 * @returns {Promise<{}>}
 */
export async function login(name, password) {

    console.log(`${API_URL}/user/token`);

    const response = await request('/user/token', {
        method: 'POST',
        body: {name, password},
    });


    await SecureStore.setItemAsync('authToken', response.token);
    return response;
}

export async function createAccount(name, password) {
    console.log(`${API_URL}/user`);
    const response = await request('/user', {
        method: 'POST',
        body: {name, password},
    });

    return response;
}

/**
 * Déconnecte l'utilisateur en supprimant le token d'authentification.
 * @returns {Promise<void>}
 */
export async function logout() {
    try {
        await request('/logout', {method: 'POST'});
    } catch (err) {
        console.warn('Erreur de déconnexion:', err.message);
    }
    await SecureStore.deleteItemAsync('authToken');
    router.replace('/auth');
}

/**
 * retourne tous les salons
 * @returns {Promise<{}>}
 */
export async function getSalons() {
    return request('/salons/', {method: 'GET'});
}

/**
 * Creer un salon.
 * @param name - nom du salon
 * @returns {Promise<{}>}
 */
export async function createSalon(name) {
    return request('/salons', {
        method: 'POST',
        body: {name},
    });
}

/**
 * retourne les messages d'un salon
 * @param salonId - id du salon
 * @returns {Promise<{}>}
 */
export async function getSalonMessages(salonId) {
    return request(`/messages?salon_id=${salonId}`, {method: 'GET'});
}

/**
 * Envoie un message dans un salon.
 * @param salonId - id du salon
 * @param content - contenu du message
 * @returns {Promise<{}>}
 */
export async function sendSalonMessage(salonId, content) {
    return request('/messages', {
        method: 'POST',
        body: {salon_id: salonId, content},
    });
}

/**
 * retourne les membres d'un salon
 * @param salonId - id du salon
 * @returns {Promise<{}>}
 */
export async function getSalonMembers(salonId) {
    return request(`/salons_members/${salonId}/members`, {method: 'GET'});
}

/**
 * retourne les salons d'un user
 * @param userId - id du user
 * @returns {Promise<{}>}
 */
export async function getUserSalons(userId) {
    return request(`/salons_members/${userId}/salons`, {method: 'GET'});
}

/**
 * retourne les non-membres d'un salon
 * @param salonId - id du salon
 * @returns {Promise<{}>}
 */
export async function getNotMembers(salonId) {
    return request(`/salons_members/${salonId}/notmembers`, {method: 'GET'});
}

/**
 * Ajoute un membre à un salon.
 * @param userId - id du user
 * @param salonId - id du salon
 * @returns {Promise<{}>}
 */
export async function addMemberToSalon(userId, salonId) {
    return request(`/salons_members/salons/members`, {
        method: 'POST',
        body: {user_id: userId, salon_id: salonId},
    });
}

/**
 * Enlève un membre d'un salon.
 * @param salonId - id du salon
 * @param userId - id du user
 * @returns {Promise<{}>}
 */
export async function removeMemberFromSalon(salonId, userId) {
    return request(`/salons_members/${salonId}/members/${userId}`, {method: 'DELETE'});
}

/**
 * retourne les autres users d'un DM
 * @param userId - id du user
 * @returns {Promise<{}>}
 */
export async function getDmUsers(userId) {
    return request(`/dms/user/${userId}/other`, {method: 'GET'});
}

/**
 * Creer un DM entre deux users.
 * @param user_id1 - id du user 1
 * @param user_id2 - id du user 2
 * @returns {Promise<{}>}
 */
export async function createDm({user_id1, user_id2}) {
    return request('/dms', {
        method: 'POST',
        body: {user_id1, user_id2},
    });
}

/**
 * retourne les messages d'un DM
 * @param dmId - id du dm
 * @returns {Promise<{}>}
 */
export async function getDmMessages(dmId) {
    return request(`/messages/${dmId}/message`, {method: 'GET'});
}

/**
 * Envoie un message dans un DM.
 * @param dmId - id du dm
 * @param content - contenu du message
 * @param userId - id de l'utilisateur qui envoie le message
 * @returns {Promise<{}>}
 */
export async function sendDmMessage(dmId, content, userId) {
    return request('/messages', {
        method: 'POST',
        body: {
            dm_id: dmId,
            user_id: userId,
            channel_id: dmId,
            contenu: content
        },
    });
}

/**
 * retourne les salons publics dont l'utilisateur n'est pas membre
 * @param userId - id de l'utilisateur
 * @returns {Promise<{}>}
 */
export function getSalonsPublicsNotMember(userId) {
    return request(`/salons_members/public/notMembers/${userId}`, {method: 'GET'});
}

/**
 * retourne tous les users
 * @returns {Promise<{}>}
 */
export async function getUsers() {
    return request('/user', {method: 'GET'});
}

/**
 * retourne tous les messages
 * @returns {Promise<{}>}
 */
export async function getMessages() {
    return request('/messages', {method: 'GET'});
}

/**
 * Delete un user.
 * @param userId - id du user
 * @returns {Promise<{}>}
 */
export async function deleteUser(userId) {
    try {
        const res = await request(`/user/${userId}`, {method: 'DELETE'});
        console.log('DELETE USER RESPONSE:', res);
        return res;
    } catch (e) {
        console.error('DELETE USER ERROR:', e.status, e.message);
        throw e;
    }
}

/**
 * Delete un salon.
 * @param salonId - id du salon
 * @returns {Promise<{}>}
 */
export async function deleteSalon(salonId) {
    return request(`/salons/${salonId}`, {method: 'DELETE'});
}

/**
 * Delete un message.
 * @param messageId - id du message
 * @returns {Promise<{}>}
 */
export async function deleteMessage(messageId) {
    return request(`/messages/${messageId}`, {method: 'DELETE'});
}

/**
 * Change le statut privé/public d'un salon
 * @param salonId - id du salon
 * @param isPrivate - bool pour privé ou public
 * @returns {Promise<{}>}
 */
export async function changeSalonsStatus(salonId, isPrivate) {
    return request(`/salons/${salonId}`, {
        method: 'PATCH',
        body: {
            is_private: isPrivate ? 0 : 1
        },
    });
}

/**
 * Met à jour la langue de l'utilisateur
 * @param userId - id de l'utilisateur
 * @param thisLang - langue à définir
 * @returns {Promise<{}>}
 */
export async function setLang(userId, thisLang) {
    return request(`/user/${userId}`, {
        method: 'PATCH',
        body: {language: thisLang},
    });
}

/**
 * Met à jour le thème de l'utilisateur
 * @param userId - id de l'utilisateur
 * @param isLight - bool pour thème clair ou sombre
 * @returns {Promise<{}>}
 */
export async function setTheme(userId, isLight) {
    return request(`/user/${userId}`, {
        method: 'PATCH',
        body: {light_mode: isLight},
    });
}

/**
 * retourne le dm entre deux users
 * @param userId1 - id du user 1
 * @param userId2 - id du user 2
 * @returns {Promise<{}>}
 */
export async function getDmEntreUsers(userId1, userId2) {
    return request(`/dms/entre/${userId1}/${userId2}`, {method: 'GET'});
}

/**
 * Met à jour les notifications de l'utilisateur
 * @param userId - id de l'utilisateur
 * @param notifications - notifications, bool pour activer ou désactiver les notifications
 * @returns {Promise<{}>}
 */
export async function setNotifications(userId, notifications) {

    return request(`/user/${userId}`, {
        method: 'PATCH',
        body: {get_notifications: notifications},
    });
}

/**
 * Creer un message.
 * @param message
 * @returns {Promise<{}>}
 */
export async function createMessage(message) {
    return request(`/messages`, {
        method: 'POST', body: message
    });
}

/**
 * retourne les dms selon le id du user
 * @param userId
 * @returns {Promise<{}>}
 */
export async function getDmsById(userId) {
    return request(`/dms/user/${userId}`, {
        method: "GET"
    });
}

/**
 * retourne les dms selon le id du user
 * @param userId
 * @returns {Promise<{}>}
 */
export async function getOtherUserByDmId(userId) {
    return request(`/dms/user/${userId}/other`, {
        method: "GET"
    });
}

/**
 * retourne les dms selon le id du user
 * @param dmId
 * @returns {Promise<{}>}
 */
export async function getMessageByDmId(dmId) {
    return request(`/messages/${dmId}/message`, {
        method: "GET"
    });
}

/**
 * retourne les dms selon le id du user
 * @param dmId
 * @param publicKey
 * @returns {Promise<{}>}
 */
export async function getMessageByBmIdAndKey(dmId, publicKey) {
    return request(`/messages/${dmId}/${publicKey}`, {
        method: "GET"
    });
}

export async function getUserBySalonId(salonId) {
    return request(`/salons_members/${salonId}/members`, {
        method: "GET"
    });
}

/**
 * retourne les messages selon le id du salon
 * @param salonId
 * @returns {Promise<{}>}
 */
export async function getMessageBySalonId(salonId) {
    return request(`/messages/${salonId}/salon/message`, {
        method: "GET"
    });
}

/**
 * get les membres d'un salon
 * @param salonId
 * @returns {Promise<{}>}
 */
export function getNonMembersBySalon(salonId) {
    return request(`/salons_members/${salonId}/notmembers`, {
        method: "GET"
    });
}

/**
 * Update la presence dun user.
 * @param userId
 * @param payload
 * @returns {Promise<{}>}
 */
export function updatePresence(userId, payload) {
    return request(`/user/${userId}/presence`, {
        method: "POST",
        body: {
            user_id: payload.user_id ?? payload.userId,
            estPresent: payload.estPresent,
            type: payload.type,
        }
    });
}

/**
 * Quand un user est en train de taper...
 * @param dmId
 * @param payload
 * @returns {Promise<{}>}
 */
export async function sendTyping(dmId, payload) {
    return request(`/dms/${dmId}/typing`, {
        method: 'POST', body: payload
    });
}

export async function getPublicKey(userId) {
    return request(`/keys/${userId}`, {
        method: 'GET'
    })
}

export async function getPrivateKey(userId) {
    return request(`/privateKeys/${userId}`, {
        method: 'GET'
    })
}

/**
 * Creer un message.
 * @param message
 * @returns {Promise<{}>}
 */
export async function createMessageDoublons(message) {
    return request(`/messages/double`, {
        method: 'POST', body: message
    });
}

export async function setBackgroundDm(payload) {
    return request(`/backgroundDm/`, {
        method: 'POST', body: payload
    });
}

export async function getBackgroundDm(dmId) {
    return request(`/backgroundDm/${dmId}`, {
        method: 'GET'
    });
}
/**
 * retourne les tags selon le id du message
 * @param message_id id du message
 * @returns {Promise<{}>}
 */
export async function getTagsByMessageId(message_id) {
    return request(`/tags/${message_id}`, {
        method: 'GET'
    });
}

/**
 * Met à jour un tag.
 * @param message_id  id du message
 * @param new_tag_name  nouveau nom du tag
 * @returns {Promise<{}>}
 */
export async function updateTag(message_id, new_tag_name) {
    return request(`/tags/${message_id}`, {
        method: 'PUT',
        body: {tag_name: new_tag_name}
    });
}

/**
 * Creer un tag.
 * @param tag_name nom du tag
 * @param message_id id du message
 * @returns {Promise<{}>}
 */
export async function createTags(tag_name, message_id) {
    return request(`/tags`, {
        method: 'POST',
        body: {tag_name: tag_name, message_id: message_id}
    });
}

/**
 * Delete un tag.
 * @param message_id id du message
 * @returns {Promise<{}>}
 */
export async function destroyTag(message_id) {
    return request(`/tags/${message_id}`, {
        method: 'DELETE'
    });
}

/**
 * Envoie une demande d'ami
 * @param receiverId - ID du user à ajouter
 */
export async function sendFriendRequest(receiverId) {
    return request('/friends/send', {
        method: 'POST',
        body: { receiver_id: receiverId },
    });
}

/**
 * Accepte une demande d'ami
 * @param requestId - ID de la relation Friend
 */
export async function acceptFriendRequest(requestId) {
    return request(`/friends/accept/${requestId}`, {
        method: 'PUT',
    });
}

/**
 * Refuse une demande d'ami
 * @param requestId - ID de la relation Friend
 */
export async function declineFriendRequest(requestId) {
    return request(`/friends/decline/${requestId}`, {
        method: 'PUT',
    });
}

/**
 * Récupère la liste des amis
 */
export async function getFriends() {
    return request('/friends/', { method: 'GET' });
}

/**
 * Récupère les demandes d'amis en attente
 */
export async function getPendingFriendRequests() {
    return request('/friends/requests', { method: 'GET' });
}

/**
 * Récupère les demandes d'amis en attente que l'utilisateur a ENVOYÉES
 */
export async function getSentPendingRequests() {
    return request('/friends/sent-requests', { method: 'GET' });
}

export async function getUserProfilePicture(userId) {
    return request(`/user-profile-picture/${userId}`,
        {method: 'GET'});
}

export async function setUserProfilePicture(userId, image) {
    const formData = new FormData();

    formData.append("user_id", String(userId));

    formData.append("photo", {
        uri: image.uri,
        name: image.fileName || "profile.jpg",
        type: image.mimeType || "image/jpeg",
    });

    return request(`/user-profile-picture`, {
        method: 'POST', body: formData });
}