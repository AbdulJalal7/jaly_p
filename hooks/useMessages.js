import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import client from '../lib/appwrite/client';
import ChatService from '../lib/appwrite/chat';

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const MESSAGES_COLLECTION_ID = "messages";

export const useMessages = (chatId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!chatId) return;
    try {
      setLoading(true);
      const docs = await ChatService.getMessages(chatId, 50, 0);
      setMessages(docs);
    } catch (error) {
      // console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    fetchMessages();

    let unsubscribe = null;

    const subscribeToChat = () => {
      if (unsubscribe) return;
      unsubscribe = client.subscribe(
        `databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents`,
        (response) => {
          // Only handle new messages for this particular chat
          if (
            response.events.includes("databases.*.collections.*.documents.*.create") &&
            response.payload.chat_id === chatId
          ) {
            // Prepend the new message to our list
            setMessages((prevMessages) => {
              // Avoid duplicates
              if (prevMessages.find(m => m.$id === response.payload.$id)) {
                 return prevMessages;
              }
              return [response.payload, ...prevMessages];
            });
          }
        }
      );
    };

    const cleanupSubscription = () => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    };

    // Initial subscribe
    subscribeToChat();

    // Handle AppState
    const appStateSubscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        subscribeToChat();
        // Refresh messages in case we missed any while in background
        fetchMessages();
      } else if (nextAppState === "background" || nextAppState === "inactive") {
        cleanupSubscription();
      }
    });

    return () => {
      cleanupSubscription();
      appStateSubscription.remove();
    };
  }, [chatId, fetchMessages]);

  const sendNewMessage = async (senderId, receiverId, messageText) => {
    try {
      setSending(true);
      await ChatService.sendMessage(chatId, senderId, receiverId, messageText, 'text');
    } catch (error) {
      // console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  return { messages, loading, sending, sendNewMessage, fetchMessages };
};
