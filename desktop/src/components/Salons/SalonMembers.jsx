import React from "react";

/**
 * Composant affichant les membres d'un salon de discussion.
 * @param salonMembers - liste des membres du salon
 * @param t - fonction de traduction
 * @param onStartDm - fonction pour démarrer une conversation privée avec un membre
 * @param currentUserId - id de l'utilisateur courant
 * @returns {React.JSX.Element}
 * @constructor
 */
export default function SalonMembers({ salonMembers, t, onStartDm, currentUserId }) {
    return (
        <div
            style={{
                padding: "0.5rem 1rem",
                borderBottom: "1px solid #eee",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem 0.75rem",
                alignItems: "center",
            }}
        >
            <strong style={{ marginRight: "0.5rem" }}>{t("membres")}</strong>

            {salonMembers.map((m) => {
                const isSelf = String(m.id) === String(currentUserId);
                return (
                    <button
                        key={m.id}
                        type="button"
                        onClick={() => !isSelf && onStartDm?.(m)}
                        title={
                            isSelf
                                ? currentUserId.name
                                : t("demarrerDmAvec") + m.name
                        }
                        disabled={isSelf}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            padding: "0.25rem 0.7rem",
                            borderRadius: "14px",
                            boxShadow: "0 1px 2px #0001",
                            border: "1px solid #eee",
                            background: isSelf ? "#f6f6f6" : "white",
                            cursor: isSelf ? "not-allowed" : "pointer",
                            outline: "none",
                            transition: "transform 120ms ease, box-shadow 120ms ease, background 120ms ease",
                        }}
                    >
            <span
                aria-hidden
                style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: m.estOnline ? "green" : "gray",
                    display: "inline-block",
                }}
            />
                        <span style={{ fontSize: ".95rem", color: "black" }}>
              {isSelf ? t("vous") : m.name}
            </span>
                    </button>
                );
            })}
        </div>
    );
}
