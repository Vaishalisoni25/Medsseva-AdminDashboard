import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { chatService } from '../services/chatService';
import { useAppSelector } from '../redux/hooks';
import {
  MessageCircle, Send, User, Clock, CheckCheck, Check,
  Search, RefreshCw, X, ChevronRight, Headphones,
  Bot, AlertCircle, Phone, FileText, Circle
} from 'lucide-react';

interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: 'USER' | 'BOT' | 'AGENT';
  senderId: string;
  text?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  isRead: boolean;
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
  senderName?: string;
}

interface Conversation {
  id: string;
  userId: string;
  status: 'AI_ACTIVE' | 'PENDING_HUMAN' | 'HUMAN_ACTIVE' | 'CLOSED';
  assignedToId?: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; mobile: string; avatarUrl?: string; bookings?: any[] };
  messages: ChatMessage[];
  assignedTo?: { user: { name: string } };
}

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const STATUS_LABELS: Record<string, string> = {
  AI_ACTIVE: 'AI Active',
  PENDING_HUMAN: 'Waiting',
  HUMAN_ACTIVE: 'Live',
  CLOSED: 'Closed',
};

const STATUS_COLORS: Record<string, string> = {
  AI_ACTIVE: 'bg-blue-50 text-blue-700 border-blue-200',
  PENDING_HUMAN: 'bg-amber-50 text-amber-700 border-amber-200',
  HUMAN_ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-slate-100 text-slate-500 border-slate-200',
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function groupMessagesByDate(messages: ChatMessage[]) {
  const groups: { date: string; messages: ChatMessage[] }[] = [];
  let currentDate = '';
  for (const msg of messages) {
    const date = formatDate(msg.createdAt);
    if (date !== currentDate) {
      currentDate = date;
      groups.push({ date, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }
  return groups;
}

export const SupportPage: React.FC = () => {
  const { user, token } = useAppSelector((state) => state.auth);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const storedToken = token || localStorage.getItem('medsseva_token');
    if (!storedToken) return;

    const socket = io(SOCKET_URL, { auth: { token: storedToken }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.emit('support:join_room');

    socket.on('chat:message', (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
  setConversations((prev) =>
        prev.map((c): Conversation =>
          c.id === msg.conversationId ? { ...c, messages: [msg], updatedAt: msg.createdAt } : c
        ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );
    });

    socket.on('chat:new_pending', ({ conversationId }: { conversationId: string }) => {
      loadConversations();
    });

socket.on('chat:status_change', ({ conversationId, status }: { conversationId: string; status: Conversation['status']; agentName?: string }) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, status } : c))
      );
      setActiveConv((prev) => (prev && prev.id === conversationId ? { ...prev, status } : prev));
    });

    socket.on('chat:typing', ({ conversationId, userName, isTyping: t }: any) => {
      if (activeConv?.id === conversationId) {
        setIsTyping(t);
        setTypingUser(userName);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await chatService.getAllConversations({
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setConversations(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    setMessages([]);
    try {
      const full = await chatService.getConversationById(conv.id);
      setActiveConv(full);
      setMessages(full.messages || []);
      socketRef.current?.emit('chat:join', { conversationId: conv.id });
    } catch {}
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !activeConv || sending) return;
    setSending(true);
    const text = inputText.trim();
    setInputText('');
    socketRef.current?.emit('chat:send', { conversationId: activeConv.id, text });
    setSending(false);
    inputRef.current?.focus();
  };

  const handleTyping = (val: string) => {
    setInputText(val);
    if (!activeConv) return;
    socketRef.current?.emit('chat:typing', { conversationId: activeConv.id, isTyping: true });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit('chat:typing', { conversationId: activeConv.id, isTyping: false });
    }, 1500);
  };

  const handleJoinConversation = () => {
    if (!activeConv) return;
    socketRef.current?.emit('chat:agent_join', { conversationId: activeConv.id });
  };

  const handleCloseConversation = () => {
    if (!activeConv) return;
    socketRef.current?.emit('chat:close', { conversationId: activeConv.id });
  };

  const handleReopenConversation = () => {
    if (!activeConv) return;
    socketRef.current?.emit('chat:reopen', { conversationId: activeConv.id });
  };

  const filteredConversations = conversations.filter((c) => {
    const matchSearch = !search || c.user.name.toLowerCase().includes(search.toLowerCase()) || c.user.mobile.includes(search);
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = conversations.filter((c) => c.status === 'PENDING_HUMAN').length;

  return (
    <div className="flex h-[calc(100vh-80px)] bg-background rounded-xl border overflow-hidden shadow-sm">
      <div className="w-80 flex-shrink-0 border-r flex flex-col bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-teal-600" />
              <h2 className="font-bold text-sm text-foreground">Customer Chats</h2>
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {pendingCount}
                </span>
              )}
            </div>
            <button onClick={loadConversations} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-1 flex-wrap">
            {['', 'PENDING_HUMAN', 'HUMAN_ACTIVE', 'AI_ACTIVE', 'CLOSED'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-[9px] font-black px-2 py-1 rounded-md border transition-all ${statusFilter === s ? 'bg-teal-600 text-white border-teal-600' : 'bg-muted text-muted-foreground border-transparent hover:border-border'}`}
              >
                {s === '' ? 'All' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-20">
              <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center px-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">No conversations</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const lastMsg = conv.messages?.[0];
              const isActive = activeConv?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={`flex items-start gap-3 p-3 cursor-pointer border-b border-border/50 hover:bg-muted/50 transition-colors ${isActive ? 'bg-teal-50/50 border-l-2 border-l-teal-600' : ''}`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-teal-600" />
                    </div>
                    {conv.status === 'PENDING_HUMAN' && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full border-2 border-card" />
                    )}
                    {conv.status === 'HUMAN_ACTIVE' && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground truncate">{conv.user.name}</span>
                      {lastMsg && <span className="text-[9px] text-muted-foreground flex-shrink-0 ml-1">{formatTime(lastMsg.createdAt)}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-[10px] text-muted-foreground truncate">
                        {lastMsg?.text || 'No messages yet'}
                      </p>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ml-1 flex-shrink-0 ${STATUS_COLORS[conv.status]}`}>
                        {STATUS_LABELS[conv.status]}
                      </span>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{conv.user.mobile}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center">
              <Headphones className="h-8 w-8 text-teal-400" />
            </div>
            <p className="font-bold text-foreground">Select a conversation</p>
            <p className="text-xs text-muted-foreground">Choose from the list to start responding</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{activeConv.user.name}</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${STATUS_COLORS[activeConv.status]}`}>
                      {STATUS_LABELS[activeConv.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{activeConv.user.mobile}</span>
                    {activeConv.assignedTo && (
                      <span className="text-[9px] text-teal-600 font-bold">• {activeConv.assignedTo.user.name}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeConv.status === 'PENDING_HUMAN' && (
                  <button
                    onClick={handleJoinConversation}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Headphones className="h-3.5 w-3.5" />
                    Join Chat
                  </button>
                )}
                {activeConv.status === 'HUMAN_ACTIVE' && (
                  <button
                    onClick={handleCloseConversation}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors border"
                  >
                    <X className="h-3.5 w-3.5" />
                    Close Chat
                  </button>
                )}
                {activeConv.status === 'CLOSED' && (
                  <button
                    onClick={handleReopenConversation}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reopen
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" style={{ background: '#f8fafc' }}>
              {groupMessagesByDate(messages).map((group) => (
                <div key={group.date}>
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[9px] font-bold text-muted-foreground px-2">{group.date}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  {group.messages.map((msg) => {
                    const isAgent = msg.senderType === 'AGENT';
                    const isBot = msg.senderType === 'BOT';
                    const isUser = msg.senderType === 'USER';

                    if (isBot) {
                      return (
                        <div key={msg.id} className="flex justify-center my-2">
                          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full">
                            <Bot className="h-3 w-3 text-blue-500" />
                            <span className="text-[10px] text-blue-700 font-medium">{msg.text}</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 mb-2 ${isAgent ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isAgent ? 'bg-teal-600' : 'bg-slate-200'}`}>
                          {isAgent ? <Headphones className="h-3 w-3 text-white" /> : <User className="h-3 w-3 text-slate-500" />}
                        </div>
                        <div className={`max-w-[65%] rounded-2xl px-3 py-2 ${isAgent ? 'bg-teal-600 text-white rounded-br-sm' : 'bg-white border border-border text-foreground rounded-bl-sm'}`}>
                          {msg.text && <p className="text-xs leading-relaxed">{msg.text}</p>}
                          <div className={`flex items-center gap-1 mt-1 ${isAgent ? 'justify-end' : 'justify-start'}`}>
                            <span className={`text-[9px] ${isAgent ? 'text-teal-200' : 'text-muted-foreground'}`}>
                              {formatTime(msg.createdAt)}
                            </span>
                            {isAgent && (
                              msg.isRead
                                ? <CheckCheck className="h-3 w-3 text-teal-200" />
                                : msg.deliveredAt
                                ? <CheckCheck className="h-3 w-3 text-teal-300/60" />
                                : <Check className="h-3 w-3 text-teal-300/60" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-end gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="h-3 w-3 text-slate-500" />
                  </div>
                  <div className="bg-white border border-border rounded-2xl rounded-bl-sm px-3 py-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground italic">{typingUser} is typing</span>
                      <span className="flex gap-0.5 ml-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-3 border-t bg-card">
              {activeConv.status === 'AI_ACTIVE' && (
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Bot className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-[10px] text-blue-600 font-medium">SevaBot is handling this conversation</span>
                </div>
              )}
              {activeConv.status === 'CLOSED' && (
                <div className="flex items-center gap-2 mb-2 px-1">
                  <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">This conversation is closed</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-40"
                  placeholder={
                    activeConv.status === 'CLOSED'
                      ? 'Conversation closed'
                      : activeConv.status === 'AI_ACTIVE'
                      ? 'Join conversation to reply...'
                      : 'Type a reply...'
                  }
                  disabled={activeConv.status === 'CLOSED' || activeConv.status === 'AI_ACTIVE'}
                  value={inputText}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputText.trim() || sending || activeConv.status === 'CLOSED' || activeConv.status === 'AI_ACTIVE'}
                  className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {activeConv && (
        <div className="w-64 flex-shrink-0 border-l bg-card flex flex-col">
          <div className="p-4 border-b">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">User Info</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-foreground font-medium">{activeConv.user.mobile}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  Since {new Date(activeConv.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>

            {activeConv.user.bookings && activeConv.user.bookings.length > 0 && (
              <div>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider mb-2">Recent Bookings</p>
                <div className="space-y-1.5">
                  {activeConv.user.bookings.map((b: any) => (
                    <div key={b.id} className="bg-muted rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-teal-600 font-mono">{b.bookingCode}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${b.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {b.status}
                        </span>
                      </div>
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(b.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};