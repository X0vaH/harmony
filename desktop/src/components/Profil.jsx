import { useEffect, useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { getUserProfilePicture, setUserProfilePicture } from "../data/apiManager";
import { UserContext } from "./contexts/UserContext";

export default function Profil({ user }) {
    const { t } = useTranslation();
    const { user: auth } = useContext(UserContext);

    const effectiveUser = user ?? auth?.user;
    const token = auth?.token;

    const [photoUrl, setPhotoUrl] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!effectiveUser?.id || !token) return;

        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                const res = await getUserProfilePicture(effectiveUser.id, token);
                const url = res?.data?.photo_url ?? null;
                if (!cancelled) {
                    setPhotoUrl(url);
                    setPreviewUrl(null);
                    setSelectedFile(null);
                }
            } catch (e) {
                console.error("[Profil] erreur chargement photo:", e);
                if (!cancelled) {
                    setPhotoUrl(null);
                    setPreviewUrl(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [effectiveUser?.id, token, t]);

    if (!effectiveUser) {
        return <div>{t("aucunUtilisateur")}</div>;
    }

    const initial = effectiveUser.name?.[0]?.toUpperCase?.() ?? "?";

    // Quand l'utilisateur choisit un fichier
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) {
            setSelectedFile(null);
            setPreviewUrl(null);
            return;
        }

        setSelectedFile(file);
        const localUrl = URL.createObjectURL(file);
        setPreviewUrl(localUrl);
    };

    const handleSave = async () => {
        if (!effectiveUser?.id || !token) return;

        setSaving(true);

        try {
            const res = await setUserProfilePicture(effectiveUser.id, selectedFile, token);
            const newUrl = res?.data?.photo_url ?? null;

            setPhotoUrl(newUrl);
            setSelectedFile(null);
            setPreviewUrl(null);
            console.log("Image Sauvegarder", newUrl);
        } catch (e) {
            console.error("[Profil] erreur sauvegarde photo:", e);
        } finally {
            setSaving(false);
        }
    };

    const avatarSrc = previewUrl || photoUrl;

    return (
        <div style={{ padding: "1rem", maxWidth: 500 }}>
            <h2>{t("pseudoUser")}</h2>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    marginTop: "0.5rem",
                    marginBottom: "1rem",
                }}
            >
                <div
                    style={{
                        width: 96,
                        height: 96,
                        borderRadius: "50%",
                        overflow: "hidden",
                        backgroundColor: "#e5e7eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "2.4rem",
                        fontWeight: "bold",
                    }}
                >
                    {avatarSrc ? (
                        <img
                            src={avatarSrc}
                            alt={effectiveUser.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    ) : (
                        <span>{initial}</span>
                    )}
                </div>

                <div>
                    <h1 style={{ margin: 0 }}>{effectiveUser.name}</h1>
                    {loading && (
                        <div style={{ fontSize: "0.8rem", color: "gray" }}>
                            {t("chargement") || "Chargement..."}
                        </div>
                    )}
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                }}
            >
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                />

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !selectedFile}
                    style={{
                        alignSelf: "flex-start",
                        marginTop: "0.25rem",
                        padding: "0.35rem 0.9rem",
                        borderRadius: 4,
                        border: "1px solid #4b5563",
                        backgroundColor: saving ? "#9ca3af" : "#4b5563",
                        color: "white",
                        cursor: saving || !selectedFile ? "default" : "pointer",
                        opacity: saving || !selectedFile ? 0.7 : 1,
                    }}
                >
                    {t("save")}
                </button>

            </div>
        </div>
    );
}
