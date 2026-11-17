import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import { getUserProfilePicture, setUserProfilePicture } from "../../data/apiManager";

export default function ProfileScreen() {
    const { t } = useTranslation();

    const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState("");
    const [photoUrl, setPhotoUrl] = useState(null);
    const [localImage, setLocalImage] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const id = await SecureStore.getItemAsync("userId");
                const name = await SecureStore.getItemAsync("userName");
                if (id) {
                    setUserId(parseInt(id, 10));
                    setUserName(name || "");
                }
            } catch (e) {
                console.error("[ProfileScreen] erreur SecureStore:", e);
                Alert.alert("Erreur", "Impossible de récupérer les infos utilisateur.");
            }
        })();
    }, []);

    useEffect(() => {
        if (!userId) return;

        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                const res = await getUserProfilePicture(userId);
                const url = res?.data?.photo_url ?? null;
                if (!cancelled) {
                    setPhotoUrl(url);
                    setLocalImage(null);
                }
            } catch (e) {
                console.error("[ProfileScreen] erreur chargement photo:", e);
                if (!cancelled) {
                    setPhotoUrl(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [userId]);

    const initial = (userName?.[0] || "?").toUpperCase();

    const pickImage = async () => {

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert(
                "Permission requise",
                "Nous avons besoin de l'accès à votre galerie pour choisir une photo."
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (result.canceled) return;

        const asset = result.assets[0];
        console.log("[ProfileScreen] Image sélectionnée:", asset);

        setLocalImage(asset);
    };

    const handleSave = async () => {
        if (!userId) return;
        if (!localImage) return;

        try {
            const res = await setUserProfilePicture(userId, localImage);
            const newUrl = res?.data?.photo_url ?? null;
            console.log("[ProfileScreen] Sauvegarde OK:", newUrl);

            setPhotoUrl(newUrl);
            setLocalImage(null);
        } catch (e) {
            console.error("[ProfileScreen] erreur sauvegarde photo:", e);
        }
    };

    const avatarUri = localImage?.uri || photoUrl || null;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                {"Profil"}
            </Text>

            <View style={styles.avatarSection}>
                <View style={styles.avatarWrapper}>
                    {avatarUri ? (
                        <Image
                            source={{ uri: avatarUri }}
                            style={styles.avatarImage}
                        />
                    ) : (
                        <View style={styles.avatarFallback}>
                            <Text style={styles.avatarInitial}>{initial}</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.userName}>
                    {userName || `User #${userId || "?"}`}
                </Text>

                {loading && (
                    <ActivityIndicator style={{ marginTop: 8 }} color="#9ca3af" />
                )}
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.button} onPress={pickImage}>
                    <Text style={styles.buttonText}>
                        {t("choisirPhotoProfil")}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, !localImage && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={!localImage}
                >
                    <Text style={styles.buttonText}>
                        {t("save")}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 24,
    },
    avatarSection: {
        alignItems: "center",
        marginBottom: 24,
    },
    avatarWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: "hidden",
        backgroundColor: "#1f2937",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    avatarFallback: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarInitial: {
        fontSize: 40,
        fontWeight: "bold",
        color: "#f9fafb",
    },
    userName: {
        fontSize: 18,
        marginTop: 12,
    },
    actions: {
        width: "100%",
        marginTop: 16,
        gap: 12,
    },
    button: {
        backgroundColor: "#3b82f6",
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: "#f9fafb",
        fontWeight: "600",
    },
    errorText: {
        marginTop: 12,
        color: "#f87171",
        textAlign: "center",
    },
    successText: {
        marginTop: 12,
        color: "#4ade80",
        textAlign: "center",
    },
});
