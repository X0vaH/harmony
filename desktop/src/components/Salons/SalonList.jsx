import React from "react";


/**
 * Composant affichant la liste des salons de l'utilisateur et les salons publics.
 * @param userSalons - Liste des salons de l'utilisateur
 * @param activeSalonId - ID du salon actif
 * @param setActiveSalonId - Fonction pour définir le salon actif
 * @param addingSalon - Booléen indiquant si on est en train d'ajouter un salon
 * @param setAddingSalon - Fonction pour définir l'état d'ajout de salon
 * @param newSalonName - Nom du nouveau salon
 * @param setNewSalonName - Fonction pour définir le nom du nouveau salon
 * @param confirmAddSalon - Fonction pour confirmer l'ajout du salon
 * @param salonsPublics - Liste des salons publics
 * @param joinSalon - Fonction pour rejoindre un salon public
 * @param t - Fonction de traduction
 * @returns {React.JSX.Element}
 * @constructor
 */
export default function SalonList({
                                      userSalons,
                                      activeSalonId,
                                      setActiveSalonId,
                                      addingSalon,
                                      setAddingSalon,
                                      newSalonName,
                                      setNewSalonName,
                                      confirmAddSalon,
                                      salonsPublics,
                                      joinSalon,
                                      t
                                  }) {

    return (
        <div>
            <h2>{t('messalons')}</h2>
            {userSalons.map(s => (
                <div
                    key={s.id}
                    onClick={() => setActiveSalonId(s.id)}
                    style={{
                        padding: "0.5rem",
                        cursor: "pointer",
                        border: activeSalonId === s.id ? "1px solid #ccc" : "transparent",
                        borderRadius: "5px",
                        marginBottom: "0.25rem",
                    }}
                >
                    # {s.name}
                </div>
            ))}
            {addingSalon ? (
                <div style={{marginTop: "1rem"}}>
                    <input
                        type="text"
                        placeholder="Nom du salon..."
                        value={newSalonName}
                        onChange={e => setNewSalonName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && confirmAddSalon()}
                        style={{width: "100%", padding: "0.5rem", marginBottom: "0.5rem"}}
                        autoFocus
                    />
                    <div style={{display: "flex", gap: "0.5rem"}}>
                        <button onClick={confirmAddSalon} style={{flex: 1, padding: "0.5rem"}}>
                            {t('creer')}
                        </button>
                        <button
                            onClick={() => {
                                setAddingSalon(false);
                                setNewSalonName("");
                            }}
                            style={{flex: 1, padding: "0.5rem"}}
                        >
                            {t('annuler')}
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setAddingSalon(true)}
                    style={{
                        marginTop: "1rem",
                        padding: "0.5rem",
                        width: "100%",
                        cursor: "pointer",
                    }}
                >
                    {t('creerSalon')}
                </button>
            )}


            {/* Affiche seulement les salons publics qui sont dispo */}

            <h2>{t('salonsPublics')}</h2>
            {salonsPublics.map(s => (
                <div
                    key={s.id}
                    style={{
                        padding: "0.5rem",
                        cursor: "pointer",
                        border: activeSalonId === s.id ? "1px solid #ccc" : "transparent",
                        borderRadius: "5px",
                        marginBottom: "0.25rem",
                    }}
                >
                    # {s.name}
                    <button onClick={() => joinSalon(s.id)}>{t('rejoindre')}</button>
                </div>
            ))}

        </div>





    );
}