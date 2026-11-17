import './App.css';
import FooterDePage from './components/Footers';
import {Container} from 'react-bootstrap';
import {Route, Routes, HashRouter} from 'react-router-dom';
import BarreDeNavigation from './components/BarreDeNavigation';
import Salons from './components/Salons';
import Auth from './components/Auth';
import Profil from './components/Profil';
import Friends from './components/Friends';
import {useState} from "react";
import RouteConnecte from './components/RouteConnecte';
import React, {useEffect} from 'react';
import DM from './components/DM'
import {useTranslation} from "react-i18next";
import {ThemeProvider} from "./components/contexts/ThemeContext.jsx";
import {UserContext} from "./components/contexts/UserContext";
import AdminPanel from "./components/AdminPanel.jsx";
import { ConnectionStatusProvider } from "./components/contexts/connectionContext.jsx";
import * as Sentry from "@sentry/react";

function App() {

    // on enleve les infos sensibles avant de stocker le user dans le contexte
    const sanitizeUser = (user) => {
        if (!user) return null;

        //Oubliger de faire ca ici... elle sont utilisé mais pas detecter par le lint
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, token: userToken, ...safe } = user;
        return safe;
    };

    /**
     * Regarde l'état de la session si elle est locale.
     */
    const [session, setSession] = useState(() => {
        const saved = localStorage.getItem("session");
        return saved ? JSON.parse(saved) : null;
    });


    const [user, setUser] = useState(null);

    /**
     * handler lors du login d'un user
     * @param userOrStored
     * @param isAdmin
     */
    const handleLogin = (userOrStored, isAdmin) => {
        const storedSource = (userOrStored && userOrStored.user) ? userOrStored : { user: userOrStored, token: null };
        const safeUser = sanitizeUser(storedSource.user);
        const adminFlag = typeof isAdmin !== 'undefined' ? isAdmin : (safeUser?.is_admin || false);

        const newSession = {
            user: safeUser,
            loggedIn: true,
            isAdmin: adminFlag,
            token: storedSource.token || null
        };

        setSession(newSession);
        localStorage.setItem('session', JSON.stringify(newSession));
    };

    /**
     * Gere le logout du User
     */
    const handleLogout = () => {
        setSession(null);
        setUser(null);
        localStorage.removeItem('session');
        Sentry.setUser({id: "user n'est pas connecté" });
    };
    const {t} = useTranslation();

    useEffect(() => {
        document.title = "Harmony";
    }, []);


    return (
        <UserContext.Provider value={{user, setUser}}>
            <ConnectionStatusProvider>
                <HashRouter>
                    <ThemeProvider>
                        <div className="App">
                            <BarreDeNavigation session={session} onLogout={handleLogout}/>
                            <Container>
                                <Routes>
                                    <Route path="/" element={<h2>{t('pageAccueil')}</h2>}/>
                                    <Route
                                        path="salons"
                                        element={
                                            <RouteConnecte session={session}>
                                                <Salons user={session?.user}/>
                                            </RouteConnecte>
                                        }
                                    />
                                    <Route
                                        path="messages-privés"
                                        element={
                                            <RouteConnecte session={session}>
                                                {<DM/>}
                                            </RouteConnecte>
                                        }
                                    />
                                    <Route
                                        path="amis"
                                        element={
                                            <RouteConnecte session={session}>
                                                <Friends user={session?.user} />
                                            </RouteConnecte>
                                        }
                                    />
                                    <Route
                                        path="profil"
                                        element={
                                            <RouteConnecte session={session}>
                                                <Profil user={session?.user}/>
                                            </RouteConnecte>
                                        }
                                    />
                                    <Route
                                        path="connection"
                                        element={<Auth onLogin={handleLogin}/>}
                                    />
                                    <Route
                                        path="admin"
                                        element={
                                            <RouteConnecte session={session}>
                                                {user?.user.is_admin && (<AdminPanel/>)}
                                            </RouteConnecte>
                                        }
                                    />
                                </Routes>
                            </Container>
                            <FooterDePage/>
                        </div>
                    </ThemeProvider>
                </HashRouter>
            </ConnectionStatusProvider>
        </UserContext.Provider>
    )
}

export default App
