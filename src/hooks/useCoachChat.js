import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Hook to check if the current user has an assigned coach/bewindvoerder
 * @param {string|null} userId - The current user's ID
 * @returns {{ hasCoach: boolean, coach: object|null, relation: object|null, loading: boolean }}
 */
export function useCoachRelation(userId) {
  const [hasCoach, setHasCoach] = useState(false);
  const [coach, setCoach] = useState(null);
  const [relation, setRelation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoachRelation = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch the coach-client relation for this user
        const { data: relationData, error: relationError } = await supabase
          .from("coach_client_relations")
          .select("*, coach:coaches(*)")
          .eq("client_user_id", userId)
          .eq("status", "actief")
          .single();

        // Ignore common errors: PGRST116 = no rows found, 403/42501 = RLS policy violation (user has no coach)
        if (relationError && relationError.code !== "PGRST116" && relationError.code !== "42501" && relationError.message?.indexOf("403") === -1) {
          console.error("Error fetching coach relation:", relationError);
        }

        if (relationData) {
          setRelation(relationData);
          setCoach(relationData.coach);
          setHasCoach(true);
        } else {
          setRelation(null);
          setCoach(null);
          setHasCoach(false);
        }
      } catch (error) {
        console.error("Error in useCoachRelation:", error);
        setHasCoach(false);
      } finally {
        setLoading(false);
      }
    };

    fetchCoachRelation();
  }, [userId]);

  return { hasCoach, coach, relation, loading };
}

/**
 * Hook to manage chat conversations for a client (jongere)
 * @param {string|null} userId - The current user's ID
 * @returns {{ conversation: object|null, loading: boolean, refetch: function }}
 */
export function useClientConversation(userId) {
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchConversation = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch the conversation where this user is the client
      const { data, error } = await supabase
        .from("chat_conversations")
        .select(`
          *,
          coach:coaches(*)
        `)
        .eq("client_user_id", userId)
        .single();

      // Ignore common errors: PGRST116 = no rows found, 403/42501 = RLS policy violation (user has no coach)
      if (error && error.code !== "PGRST116" && error.code !== "42501" && error.message?.indexOf("403") === -1) {
        console.error("Error fetching conversation:", error);
      }

      if (data) {
        setConversation(data);
      }
    } catch (error) {
      console.error("Error in useClientConversation:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchConversation();

    // Subscribe to conversation updates
    const channel = supabase
      .channel(`client-conversation-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_conversations",
          filter: `client_user_id=eq.${userId}`,
        },
        () => {
          fetchConversation();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchConversation]);

  return { conversation, loading, refetch: fetchConversation };
}

/**
 * Hook to manage chat messages for a conversation
 * @param {string|null} conversationId - The conversation ID
 * @returns {{ messages: array, loading: boolean, sendMessage: function, markAsRead: function, unreadCount: number }}
 */
export function useClientMessages(conversationId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      setMessages(data || []);

      // Count unread messages from coach
      const unread = (data || []).filter(
        (msg) => msg.sender_type === "coach" && !msg.read_at
      ).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error in useClientMessages:", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages in this conversation
    const channel = supabase
      .channel(`client-messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Add new message to the list
          setMessages((prev) => [...prev, payload.new]);

          // Update unread count if message is from coach
          if (payload.new.sender_type === "coach") {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Update the message in the list
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? payload.new : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchMessages]);

  // Send a message as the client (user)
  const sendMessage = useCallback(
    async (content, userId) => {
      if (!conversationId || !content.trim() || !userId) {
        return false;
      }

      try {
        // Insert new message
        const { error: messageError } = await supabase
          .from("chat_messages")
          .insert({
            conversation_id: conversationId,
            sender_type: "user",
            sender_id: userId,
            content: content.trim(),
          });

        if (messageError) {
          console.error("Error sending message:", messageError);
          return false;
        }

        // Update conversation's last_message_at and increment coach_unread_count
        const { error: convError } = await supabase
          .from("chat_conversations")
          .update({
            last_message_at: new Date().toISOString(),
            coach_unread_count: supabase.rpc("increment", { x: 1 }),
          })
          .eq("id", conversationId);

        if (convError) {
          // Try alternative approach for incrementing
          const { data: convData } = await supabase
            .from("chat_conversations")
            .select("coach_unread_count")
            .eq("id", conversationId)
            .single();

          if (convData) {
            await supabase
              .from("chat_conversations")
              .update({
                last_message_at: new Date().toISOString(),
                coach_unread_count: (convData.coach_unread_count || 0) + 1,
              })
              .eq("id", conversationId);
          }
        }

        return true;
      } catch (error) {
        console.error("Error in sendMessage:", error);
        return false;
      }
    },
    [conversationId]
  );

  // Mark all messages from coach as read
  const markAsRead = useCallback(async () => {
    if (!conversationId) return;

    try {
      // Mark all unread messages from coach as read
      await supabase
        .from("chat_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("sender_type", "coach")
        .is("read_at", null);

      // Reset client_unread_count on conversation
      await supabase
        .from("chat_conversations")
        .update({ client_unread_count: 0 })
        .eq("id", conversationId);

      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [conversationId]);

  return {
    messages,
    loading,
    sendMessage,
    markAsRead,
    unreadCount,
    refetch: fetchMessages,
  };
}

/**
 * Hook to get the total unread message count for the header badge
 * @param {string|null} userId - The current user's ID
 * @returns {{ unreadCount: number, loading: boolean }}
 */
export function useUnreadMessageCount(userId) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        // Get the conversation for this client
        const { data: conversation, error: convError } = await supabase
          .from("chat_conversations")
          .select("client_unread_count")
          .eq("client_user_id", userId)
          .single();

        // Ignore common errors: PGRST116 = no rows found, 403/42501 = RLS policy violation (user has no coach)
        if (convError && convError.code !== "PGRST116" && convError.code !== "42501" && convError.message?.indexOf("403") === -1) {
          console.error("Error fetching unread count:", convError);
        }

        setUnreadCount(conversation?.client_unread_count || 0);
      } catch (error) {
        console.error("Error in useUnreadMessageCount:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCount();

    // Subscribe to conversation updates to get unread count changes
    const channel = supabase
      .channel(`client-unread-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_conversations",
          filter: `client_user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            setUnreadCount(payload.new.client_unread_count || 0);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          // If new message is from coach, increment unread count
          if (payload.new.sender_type === "coach") {
            fetchUnreadCount();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { unreadCount, loading };
}
