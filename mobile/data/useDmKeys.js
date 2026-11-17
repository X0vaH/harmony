import forge from 'node-forge';
import {getPrivateKey, getPublicKey} from "./apiManager";
import * as SecureStore from "expo-secure-store";

export async function getKeys(userId, passwordUser) {
    const publicKeyResponse = await getPublicKey(userId);
    const publicKeyPem = publicKeyResponse.data.public_key;
    const publicKeyId = publicKeyResponse.data.user_id.toString()

    console.log(publicKeyResponse.data.id)

    await SecureStore.setItemAsync("myPublicKey", publicKeyPem);
    await SecureStore.setItemAsync("myPublicKeyId", publicKeyId);

    const privateKeyResponse = await getPrivateKey(userId);
    const encryptedPrivateKeyPem = privateKeyResponse.data.private_key;

    const privateKeyObj = forge.pki.decryptRsaPrivateKey(
        encryptedPrivateKeyPem,
        passwordUser
    );

    if (!privateKeyObj) {
        throw new Error('Mot de passe invalide ou clé privée illisible');
    }

    const privateKeyPem = forge.pki.privateKeyToPem(privateKeyObj);

    await SecureStore.setItemAsync("myPrivateKey", privateKeyPem);

    return { privateKeyPem };
}

export async function getPublicKeys(userId) {
    const publicKeyResponse = await getPublicKey(userId);
    const publicKeyPem = publicKeyResponse.data.public_key;
    const publicKeyId = publicKeyResponse.data.user_id.toString()

    console.log(publicKeyResponse.data.id)

    await SecureStore.setItemAsync("myPublicKey", publicKeyPem);
    await SecureStore.setItemAsync("myPublicKeyId", publicKeyId);

    return { publicKeyPem, publicKeyId };
}


