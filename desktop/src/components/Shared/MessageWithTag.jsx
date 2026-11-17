import {useState, useEffect} from "react";
import {TAGS} from "../utils/tags.js";
import {getTagsByMessageId, updateTag, createTags, destroyTag} from "../../data/apiManager.js";
import {useTranslation} from "react-i18next";

/**
 * Composant affichant un message avec la possibilité de lui associer une étiquette (tag).
 * @param message message
 * @param token token d'authentification
 * @param isCurrentUser indique si le message appartient à l'utilisateur courant
 * @param filterTag étiquette de filtre (optionnel)
 * @returns {JSX.Element|null}
 * @constructor
 */
function MessageWithTag({message, token, isCurrentUser, filterTag}) {
    const [currentTag, setCurrentTag] = useState(null);

    useEffect(() => {
        const fetchTag = async () => {
            try {

                console.log("début fetch")

                const tags = await getTagsByMessageId(message.id, token);
                if (tags.data[0]?.tag_name) {
                    setCurrentTag(tags.data[0].tag_name);
                }
            } catch {
                // Ignore pcq c'Est call a chaque fois qu'il y a pas de tag
            }
        };

        console.log("fin du fetch")

        fetchTag();
    }, []);

    const handleTagChange = async (newTag) => {
        try {
            if (currentTag) {
                if (newTag === "") {
                    await destroyTag(message.id, token);
                    newTag = null;
                } else {
                    await updateTag(message.id, newTag, token);
                }
            } else {
                await createTags(newTag, message.id, token);
            }
            setCurrentTag(newTag);
        } catch (error) {
            console.error("Error managing tag:", error);
        }
    };

    const {t} = useTranslation();

    if (filterTag && currentTag !== filterTag) {
        return null;
    }

    return (
        <div
            style={{
                display: "flex",
                justifyContent: isCurrentUser ? "flex-end" : "flex-start",
                marginBottom: "1rem",
            }}
        >
            <div
                style={{
                    maxWidth: "80%",
                    padding: "0.5rem",
                    borderRadius: "8px",
                    textAlign: "left",
                    position: "relative",
                    alignSelf: isCurrentUser ? "flex-end" : "flex-start",
                }}
            >
                <div>{message.content}</div>
                <div style={{fontSize: "0.8rem", color: "gray", marginTop: "0.5rem"}}>
                    {message.date}
                </div>
                <div style={{marginTop: "0.5rem"}}>
                    <select
                        value={currentTag || ""}
                        onChange={(e) => handleTagChange(e.target.value)}
                        style={{
                            fontSize: "0.7rem",
                            padding: "0.1rem",
                            borderRadius: "4px",
                            width: "150px",
                        }}
                    >
                        <option value="">{t("select_a_tag")}</option>
                        {TAGS.map((tag) => (
                            <option key={tag} value={tag}>
                                {tag}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}

export default MessageWithTag;