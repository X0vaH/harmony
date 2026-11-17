import { useState, useEffect } from "react";
import { getHistorique } from "../data/historiqueManager.js";

/**
 * Hook personnalisé pour gérer les salons de discussion et leurs messages associés.
 * @param userId
 * @returns {{salons: *[], messagesBySalon: {}, setSalons: (value: (((prevState: *[]) => *[]) | *[])) => void, setMessagesBySalon: (value: (((prevState: {}) => {}) | {})) => void}}
 */
export function useSalons(userId) {
    const [salons, setSalons] = useState([]);
    const [messagesBySalon, setMessagesBySalon] = useState({});

    useEffect(() => {
        const historique = getHistorique();
        let salonsFromHistory = [];
        let messagesFromHistory = {};
        let addMembersFromHistory = [];

        historique.forEach(entry => {
            if (entry.type === "salon") {
                if (!salonsFromHistory.find(s => s.id === entry.id)) {
                    salonsFromHistory.push({
                        id: entry.id,
                        name: entry.name,
                        members: entry.members,
                    });
                }
            } else if (entry.type === "add_member") {
                addMembersFromHistory.push(entry);
            } else if (entry.salonId) {
                messagesFromHistory[entry.salonId] = messagesFromHistory[entry.salonId] || [];
                if (!messagesFromHistory[entry.salonId].some(msg => msg.id === entry.id)) {
                    messagesFromHistory[entry.salonId].push(entry);
                }
            }
        });

        addMembersFromHistory.forEach(add => {
            let idx = salonsFromHistory.findIndex(s => s.id === add.salonId);
            if (idx !== -1 && !salonsFromHistory[idx].members.includes(add.userId)) {
                salonsFromHistory[idx].members = [...salonsFromHistory[idx].members, add.userId];
            }
        });

        setSalons(salonsFromHistory);
        setMessagesBySalon(messagesFromHistory);
    }, [userId]);

    return { salons, messagesBySalon, setSalons, setMessagesBySalon };
}