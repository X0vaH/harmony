import StatusConnection from "./StatusConnection.jsx";
import {useTranslation} from "react-i18next";

/**
 * Composant de footer de page, affichera le copyright et le statut de la connexion internet.
 * @returns {JSX.Element}
 * @constructor
 */
function FooterDePage() {

    const {t} = useTranslation();

    return (
        <footer className="bg-gray-800 text-white py-4 mt-8">
            <div className="container mx-auto flex items-center justify-between">
                <p>{t('copyright')}</p>
                <StatusConnection/>
            </div>
        </footer>
    );
}


export default FooterDePage;