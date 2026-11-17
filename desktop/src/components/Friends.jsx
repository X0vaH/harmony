import React, { useEffect, useState, useContext } from 'react';
import { Button, ListGroup, Row, Col, Form } from 'react-bootstrap';
import { UserContext } from './contexts/UserContext.js';
import { useTranslation } from 'react-i18next';
import {
    getFriends,
    getPendingFriendRequests,
    getUsers,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    getSentPendingRequests
} from '../data/apiManager.js';

function Friends() {
    const { user } = useContext(UserContext);
    const { t } = useTranslation();
    const token = user?.token;

    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');

    const fetchAll = async () => {
        if (!token) return;
        try {
            const [friendsData, pendingData, sentPendingData, usersData] = await Promise.all([
                getFriends(token),
                getPendingFriendRequests(token),
                getSentPendingRequests(token),
                getUsers(token)
            ]);

            setFriends(friendsData);
            setPendingRequests(pendingData);

            const allUsers = usersData.data.filter(u => u.id !== user.user.id);
            const myId = user.user.id;

            let excludedIds = new Set();

            friendsData.forEach(f => {
                excludedIds.add(f.sender_id === myId ? f.receiver_id : f.sender_id);
            });

            pendingData.forEach(p => {
                excludedIds.add(p.sender_id);
            });

            sentPendingData.forEach(p => {
                excludedIds.add(p.receiver_id);
            });

            const nonRelatedUsers = allUsers.filter(u => !excludedIds.has(u.id));

            setUsers(nonRelatedUsers);

        } catch (e) {
            console.error('Erreur fetchAll', e);
        }
    };

    useEffect(() => {
        fetchAll();
    }, [token]);

    const handleSendRequest = async () => {
        if (!selectedUser) return;
        try {
            await sendFriendRequest(selectedUser, token);
            setSelectedUser('');
            await fetchAll();
        } catch (e) {
            console.error('Erreur sendFriendRequest', e);
            alert(e.response?.data?.message || e.message);
        }
    };

    const handleAccept = async (requestId) => {
        try {
            await acceptFriendRequest(requestId, token);
            await fetchAll();
        } catch (e) {
            console.error('Erreur acceptFriendRequest', e);
        }
    };

    const handleDecline = async (requestId) => {
        try {
            await declineFriendRequest(requestId, token);
            await fetchAll();
        } catch (e) {
            console.error('Erreur declineFriendRequest', e);
        }
    };

    return (
        <div>
            <h2>{t('mesAmis')}</h2>
            <ListGroup className="mb-4">
                {friends.length === 0 && <ListGroup.Item>{t('aucunAmi')}</ListGroup.Item>}
                {friends.map(f => (
                    <ListGroup.Item key={f.id}>
                        {f.sender_id === user.user.id ? f.receiver.name : f.sender.name}
                    </ListGroup.Item>
                ))}
            </ListGroup>

            <h3>{t('demandeAmi')}</h3>
            <ListGroup className="mb-4">
                {pendingRequests.length === 0 && <ListGroup.Item>{t('aucuneDemande')}</ListGroup.Item>}
                {pendingRequests.map(req => (
                    <ListGroup.Item key={req.id}>
                        {req.sender.name}
                        <Button variant="success" size="sm" className="ms-2" onClick={() => handleAccept(req.id)}>{t('accepter')}</Button>
                        <Button variant="danger" size="sm" className="ms-2" onClick={() => handleDecline(req.id)}>{t('refuser')}</Button>
                    </ListGroup.Item>
                ))}
            </ListGroup>

            <h3>{t('ajouterAmi')}</h3>
            <Row className="align-items-center">
                <Col md={8}>
                    <Form.Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                        <option value="">{t('selectUtilisateur')}</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </Form.Select>
                </Col>
                <Col md={4}>
                    <Button onClick={handleSendRequest} disabled={!selectedUser}>{t('send')}</Button>
                </Col>
            </Row>
        </div>
    );
}

export default Friends;