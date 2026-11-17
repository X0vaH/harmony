import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function useMessageDeffere(sendToServer) {
    const [isConnected, setIsConnected] = useState(true);
    const [messageQueue, setMessageQueue] = useState([]);

    useEffect(() => {
        const loadQueue = async () => {
            try {
                const storedQueue = await AsyncStorage.getItem('messageQueue');
                if (storedQueue) {
                    setMessageQueue(JSON.parse(storedQueue));
                }
            } catch (error) {
                console.error('Failed to load message queue:', error);
            }
        };

        loadQueue();

        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsConnected(state.isConnected);
            if (state.isConnected) {
                flushMessageQueue();
            }
        });

        return () => unsubscribe();
    }, []);

    const saveQueue = async (queue) => {
        try {
            await AsyncStorage.setItem('messageQueue', JSON.stringify(queue));
        } catch (error) {
            console.error('Failed to save message queue:', error);
        }
    };

    const queueMessage = (message) => {
        setMessageQueue((prevQueue) => {
            const updatedQueue = [...prevQueue, message];
            saveQueue(updatedQueue);
            return updatedQueue;
        });
    };

    const flushMessageQueue = async () => {
        while (messageQueue.length > 0) {
            const [message, ...remainingQueue] = messageQueue;
            try {
                await sendToServer(message);
                setMessageQueue(remainingQueue);
                saveQueue(remainingQueue);
            } catch (error) {
                console.error('Failed to send queued message:', error);
                break;
            }
        }
    };

    const sendMessage = async (message) => {
        if (isConnected) {
            try {
                await sendToServer(message);
            } catch (error) {
                console.error('Message send failed, queuing:', error);
                queueMessage(message);
            }
        } else {
            queueMessage(message);
        }
    };

    return { sendMessage };
}