import forge from "node-forge";
import * as SecureStore from "expo-secure-store";

export function encryptMessage(message, publicKeyPem) {
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const encryptedMessage = publicKey.encrypt(message, "RSA-OAEP", {
        md: forge.md.sha256.create(),
    });
    return forge.util.encode64(encryptedMessage); // Encodage en base64 pour l'envoi
}

export async function decryptMessage(encryptedMessage, privateKeyPem) {
    if (!encryptedMessage || typeof encryptedMessage !== 'string') return encryptedMessage;

    let base64;

    if (encryptedMessage.startsWith('ENC:')) {
        base64 = encryptedMessage.slice(4);
    } else {
        const base64Regex = /^[A-Za-z0-9+/=]+$/;
        if (!base64Regex.test(encryptedMessage)) {
            return encryptedMessage;
        }
        base64 = encryptedMessage;
    }

    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    try {
        const decodedMessage = forge.util.decode64(base64);
        const decryptedMessage = privateKey.decrypt(decodedMessage, "RSA-OAEP", {
            md: forge.md.sha256.create(),
        });
        return decryptedMessage; // Return the original message
    } catch (error) {
        console.error("Error decrypting message:", error);
        return null;
    }
}