import { useState } from 'react';
import ChatService from '../lib/appwrite/chat';
import { useAuth } from '../context/authContext';

export const useChat = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startChat = async (targetUserId) => {
    if (!user?.$id) return null;
    
    setLoading(true);
    setError(null);
    try {
      const chat = await ChatService.createOrGetChat(user.$id, targetUserId);
      return chat;
    } catch (err) {
      console.error(err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { startChat, loading, error };
};
