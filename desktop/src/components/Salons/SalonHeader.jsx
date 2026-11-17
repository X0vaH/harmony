import React from "react";

/**
 * Composant affichant l'en-tête du salon actif avec son nom, le nombre de membres et un bouton pour quitter le salon.
 * @param salonActif - objet salon actif
 * @param uactif - objet ou id du salon actif
 * @param userId - id de l'utilisateur actif
 * @param t - fonction de traduction
 * @param leaveSalon - fonction pour quitter le salon
 * @returns {React.JSX.Element}
 * @constructor
 */
export default function SalonHeader({ salonActif, uactif, userId, t, leaveSalon }) {

    console.log("id pour le lint :", userId);

    // support both `salonActif` (object) and `uactif` (object or id)
    const salon =
        salonActif ||
        (uactif
            ? typeof uactif === "object"
                ? uactif
                : { id: uactif, name: uactif, members: [] } // fallback when uactif is an id string
            : null);

    if (!salon) return <div style={{ padding: "1rem" }}>{t("noSalonSelected") || "No salon"}</div>;


    const handleLeave = async () => {
        const confirmMsg = t("confirmLeave") || "Leave this salon?";
        if (!window.confirm(confirmMsg)) return;
        await leaveSalon(salon.id);
    };

    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", borderBottom: "1px solid #eee" }}>
            <div>
                <h3 style={{ margin: 0 }}># {salon.name}</h3>
                <div style={{ fontSize: "0.85rem", color: "#666" }}>
                    {t("members") || "Members"}: {(salon.members || []).length}
                </div>
            </div>

                <button
                    onClick={handleLeave}
                    style={{ background: "#f66", color: "#fff", border: "none", padding: "0.4rem 0.6rem", cursor: "pointer", borderRadius: "4px" }}
                >
                    {t("leave") || "Leave"}
                </button>
        </div>
    );
}