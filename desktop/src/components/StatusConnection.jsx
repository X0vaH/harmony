import { useConnectionStatus } from "../components/contexts/connectionContext.jsx";

/**
 * Composant affichant le statut de la connexion internet.
 * @returns {JSX.Element}
 * @constructor
 */
function StatusConnection() {
    const isOnline= useConnectionStatus();

    return (
        <div className={`p-2 text-center ${isOnline ? "bg-green-500" : "bg-red-500"}`}>
            {/* Les deux images sont toujours présentes, une seule visible */}
            <img
                src="/wifi.png"
                alt="Online"
                style={{
                    width: "32px",
                    height: "32px",
                    display: isOnline ? "inline-block" : "none"
                }}
            />
            <img
                src="/noWifi.png"
                alt="Offline"
                style={{
                    width: "32px",
                    height: "32px",
                    display: isOnline ? "none" : "inline-block"
                }}
            />
        </div>
    );
}

export default StatusConnection;