import {useState, useEffect} from 'react';
import {View, TextInput, Button, StyleSheet, Text, Alert, Appearance} from 'react-native';
import {useRouter} from 'expo-router';
import {useTranslation} from 'react-i18next';
import {login, createAccount} from '@/data/apiManager';
import * as SecureStore from 'expo-secure-store';
import i18n from 'i18next';
import {getKeys} from "../../data/useDmKeys";

export default function AuthScreen() {
    const {t} = useTranslation();
    const router = useRouter();
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const [a, setA] = useState(0);
    const [b, setB] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');

    useEffect(() => {
        generateMathChallenge();
    }, []);

    const generateMathChallenge = () => {
        const x = Math.floor(Math.random() * 10);
        const y = Math.floor(Math.random() * 10);
        setA(x);
        setB(y);
        setUserAnswer('');
    };

    const handleLogin = async () => {


        if (!name.trim() || !password.trim()) {
            Alert.alert(t('erreur'), t('remplirChamp'));
            return;
        }

        if (password.trim().length < 5) {
            Alert.alert(t('erreur'), t('tooShort'));
            return;
        }

        if (!/\d/.test(password)) {
            Alert.alert(t('erreur'), t('noNumber'));
            return;
        }

        if (!/[A-Z]/.test(password)) {
            Alert.alert(t('erreur'), t('noCapital'));
            return;
        }

        // verif captcha math
        if (parseInt(userAnswer, 10) !== a + b) {
            Alert.alert(t('erreur'), t('wrongAnswer'));
            generateMathChallenge();
            return;
        }

        setLoading(true);

        try {
            const data = await login(name, password);
            await SecureStore.setItemAsync('userId', data.user.id.toString());
            await SecureStore.setItemAsync('is_admin', JSON.stringify(data.user.is_admin));

            const prefNotif = data.user.get_notifications === true ? "true" : "false";

            await SecureStore.setItemAsync('get_notif', prefNotif);

            console.log('User notification preference:', prefNotif);

            const cholorScheme = data.user.light_mode ? 'light' : 'dark';
            console.log('User preferred color scheme:', cholorScheme);

            i18n.changeLanguage(data.user.language || 'fr');

            await getKeys(data.user.id, password);

            Appearance.setColorScheme(cholorScheme);
            router.replace('/(tabs)');
        } catch (err) {
            const status = err?.status;
            console.log('Login error:', err);
            console.log('Login error status:', status);

            if (status === 401 || status === 404) {
                try {
                    await createAccount(name, password);
                    console.log('Account created, proceeding to login.');
                    const data = await login(name, password);

                    console.log(data.user.id);
                    await SecureStore.setItemAsync('userId', JSON.stringify(data.user.id));
                    await SecureStore.setItemAsync('is_admin', JSON.stringify(data.user.is_admin));

                    const prefNotif = data.user.get_notifications === true ? "true" : "false";

                    await SecureStore.setItemAsync('get_notif', prefNotif);

                    console.log('User notification preference:', prefNotif);

                    const cholorScheme = data.user.light_mode ? 'light' : 'dark';
                    console.log('User preferred color scheme:', cholorScheme);

                    i18n.changeLanguage(data.user.language || 'fr');
                    Appearance.setColorScheme(cholorScheme);
                    router.replace('/(tabs)');
                } catch (creationError) {
                    console.error(creationError);
                    Alert.alert(t('erreur'), creationError.message || t('connexionImp'));
                }
            } else {
                console.error(err);
                Alert.alert(t('erreur'), err.message || t('connexionImp'));
            }

        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('connexion')}</Text>

            <TextInput
                style={styles.input}
                placeholder={t('nomUser')}
                placeholderTextColor="#888"
                value={name}
                onChangeText={setName}
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder={t('mdp')}
                placeholderTextColor="#888"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <Text style={{color: "white", marginBottom: 5}}>
                {t('captcha')} {a} + {b} ?
            </Text>

            <TextInput
                style={styles.input}
                placeholder={t("mathAnswerph")}
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={userAnswer}
                onChangeText={setUserAnswer}
            />

            <Button
                title={loading ? t('connexion...') : t('seConnecter')}
                onPress={handleLogin}
                disabled={loading}
                color="#4A90E2"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#111',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: 'white',
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 12,
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#222',
        color: 'white',
    },
});