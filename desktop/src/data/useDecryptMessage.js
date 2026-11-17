import forge from "node-forge";

export default function decryptMessage(encryptedMessage) {
    const privateKeyPem = window.localStorage.getItem("privateKey");
    if (!privateKeyPem) {
        console.error("Private key not found in localStorage.");
        return null;
    }

    try {
        const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
        const decodedMessage = forge.util.decode64(encryptedMessage);
        const decryptedMessage = privateKey.decrypt(decodedMessage, "RSA-OAEP", {
            md: forge.md.sha256.create(),
        });
        return decryptedMessage; // Return the original message
    } catch (error) {
        console.error("Error decrypting message:", error);
        return null;
    }
}