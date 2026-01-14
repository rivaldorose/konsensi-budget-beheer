import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import {
  useCoachRelation,
  useClientConversation,
  useClientMessages,
} from "@/hooks/useCoachChat";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Send,
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  MessageCircle,
  Info,
  PlusCircle,
  Smile,
  Search,
  Edit3,
} from "lucide-react";

// Format relative time in Dutch
function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Zojuist";
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours}u`;
  if (diffDays < 7) return `${diffDays}d`;
  return new Intl.DateTimeFormat("nl", {
    day: "numeric",
    month: "short",
  }).format(date);
}

// Format time for messages
function formatMessageTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("nl", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Group messages by date
function getDateLabel(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (messageDate.getTime() === today.getTime()) {
    return `Vandaag, ${formatMessageTime(dateString)}`;
  }
  if (messageDate.getTime() === yesterday.getTime()) {
    return "Gisteren";
  }
  return new Intl.DateTimeFormat("nl", {
    day: "numeric",
    month: "long",
  }).format(date);
}

export default function CoachChat() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await User.me();
        if (!userData) {
          navigate("/login");
          return;
        }
        setUser(userData);
      } catch (error) {
        console.error("Error loading user:", error);
        navigate("/login");
      }
    };
    loadUser();
  }, [navigate]);

  // Get coach relation
  const { hasCoach, coach, loading: coachLoading } = useCoachRelation(user?.id);

  // Get conversation
  const { conversation, loading: convLoading } = useClientConversation(user?.id);

  // Get messages
  const {
    messages,
    loading: messagesLoading,
    sendMessage,
    markAsRead,
  } = useClientMessages(conversation?.id);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (conversation?.id) {
      markAsRead();
    }
  }, [conversation?.id, markAsRead]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    const success = await sendMessage(newMessage, user.id);
    if (success) {
      setNewMessage("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "48px";
      }
    }
    setSending(false);
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    setNewMessage(e.target.value);
    const textarea = e.target;
    textarea.style.height = "48px";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  // Get coach name and initials
  const coachName = coach?.name || "Jouw Coach";
  const coachInitials = coachName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const coachRole = coach?.organization || "Budgetcoach";

  // Loading state
  if (coachLoading || convLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-gray-400 dark:border-[#3a3a3a] mx-auto"></div>
          <p className="text-gray-600 dark:text-[#a1a1a1] text-sm mt-4">
            Chat laden...
          </p>
        </div>
      </div>
    );
  }

  // No coach assigned
  if (!hasCoach || !coach) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="bg-gray-100 dark:bg-[#1a1a1a] rounded-full p-6 mb-6">
          <MessageCircle className="w-16 h-16 text-gray-400 dark:text-[#6b7280]" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Nog geen coach toegewezen
        </h1>
        <p className="text-gray-600 dark:text-[#a1a1a1] max-w-md mb-6">
          Je hebt nog geen budgetcoach of bewindvoerder toegewezen gekregen.
          Zodra je gekoppeld bent aan een coach, kun je hier met hem of haar
          chatten.
        </p>
        <Button
          onClick={() => navigate("/Dashboard")}
          className="bg-primary hover:bg-[#0da672] text-[#0d1b17] dark:text-black font-bold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Terug naar Dashboard
        </Button>
      </div>
    );
  }

  // Group messages by date for date dividers
  let lastDateLabel = "";

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Left Sidebar - Conversations (Desktop only) */}
      <aside className="hidden lg:flex w-[380px] shrink-0 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-gray-200 dark:border-[#2a2a2a] flex-col overflow-hidden">
        {/* Sidebar Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-[#2a2a2a] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xl text-gray-900 dark:text-white">
              Gesprekken
            </h3>
            <Edit3 className="w-5 h-5 text-gray-600 dark:text-[#a1a1a1] cursor-pointer hover:text-primary" />
          </div>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-[#a1a1a1]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek coach of bewindvoerder..."
              className="w-full h-11 pl-11 pr-4 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#6b7280] focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Active Conversation */}
          <div className="group flex items-center gap-3 p-3 rounded-xl bg-primary/10 dark:bg-[#2a2a2a]/50 border-r-4 border-primary cursor-pointer transition-all">
            <div className="relative shrink-0">
              <Avatar className="w-12 h-12 border border-white dark:border-[#3a3a3a] shadow-sm">
                <AvatarImage src={coach?.avatar_url} />
                <AvatarFallback className="bg-primary text-[#0d1b17] dark:text-black font-bold">
                  {coachInitials}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-white dark:border-[#1a1a1a] rounded-full"></span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">
                  {coachName}
                </p>
                <p className="text-primary text-xs font-medium">
                  {messages.length > 0
                    ? formatRelativeTime(messages[messages.length - 1]?.created_at)
                    : ""}
                </p>
              </div>
              <p className="text-gray-500 dark:text-[#a1a1a1] text-xs truncate">
                {messages.length > 0
                  ? messages[messages.length - 1]?.content?.slice(0, 40)
                  : "Start een gesprek..."}
              </p>
              <p className="text-primary text-[10px] font-bold mt-1 uppercase tracking-wider">
                {coachRole}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Right Chat Window */}
      <section className="flex-1 flex flex-col bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
        {/* Chat Header */}
        <div className="px-4 md:px-6 py-4 border-b border-gray-100 dark:border-[#2a2a2a] flex items-center justify-between shrink-0 bg-white dark:bg-[#1a1a1a]/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Back button on mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="lg:hidden text-gray-600 dark:text-[#a1a1a1] -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="relative">
              <Avatar className="w-10 md:w-11 h-10 md:h-11 border border-gray-100 dark:border-[#3a3a3a]">
                <AvatarImage src={coach?.avatar_url} />
                <AvatarFallback className="bg-primary text-[#0d1b17] dark:text-black font-bold">
                  {coachInitials}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-white dark:border-[#1a1a1a] rounded-full"></span>
            </div>
            <div className="flex flex-col">
              <h3 className="font-semibold text-base md:text-lg text-gray-900 dark:text-white leading-none mb-1">
                {coachName}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-primary text-xs font-medium">Online</span>
                <span className="w-1 h-1 bg-gray-300 dark:bg-[#6b7280] rounded-full"></span>
                <span className="text-gray-500 dark:text-[#a1a1a1] text-xs hidden sm:inline">
                  Jouw {coachRole}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 dark:text-[#a1a1a1] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary transition-colors">
              <Phone className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate("/VideoCall")}
              className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 dark:text-[#a1a1a1] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary transition-colors"
              title="Video gesprekken"
            >
              <Video className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-[#2a2a2a] mx-1 hidden sm:block"></div>
            <button className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 dark:text-[#a1a1a1] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary transition-colors">
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white dark:bg-[#161616] flex flex-col gap-4 md:gap-6">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-[#a1a1a1]">
                Berichten laden...
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="bg-gray-100 dark:bg-[#2a2a2a] rounded-full p-4 mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400 dark:text-[#6b7280]" />
              </div>
              <p className="text-gray-600 dark:text-[#a1a1a1] font-medium">
                Nog geen berichten
              </p>
              <p className="text-sm text-gray-500 dark:text-[#6b7280] mt-1">
                Stuur een bericht om het gesprek te starten
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isFromUser = message.sender_type === "user";
              const dateLabel = getDateLabel(message.created_at);
              const showDateDivider = dateLabel !== lastDateLabel;
              if (showDateDivider) {
                lastDateLabel = dateLabel;
              }

              return (
                <React.Fragment key={message.id}>
                  {/* Date Divider */}
                  {showDateDivider && (
                    <div className="flex justify-center">
                      <span className="text-xs font-medium text-gray-500 dark:text-[#6b7280] bg-gray-50 dark:bg-[#2a2a2a]/50 px-3 py-1 rounded-full border border-gray-100 dark:border-[#3a3a3a]">
                        {dateLabel}
                      </span>
                    </div>
                  )}

                  {/* Message */}
                  {isFromUser ? (
                    // User message (right side)
                    <div className="flex flex-col gap-1 self-end max-w-[75%] md:max-w-[70%] items-end">
                      <div className="bg-primary text-[#0d1b17] dark:text-black p-3 md:p-4 rounded-2xl rounded-br-sm text-sm leading-relaxed shadow-sm font-medium">
                        {message.content}
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-[#6b7280] mr-1">
                        {formatMessageTime(message.created_at)}
                        {message.read_at && " • Gelezen"}
                      </span>
                    </div>
                  ) : (
                    // Coach message (left side)
                    <div className="flex gap-3">
                      <Avatar className="w-8 h-8 shrink-0 self-end mb-1">
                        <AvatarImage src={coach?.avatar_url} />
                        <AvatarFallback className="bg-primary text-[#0d1b17] dark:text-black text-xs font-bold">
                          {coachInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-1 max-w-[75%] md:max-w-[70%]">
                        <div className="bg-gray-100 dark:bg-[#2a2a2a] p-3 md:p-4 rounded-2xl rounded-bl-sm text-gray-900 dark:text-[#d1d5db] text-sm leading-relaxed shadow-sm">
                          {message.content}
                        </div>
                        <span className="text-[10px] text-gray-500 dark:text-[#6b7280] ml-1">
                          {formatMessageTime(message.created_at)}
                        </span>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 md:p-4 bg-white dark:bg-[#1a1a1a] border-t border-gray-100 dark:border-[#2a2a2a]">
          <div className="flex items-end gap-2 md:gap-3 max-w-[900px] mx-auto w-full">
            <button className="mb-2 shrink-0 w-10 h-10 rounded-full text-gray-500 dark:text-[#a1a1a1] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-primary transition-colors flex items-center justify-center">
              <PlusCircle className="w-6 h-6" />
            </button>
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyPress}
                placeholder="Typ een bericht..."
                rows="1"
                className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] focus:border-primary dark:focus:border-primary/50 rounded-3xl py-3 pl-5 pr-12 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#6b7280] focus:ring-1 focus:ring-primary resize-none outline-none transition-all"
                style={{ minHeight: "48px", maxHeight: "120px" }}
              />
              <button className="absolute right-3 bottom-2.5 text-gray-400 dark:text-[#a1a1a1] hover:text-primary transition-colors">
                <Smile className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className="mb-0.5 shrink-0 w-11 h-11 rounded-full bg-primary hover:bg-[#0da672] text-[#0d1b17] dark:text-black shadow-md hover:shadow-lg transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
