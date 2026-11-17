
/**
 * La barre de navigation, permet de naviguer entre les différentes pages comme le profil, les salons, les messages privés et l'accueil.
 * Restera à ajouter la parties auth pour ne pas afficher la partie connexion et le reste si l'utilisateur n'est pas connecté.
 * @returns {JSX.Element}
 * @constructor
 */
import React, {useEffect, useState} from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from './contexts/ThemeContext.jsx';
import {
    setDarkModePreference,
    setLanguagePreference,
    setNotificationPreference,
    updatePresence
} from "../data/apiManager.js";
import {useContext} from "react";
import {UserContext} from "./contexts/UserContext.js";

/**
 * Composant de la barre de navigation principale de l'application.
 * @param session - Objet de session utilisateur contenant l'état de connexion.
 * @param onLogout - Fonction callback appelée lors de la déconnexion.
 * @returns {React.JSX.Element}
 * @constructor
 */
function BarreDeNavigation({ session, onLogout }) {
    const { user } = useContext(UserContext);
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();


    const [notificationsEnabled, setNotificationsEnabled] = useState(user?.user?.get_notifications ?? false);

    useEffect(() => {
        setNotificationsEnabled(user?.user?.get_notifications ?? false);
    }, [user]);

    const handleNotif = async () => {
        // devrait pas arriver
        if (!user) return;

        const newPref = !notificationsEnabled;
        setNotificationsEnabled(newPref);

        try {
            await setNotificationPreference(user.user.id, newPref, user.token);
            console.log("Préférence de notification mise à jour avec succès.");

        }
        catch (error) {
            console.error("Erreur lors de la mise à jour des notifications :", error);

            // Rollback de l'état en cas d'erreur
            setNotificationsEnabled(prev => !prev);
        }


    }

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        if (user) {
            setLanguagePreference(user.user.id, lng, user.token);
        }
    };

    const handleThemeToggle = () => {
        if (user) {
            setDarkModePreference(user.user.id, theme === 'dark', user.token);
        }
        toggleTheme();
    }

    const handleClickLogout = () => {
        if (user != null) {
            const payloadOn = {
                user_id: user.user.id,
                estPresent: false,
            };

            updatePresence(user.user.id, payloadOn, user.token);
        }

        onLogout();
        localStorage.removeItem("publicKey");
        localStorage.removeItem("privateKey");
        navigate('/');
    };

    if (session != null && user != null) {
        const payloadOn = {
            user_id: user.user.id,
            estPresent: true,
        };

        updatePresence(user.user.id, payloadOn, user.token);
    }

    return (
        <Navbar className={`BardeNavigation ${theme}`}>
            <Container>
                <Navbar.Brand>Harmony</Navbar.Brand>
                <Nav className='me-auto'>
                    <Nav.Link as={NavLink} to='/'>{t('accueil')}</Nav.Link>
                    <Nav.Link as={NavLink} to='salons'>{t('salons')}</Nav.Link>
                    <Nav.Link as={NavLink} to='messages-privés'>{t('DM')}</Nav.Link>
                    <Nav.Link as={NavLink} to='profil'>{t('profil')}</Nav.Link>
                    <Nav.Link as={NavLink} to='amis'>{t('amis')}</Nav.Link>

                    {session?.loggedIn ? (
                        <Nav.Link onClick={handleClickLogout}>{t('deconnexion')}</Nav.Link>
                    ) : (
                        <Nav.Link as={NavLink} to='connection'>{t('connexion')}</Nav.Link>
                    )}
                    { user?.user.is_admin && (
                        <Nav.Link as={NavLink} to='admin'>{t('admin')}</Nav.Link>
                    )}

                    <button className={`${theme}`} onClick={() => changeLanguage('fr')}>fr</button>
                    <button className={`${theme}`} onClick={() => changeLanguage('en')}>en</button>
                    <button className={`${theme}`} onClick={handleThemeToggle}>Mode</button>
                    <button
                        className={`${theme}`}
                        onClick={handleNotif}
                        aria-pressed={notificationsEnabled}
                    >
                        {notificationsEnabled ? t('notifications_on') : t('notifications_off')}
                    </button>
                </Nav>
            </Container>
        </Navbar>
    );
}

export default BarreDeNavigation;