import React, { useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { getMessages, getSalons, getUsers } from "../data/apiManager.js";
import { UserContext } from "./contexts/UserContext.js";

/**
 * Composant du panneau d'administration pour gérer les utilisateurs, salons et messages.
 * @returns {React.JSX.Element} - Le composant AdminPanel.
 * @constructor
 */
export default function AdminPanel() {
    const { t } = useTranslation();
    const { user } = useContext(UserContext);
    const token = user?.token;

    const [users, setUsers] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [messages, setMessages] = useState([]);
    const [activeSection, setActiveSection] = useState(null);

    const loadUsers = async () => {
        try {
            const response = await getUsers(token);
            setUsers(response.data);
            setActiveSection("users");
        } catch (error) {
            console.error("Erreur lors du chargement des utilisateurs :", error);
        }
    };

    const loadRooms = async () => {
        try {
            const response = await getSalons(token);
            setRooms(response.data);
            setActiveSection("rooms");
        } catch (error) {
            console.error("Erreur lors du chargement des salons :", error);
        }
    };

    const loadMessages = async () => {
        try {
            const response = await getMessages(token);
            console.log(response.data);
            setMessages(response.data);
            setActiveSection("messages");
        } catch (error) {
            console.error("Erreur lors du chargement des messages :", error);
        }
    };

    const deleteUser = async (id) => {
        if (!window.confirm("Supprimer cet utilisateur ?")) return;
        await fetch(`https://definitelynotharmony.dev/api/user/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(users.filter(u => u.id !== id));
    };

    const deleteRoom = async (id) => {
        if (!window.confirm("Supprimer ce salon ?")) return;
        await fetch(`https://definitelynotharmony.dev/api/salons/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        setRooms(rooms.filter(r => r.id !== id));
    };

    const deleteMessage = async (id) => {
        if (!window.confirm("Supprimer ce message ?")) return;
        await fetch(`https://definitelynotharmony.dev/api/messages/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(messages.filter(m => m.id !== id));
    };


    const changerPrivate = async (roomId, isPrivate) => {
        // Declare and initialize `nouvelleIsPrivate`
        const nouvelleIsPrivate = isPrivate ? 0 : 1;

        // Confirmation message
        const confirmMessage = nouvelleIsPrivate
            ? (t("confirmMakePrivate") || "Are you sure you want to make this channel private?")
            : (t("confirmMakePublic") || "Are you sure you want to make this channel public?");

        if (!window.confirm(confirmMessage)) return;

        try {
            const res = await fetch(`https://definitelynotharmony.dev/api/salons/${roomId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ is_private: nouvelleIsPrivate }),
            });

            if (!res.ok) throw new Error(`Server responded ${res.status}`);

            // Update state
            setRooms(prev => prev.map(r => (r.id === roomId ? { ...r, is_private: nouvelleIsPrivate } : r)));
        } catch (err) {
            console.error("Failed to toggle privacy:", err);
            alert("Failed to update room privacy.");
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold mb-6">{t("menuAdmin")}</h1>

            <div className="flex gap-4">
                <button
                    onClick={loadUsers}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow"
                >
                    {t("users")}
                </button>
                <button
                    onClick={loadRooms}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow"
                >
                    {t("salons")}
                </button>
                <button
                    onClick={loadMessages}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded shadow"
                >
                    {t("message")}
                </button>
            </div>

            {activeSection === "users" && (
                <section>
                    <h2 className="text-2xl font-semibold mb-4">{t("users")}</h2>
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <ul className="divide-y divide-gray-200">
                            {users.map(user => (
                                <li
                                    key={user.id}
                                    className="flex items-center justify-between py-2 px-3 hover:bg-gray-50"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-gray-700 rounded-full"></span>
                                        <span>{user.name}</span>
                                    </div>
                                    <button
                                        onClick={() => deleteUser(user.id)}
                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                                    >
                                        {t("delete")}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}

            {activeSection === "rooms" && (
                <section>
                    <h2 className="text-2xl font-semibold mb-4">{t("salons")}</h2>
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <ul className="divide-y divide-gray-200">
                            {rooms.map(room => (
                                <li
                                    key={room.id}
                                    className="flex items-center justify-between py-2 px-3 hover:bg-gray-50"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-gray-700 rounded-full"></span>
                                        <span>{room.name}</span>
                                    </div>
                                    <button
                                        onClick={() => deleteRoom(room.id)}
                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                                    >
                                        {t("delete")}
                                    </button>
                                    <button
                                        onClick={() => changerPrivate(room.id, room.is_private)}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded ml-2"
                                    >
                                        {room.is_private ? (t("makePublic") || "Make public") : (t("makePrivate") || "Make private")}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}

            {activeSection === "messages" && (
                <section>
                    <h2 className="text-2xl font-semibold mb-4">{t("message")}</h2>
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <ul className="divide-y divide-gray-200">
                            {messages.map(message => (
                                <li
                                    key={message.id}
                                    className="flex items-center justify-between py-2 px-3 hover:bg-gray-50"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-gray-700 rounded-full"></span>
                                        <span>{message.contenu}</span>
                                    </div>
                                    <button
                                        onClick={() => deleteMessage(message.id)}
                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                                    >
                                        {t("delete")}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}
        </div>
    );
}