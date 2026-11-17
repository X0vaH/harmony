import {useContext, useState} from 'react';
import * as Sentry from "@sentry/react";
import {useNavigate} from 'react-router-dom';
import {useTranslation} from "react-i18next";
import axios from "axios";
import {UserContext} from "./contexts/UserContext.js";
import {useTheme} from "./contexts/ThemeContext.jsx";
import {getOrCreateKeys} from "../data/useDmKeys.js";

/**
 * Composant de gestion de l'authentification (connexion / création de compte).
 * Si l'utilisateur n'existe pas, on tente de le créer via l'API.
 */
export default function Auth({onLogin}) {
    const [pseudo, setPseudo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showChallenge, setShowChallenge] = useState(false);
    const [challenge, setChallenge] = useState(null);

    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { setUser } = useContext(UserContext);
    const { setTheme } = useTheme();

    const saveAndApplyUser = (tokenData) => {
        const sanitizeUser = (user) => {
            if (!user) return null;

            //Same shit que dans lautre sanitizeUser, le lint ne le comprte pas comme un valeur utiliser
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password, ...safe } = user;
            return safe;
        };

        const safeUser = sanitizeUser(tokenData.user);
        const stored = { user: safeUser, token: tokenData.token || tokenData.access_token || null };
        localStorage.setItem("current_user", JSON.stringify(stored));
        setUser(stored);

        if (safeUser) {
            Sentry.setUser({ id: safeUser.id });
            i18n.changeLanguage(safeUser.language || 'fr');
            setTheme(safeUser.light_mode ? 'light' : 'dark');
        }

        return stored;
    };

    // Genere un challenge mathematique random (MFA)
    const generateMathChallenge = () => {
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        const operators = ["+", "-", "*"];
        const op = operators[Math.floor(Math.random() * operators.length)];

        let answer;
        switch (op) {
            case "+": answer = a + b; break;
            case "-": answer = a - b; break;
            case "*": answer = a * b; break;
        }

        return { question: `${a} ${op} ${b}`, answer };
    };

    // Crée le modal du challenge
    const MathChallengeModal = ({ question, onSubmit, onCancel }) => {
        const [answer, setAnswer] = useState("");

        const handleSubmit = (e) => {
            e.preventDefault();
            onSubmit(Number(answer));
        };

        return (
            <div className="challenge-modal">
                <div className="challenge-container">
                    <h3>Résolvez le challenge</h3>
                    <p>{question}</p>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="number"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            autoFocus
                            style={{ width: '80%', padding: '0.5rem', marginBottom: '1rem' }}
                        />
                        <div>
                            <button type="submit" style={{ marginRight: '0.5rem' }}>Valider</button>
                            <button type="button" onClick={onCancel}>Annuler</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!pseudo.trim() || !password.trim()) {
            setError(t("erreurConnexion"));
            return;
        }

        // longueur
        if (password.length < 5) {
            setError(t("erreurLongueur"));
            return;
        }

        // majuscule
        if (!/[A-Z]/.test(password)) {
            setError(t("erreurMajuscule"));
            return;
        }

        // chiffre
        if (!/[0-9]/.test(password)) {
            setError(t("erreurChiffre"));
            return;
        }

        // Génération du challenge
        setChallenge(generateMathChallenge());
        setShowChallenge(true);
    };

    const handleChallengeSubmit = async (userAnswer) => {
        if (userAnswer !== challenge.answer) {
            setError("Réponse incorrecte au challenge mathématique !");
            setShowChallenge(false);
            return;
        }


        setShowChallenge(false);
        setError("");

        try {
            // Tentative de connexion
            const tokenRes = await axios.post('https://definitelynotharmony.dev/api/user/token', {
                name: pseudo,
                password: password
            });

            // Utilisation de tokenRes pour éviter l'avertissement ESLint
            saveAndApplyUser(tokenRes.data);

            onLogin(tokenRes.data.user || tokenRes.data);
            await getOrCreateKeys(password, tokenRes.data.user.id, tokenRes.data.token);
            navigate("/");
            console.log(window.localStorage.getItem("publicKey"));
            // a ne pas faire lol
            //console.log(window.localStorage.getItem("privateKey"));
        } catch (err) {
            // Si l'utilisateur n'existe pas ou credentials invalides, on tente de créer le user puis récupérer le token
            const status = err?.response?.status;
            if (status === 401 || status === 404) {
                try {
                    await axios.post('https://definitelynotharmony.dev/api/user/', {
                        name: pseudo,
                        password: password
                    });

                    const tokenRes = await axios.post('https://definitelynotharmony.dev/api/user/token', {
                        name: pseudo,
                        password: password
                    });

                    saveAndApplyUser(tokenRes.data);
                    onLogin(tokenRes.data.user || tokenRes.data);
                    navigate("/");
                } catch (err2) {
                    console.error("Erreur création / récupération du token :", err2);
                    setError(t("erreurConnexion"));
                }
            } else {
                console.error("Erreur lors de la récupération du token :", err);
                setError(t("erreurConnexion"));
            }
        }
    };

    return (
        <div>
            <h2>{t('connexion')}</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={pseudo}
                    onChange={e => setPseudo(e.target.value)}
                    placeholder={t('pseudoUser')}
                    autoComplete="username"
                />
                <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t('passWord') || "Mot de passe"}
                    autoComplete="current-password"
                />
                <button type="submit">{t('seConnecter')}</button>
            </form>
            {error && <p style={{color: "red"}}>{error}</p>}

            {showChallenge && challenge && (
                <MathChallengeModal
                    question={challenge.question}
                    onSubmit={handleChallengeSubmit}
                    onCancel={() => setShowChallenge(false)}
                />
            )}
        </div>
    );
}