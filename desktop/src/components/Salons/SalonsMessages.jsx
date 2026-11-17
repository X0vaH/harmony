import React, { useRef } from "react";

/**
 * Retourne une couleur hexadécimale basée sur une chaîne de caractères donnée.
 * @param str - chaîne d'entrée
 * @returns {string}
 */
// Exemple de fonction utilitaire pour la couleur d'avatar
function getColorFromString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
}

export default function SalonsMessages({
                                           messages = [],
                                           salonMembers = [],
                                       }) {
    const messagesEndRef = useRef(null);

    return (
        <>
            <div style={{ flex: 1, padding: "1rem", overflowY: "auto" }}>
                {(messages || []).map(m => {
                    //const sender = salonMembers.find(u => u.id === m.userId);
                    const sender =
                        (salonMembers.find((u) => String(u.id) === String(m.userId))) ??
                        `#${m.userId}`;
                    return (
                        <div
                            key={m.id}
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                marginBottom: "1rem",
                            }}
                        >
                            <div
                                style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    backgroundColor: getColorFromString(sender?.name || ""),
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: "bold",
                                    marginRight: "0.75rem",
                                    flexShrink: 0,
                                }}
                            >
                                {sender?.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "0.5rem",
                                        alignItems: "center",
                                    }}
                                >
                                    <strong>{sender?.name || "?"}</strong>
                                    <span style={{ fontSize: "0.75rem", color: "gray" }}>
                                        {m.date}
                                    </span>
                                </div>
                                <div>{m.content}</div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
        </>
    );
}