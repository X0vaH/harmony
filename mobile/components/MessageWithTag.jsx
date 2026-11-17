import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, Alert, useColorScheme} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import {useTranslation} from 'react-i18next';
import {TAGS} from '../app/utils/tags';
import {
    getTagsByMessageId,
    updateTag,
    createTags,
    destroyTag,
} from '../data/apiManager';

/**
 * Composant affichant un message avec la possibilité de lui associer une étiquette (tag).
 * @param message message
 * @param isCurrentUser indique si le message appartient à l'utilisateur courant
 * @param filterTag étiquette de filtre (optionnel)
 * @returns {React.JSX.Element|null}
 * @constructor
 */
export default function MessageWithTag({message, isCurrentUser = false, filterTag = null}) {
    const {t} = useTranslation();
    const [currentTag, setCurrentTag] = useState(null);
    const msgId = message?.id;
    const theme = useColorScheme();
    const textColor = theme === 'dark' ? '#fff' : '#000';

    useEffect(() => {
        let mounted = true;
        async function fetchTag() {
            if (!msgId) return;
            try {
                const res = await getTagsByMessageId(msgId);
                const tagName = res?.data?.[0]?.tag_name ?? null;
                if (mounted) setCurrentTag(tagName);
            } catch (err) {
                console.warn('[getTagsByMessageId] ', err?.message ?? err);
            }
        }
        fetchTag();
        return () => { mounted = false; };
    }, [msgId]);

    if (filterTag && currentTag !== filterTag) return null;

    const handleTagChange = async (newTag) => {
        try {
            if (currentTag) {
                if (!newTag) {
                    await destroyTag(msgId);
                    setCurrentTag(null);
                } else {
                    await updateTag(msgId, newTag);
                    setCurrentTag(newTag);
                }
            } else {
                if (newTag) {
                    await createTags(newTag, msgId);
                    setCurrentTag(newTag);
                }
            }
        } catch (error) {
            console.error('[MessageWithTag] tag error', error);
            Alert.alert(t('error') || 'Error', error?.message || String(error));
        }
    };

    const formattedDate = message?.date
        ? new Date(message.date).toLocaleString()
        : '';

    return (
        <View style={[
            styles.wrapper,
            { justifyContent: isCurrentUser ? 'flex-end' : 'flex-start' }
        ]}>
            <View style={styles.bubble}>
                <Text style={[styles.content, {color: textColor}]}>{message?.content}</Text>
                <Text style={[styles.date, {color: textColor}]}>{formattedDate}</Text>

                <View style={styles.pickerContainer}>
                    <RNPickerSelect
                        onValueChange={(value) => handleTagChange(value)}
                        items={TAGS.map(tag => ({ label: tag, value: tag }))}
                        placeholder={{ label: t('select_a_tag'), value: null }}
                        value={currentTag ?? ''}
                        style={{
                            ...pickerStyles,
                            inputIOS: {...pickerStyles.inputIOS, color: textColor},
                            inputAndroid: {...pickerStyles.inputAndroid, color: textColor},
                        }}
                        useNativeAndroidPickerStyle={false}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 12,
        paddingHorizontal: 12,
        flexDirection: 'row',
    },
    bubble: {
        maxWidth: '100%',

        borderRadius: 8,
    },
    content: {
        fontSize: 14,
    },
    date: {
        fontSize: 11,
        marginTop: 6,
    },
    pickerContainer: {
        marginTop: 8,
        width: 150,
    },
});

const pickerStyles = {
    inputIOS: {
        fontSize: 13,
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
    },
    inputAndroid: {
        fontSize: 13,
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
    },
};