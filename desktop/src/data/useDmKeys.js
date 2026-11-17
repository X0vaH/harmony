import forge from "node-forge";
import axios from "axios";

export async function getOrCreateKeys(password, userId, token) {
    const fetchResult = await getPublicKey(userId, token, password);

    if (fetchResult?.response?.status === 404) {
        const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });

        const publicKey = keypair.publicKey;
        const privateKey = keypair.privateKey;

        const privateEncrypted = forge.pki.encryptRsaPrivateKey(
            privateKey,
            password,
            {
                algorithm: "aes256",
                count: 2048,
                saltSize: 128 / 8,
            }
        )
        const publicPem = forge.pki.publicKeyToPem(publicKey);

        try {
            await axios.post(`https://definitelynotharmony.dev/api/keys`, {
                public_key: publicPem,
                user_id: userId
            }, {
                headers: {Authorization: `Bearer ${token}`}
            })
            console.log("PLEASE");
        } catch (e) {
            console.error(e);
        }

        const iv = forge.random.getBytesSync(16);

        try {
            await axios.post(`https://definitelynotharmony.dev/api/privateKeys`, {
                private_key: privateEncrypted,
                user_id: userId,
                iv: iv
            }, {
                headers: {Authorization: `Bearer ${token}`}
            })
            console.log("THANK YOU");
        } catch (e) {
            console.error(e);
        }
    }
}

async function getPublicKey(userId, token, password) {
    try {
        const result = await axios.get(`https://definitelynotharmony.dev/api/keys/${userId}`, {
            headers: {Authorization: `Bearer ${token}`},
        });
        //console.log(result);
        window.localStorage.setItem('publicKey', result.data.data.public_key);
        //on nde devrais pas faire ca.
        window.localStorage.setItem('publicKeyId', result.data.data.id);

        const privateKeyResult = await axios.get(`https://definitelynotharmony.dev/api/privateKeys/${userId}`, {
            headers: {Authorization: `Bearer ${token}`}
        });
        const privateKeyDecrypted = forge.pki.decryptRsaPrivateKey(
            privateKeyResult.data.data.private_key,
            password,
        )

        const privatePem = forge.pki.privateKeyToPem(privateKeyDecrypted);

        window.localStorage.setItem('privateKey', privatePem);
    } catch (err) {
        return err;
    }
}