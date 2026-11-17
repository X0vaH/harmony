

import forge from "node-forge";

// Fonction pour chiffrer un message avec une clé publique
export default function encryptMessage(message, publicKeyPem) {
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const encryptedMessage = publicKey.encrypt(message, "RSA-OAEP", {
        md: forge.md.sha256.create(),
    });
    return forge.util.encode64(encryptedMessage); // Encodage en base64 pour l'envoi
}
