
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { User } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';

export default function YOLChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();

  // Drag state
  const [fabPosition, setFabPosition] = useState({ x: null, y: null });
  const fabRef = useRef(null);
  const isDragging = useRef(false);
  const didDrag = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  // Load saved FAB position
  useEffect(() => {
    try {
      const savedPos = localStorage.getItem('yolFabPosition');
      if (savedPos) {
        const parsedPos = JSON.parse(savedPos);
        if (typeof parsedPos.x === 'number' && typeof parsedPos.y === 'number') {
          setFabPosition(parsedPos);
        }
      }
    } catch (error) {
      console.error("Failed to load YO-L FAB position from localStorage", error);
    }
  }, []);

  // Save FAB position
  useEffect(() => {
    try {
      if (fabPosition.x !== null && fabPosition.y !== null) {
        localStorage.setItem('yolFabPosition', JSON.stringify(fabPosition));
      } else {
        localStorage.removeItem('yolFabPosition');
      }
    } catch (error) {
      console.error("Failed to save YO-L FAB position to localStorage", error);
    }
  }, [fabPosition]);

  useEffect(() => {
    if (isOpen && !conversationId) {
      initConversation();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initConversation = async () => {
    try {
      console.log('🚀 YO-L: Starting conversation...');
      console.log('👤 User:', user);
      
      const conversation = await base44.agents.createConversation({
        agent_name: 'YOL',
        metadata: {
          name: `Chat met YO-L - ${new Date().toLocaleDateString('nl-NL')}`,
          description: 'Budget coaching gesprek'
        }
      });
      
      console.log('✅ YO-L: Conversation created:', conversation);
      setConversationId(conversation.id);
      
      // Welkomstbericht
      setMessages([{
        role: 'assistant',
        content: `Yo ${user?.voornaam || 'daar'}! 👋 Ik ben YO-L, je persoonlijke budget coach!\n\nIk kan je helpen met:\n💰 Je budget begrijpen\n💡 Bespaartips\n📊 Uitleg over je financiën\n🎯 Hulp met je potjes\n\nWaar kan ik je mee helpen?`
      }]);
    } catch (error) {
      console.error('❌ YO-L: Error creating conversation:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast({ 
        title: 'Fout bij opstarten', 
        description: error.message || 'Kon chat niet starten',
        variant: 'destructive' 
      });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !conversationId || sending) return;

    const userMessage = inputMessage.trim();
    console.log('📤 YO-L: Sending message:', userMessage);
    console.log('💬 Conversation ID:', conversationId);
    
    setInputMessage('');
    setSending(true);

    try {
      const conversation = await base44.agents.getConversation(conversationId);
      console.log('📋 YO-L: Got conversation:', conversation);
      
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage
      });
      
      console.log('✅ YO-L: Message sent successfully');
    } catch (error) {
      console.error('❌ YO-L: Error sending message:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast({ 
        title: 'Fout bij versturen', 
        description: error.message || 'Kon bericht niet versturen',
        variant: 'destructive' 
      });
    } finally {
      setSending(false);
    }
  };

  // Drag handlers
  const handleFabDragMove = React.useCallback((e) => {
    if (!isDragging.current) return;
    didDrag.current = true;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const fabElement = fabRef.current;
    if (!fabElement) return;

    const newX = clientX - dragStart.current.offsetX;
    const newY = clientY - dragStart.current.offsetY;

    const clampedX = Math.max(0, Math.min(newX, window.innerWidth - fabElement.offsetWidth));
    const clampedY = Math.max(0, Math.min(newY, window.innerHeight - fabElement.offsetHeight));

    setFabPosition({ x: clampedX, y: clampedY });
  }, []);

  const handleFabDragEnd = React.useCallback(() => {
    isDragging.current = false;
    window.removeEventListener('mousemove', handleFabDragMove);
    window.removeEventListener('mouseup', handleFabDragEnd);
    window.removeEventListener('touchmove', handleFabDragMove);
    window.removeEventListener('touchend', handleFabDragEnd);
    
    setTimeout(() => {
        didDrag.current = false;
    }, 0);
  }, [handleFabDragMove]);

  const handleFabDragStart = React.useCallback((e) => {
    isDragging.current = true;
    didDrag.current = false;

    const fabElement = fabRef.current;
    if (!fabElement) return;

    const rect = fabElement.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    dragStart.current = {
      x: clientX,
      y: clientY,
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
    };

    setFabPosition({ x: rect.left, y: rect.top });

    window.addEventListener('mousemove', handleFabDragMove);
    window.addEventListener('mouseup', handleFabDragEnd);
    window.addEventListener('touchmove', handleFabDragMove);
    window.addEventListener('touchend', handleFabDragEnd);
  }, [handleFabDragMove, handleFabDragEnd]);

  useEffect(() => {
      return () => {
          if (isDragging.current) {
              handleFabDragEnd();
          }
      };
  }, [handleFabDragEnd]);

  const quickQuestions = [
    "Hoeveel kan ik nog uitgeven deze maand?",
    "Zijn mijn vaste lasten te hoog?",
    "Geef me 3 bespaartips",
    "Wat is een VTBL-berekening?"
  ];

  const defaultStyle = {
    right: '20px',
    bottom: 'calc(160px + env(safe-area-inset-bottom))',
  };

  const draggedStyle = fabPosition.x !== null ? {
    left: `${fabPosition.x}px`,
    top: `${fabPosition.y}px`,
  } : defaultStyle;

  return (
    <>
      {/* FAB Button - DRAGGABLE */}
      <motion.div
        ref={fabRef}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.2, type: 'spring' }}
        className="fixed z-50"
        style={{
          ...draggedStyle,
          cursor: isDragging.current ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        onMouseDown={handleFabDragStart}
        onTouchStart={handleFabDragStart}
      >
        <Button
          onClick={(e) => {
            if (didDrag.current) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            if (fabPosition.x !== null) {
              setFabPosition({ x: null, y: null });
            }
            setIsOpen(!isOpen);
          }}
          size="lg"
          className={`rounded-full w-14 h-14 shadow-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-300 ${!isDragging.current && !didDrag.current ? 'hover:scale-110' : ''} ${isDragging.current ? 'scale-110' : ''}`}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Sparkles className="w-6 h-6 text-white" />
          )}
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed z-40 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
            style={{
              right: '20px',
              bottom: 'calc(224px + env(safe-area-inset-bottom))',
              width: 'calc(100vw - 40px)',
              maxWidth: '420px',
              height: 'calc(100vh - 280px - env(safe-area-inset-bottom))',
              maxHeight: '600px',
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg">YO-L</h3>
                <p className="text-green-100 text-xs">Je Budget Coach</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-green-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <ReactMarkdown
                        className="text-sm prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                        components={{
                          h1: ({ children }) => <h1 className="text-base font-bold mt-2 mb-1">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-sm font-bold mt-2 mb-1">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-semibold mt-1 mb-1">{children}</h3>,
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="text-sm">{children}</li>,
                          code: ({ inline, children }) => 
                            inline ? (
                              <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{children}</code>
                            ) : (
                              <code className="block bg-gray-100 p-2 rounded text-xs mb-2">{children}</code>
                            ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-green-500 pl-3 italic text-gray-600 my-2">
                              {children}
                            </blockquote>
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions (only show when no messages yet) */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 space-y-2">
                <p className="text-xs text-gray-500 font-medium">Snelle vragen:</p>
                <div className="grid grid-cols-1 gap-2">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputMessage(q)}
                      className="text-left text-xs bg-white hover:bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Stel je vraag aan YO-L..."
                  rows={1}
                  className="resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  disabled={sending || !inputMessage.trim()}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>

            <div className="bg-gray-50 px-4 py-2 border-t text-xs text-gray-500 text-center">
              💡 YO-L gebruikt AI - controleer altijd belangrijke info
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
