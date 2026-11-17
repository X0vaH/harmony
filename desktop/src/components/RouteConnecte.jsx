import {Navigate} from "react-router-dom";

/**
 * Composant de route protégée, redirige vers la page de connexion si pas connecté.
 * Utilise la prop "session" pour vérifier l'état de connexion.
 * Affiche les enfants si connecté.
 * @param children
 * @param session
 * @param children
 * @returns {*|JSX.Element}
 * @constructor
 */
export default function RouteConnecte({session, children}) {
    /**
     * Regarde si il y a une session en cours, sinon on redirige vers la connexion
     */
    if (!session || !session.loggedIn) {
        // Si pas connecté, redirige vers connexion
        return <Navigate to="/connection" replace/>;
    }

    // Sinon, affiche l'enfant
    return children;
}