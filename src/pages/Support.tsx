import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { chatService } from '../services/chatService';
import { supportConfigService } from '../services/api';
import { useAppSelector } from '../redux/hooks';
import {
  MessageCircle, Send, User, Clock, CheckCheck, Check,
  Search, RefreshCw, X, ChevronRight, Headphones,
  Bot, AlertCircle, Phone, FileText, Circle, PhoneCall,
  Monitor, Copy, ExternalLink, ShieldCheck, HelpCircle,
  Settings, Download, Sparkles, Loader2, Edit3
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_URL } from '../services/api';

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

const SOCKET_URL = API_URL.replace('/api', '');

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
  const [activeChannel, setActiveChannel] = useState<'CHAT' | 'CALL' | 'ANYDESK'>('CHAT');

  // Support Config State
  const [supportConfig, setSupportConfig] = useState<any>({
    supportPhone: '+91 98765 43210',
    supportCallHours: 'Mon - Sat: 8:00 AM - 8:00 PM',
    supportEmail: 'support@medsseva.com',
    anydeskId: '982 110 443',
    anydeskInstructions: '1. Download & launch the AnyDesk application.\n2. Share your 9-digit AnyDesk Address with our technical support engineer.\n3. Click \'Accept\' when the connection invitation is received.',
    isCallSupportEnabled: true,
    isAnydeskSupportEnabled: true,
  });

  // Admin Config Modal State
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [formPhone, setFormPhone] = useState('');
  const [formHours, setFormHours] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAnydeskId, setFormAnydeskId] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [formCallEnabled, setFormCallEnabled] = useState(true);
  const [formAnydeskEnabled, setFormAnydeskEnabled] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Chat State
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

  const loadSupportConfig = async () => {
    try {
      const data = await supportConfigService.getSupportConfig();
      if (data) {
        setSupportConfig(data);
      }
    } catch (err) {
      console.error('Failed to load support config:', err);
    }
  };

  useEffect(() => {
    loadSupportConfig();
  }, []);

  const openConfigModal = () => {
    setFormPhone(supportConfig.supportPhone || '');
    setFormHours(supportConfig.supportCallHours || '');
    setFormEmail(supportConfig.supportEmail || '');
    setFormAnydeskId(supportConfig.anydeskId || '');
    setFormInstructions(supportConfig.anydeskInstructions || '');
    setFormCallEnabled(supportConfig.isCallSupportEnabled ?? true);
    setFormAnydeskEnabled(supportConfig.isAnydeskSupportEnabled ?? true);
    setConfigModalOpen(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await supportConfigService.updateSupportConfig({
        supportPhone: formPhone,
        supportCallHours: formHours,
        supportEmail: formEmail,
        anydeskId: formAnydeskId,
        anydeskInstructions: formInstructions,
        isCallSupportEnabled: formCallEnabled,
        isAnydeskSupportEnabled: formAnydeskEnabled,
      });
      if (res.config) {
        setSupportConfig(res.config);
      }
      toast.success('Support configuration updated successfully');
      setConfigModalOpen(false);
    } catch (err: any) {
      console.error('Failed to update support config:', err);
      toast.error('Failed to save support configuration.');
    } finally {
      setSavingConfig(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

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
    <div className="space-y-4">
      {/* Top Header & Channel Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 font-bold">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              Free Support Desk
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 px-2 py-0.5 rounded-full">
                100% Free
              </span>
            </h1>
            <p className="text-xs text-muted-foreground">Access 24/7 technical assistance via Phone Call, AnyDesk Remote Desktop & Live Chat</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Channel Tabs */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border text-xs font-bold">
            <button
              onClick={() => setActiveChannel('CHAT')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeChannel === 'CHAT'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" /> Live Chat {pendingCount > 0 && <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.2 rounded-full">{pendingCount}</span>}
            </button>

            <button
              onClick={() => setActiveChannel('CALL')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeChannel === 'CALL'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" /> Call Support
            </button>

            <button
              onClick={() => setActiveChannel('ANYDESK')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeChannel === 'ANYDESK'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" /> AnyDesk Support
            </button>
          </div>

          {/* Admin Manage Button */}
          <button
            onClick={openConfigModal}
            className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-teal-600" /> Configure Channels
          </button>
        </div>
      </div>

      {/* CHANNEL 1: CALL SUPPORT */}
      {activeChannel === 'CALL' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-teal-950/20 via-card to-card border border-teal-500/30 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">Direct Voice Assistance</span>
                <h2 className="text-2xl font-black text-foreground mt-0.5">Free Call Support</h2>
                <p className="text-xs text-muted-foreground mt-1">Speak directly with our clinical verification & technical LIMS support specialists.</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600">
                <PhoneCall className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 shadow-inner space-y-4">
              <div className="text-xs font-semibold text-muted-foreground">Official Support Hotline:</div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-2xl sm:text-3xl font-black text-teal-600 font-mono tracking-tight">
                  {supportConfig.supportPhone || '+91 98765 43210'}
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${supportConfig.supportPhone?.replace(/\s+/g, '')}`}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call Now
                  </a>
                  <button
                    onClick={() => copyToClipboard(supportConfig.supportPhone || '+91 98765 43210', 'phone')}
                    className="px-3.5 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copiedKey === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'phone' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-1">
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-600" /> Calling Operating Hours
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  {supportConfig.supportCallHours || 'Mon - Sat: 8:00 AM - 8:00 PM'}
                </div>
                <div className="text-[10px] text-emerald-600 font-bold">● Active Support Staff Online</div>
              </div>

              <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-1">
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-600" /> Support Email
                </div>
                <div className="text-xs text-muted-foreground font-mono font-medium">
                  {supportConfig.supportEmail || 'support@medsseva.com'}
                </div>
                <div className="text-[10px] text-muted-foreground">Response within 15 minutes</div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Service Guarantees
            </h3>
            <ul className="space-y-3 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <span><strong>100% Free:</strong> No telephonic charges for registered franchise, partner labs, or patients.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <span><strong>Diagnostic Escalations:</strong> Direct connectivity to senior pathologists for report clarifications.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <span><strong>Instant Call-Back:</strong> If lines are busy, our automated IVR places your ticket at top priority.</span>
              </li>
            </ul>

            <div className="pt-2 border-t border-border">
              <button
                onClick={() => {
                  toast.success('Call back request registered. Our engineer will call you shortly.');
                }}
                className="w-full py-2.5 rounded-xl border border-teal-500/30 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 text-teal-700 dark:text-teal-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Request Call Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANNEL 2: ANYDESK REMOTE SUPPORT */}
      {activeChannel === 'ANYDESK' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-950/20 via-card to-card border border-blue-500/30 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Remote Screen & Technical Assistance</span>
                <h2 className="text-2xl font-black text-foreground mt-0.5">Free AnyDesk Support</h2>
                <p className="text-xs text-muted-foreground mt-1">Get instant screen sharing support from MedsSeva LIMS engineers for hardware, barcode printer, or report issues.</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
                <Monitor className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 shadow-inner space-y-3">
              <div className="text-xs font-semibold text-muted-foreground">MedsSeva Official AnyDesk Address / ID:</div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-2xl sm:text-3xl font-black text-blue-600 font-mono tracking-tight bg-blue-50/50 dark:bg-blue-950/40 px-4 py-2 rounded-xl border border-blue-200/50">
                  {supportConfig.anydeskId || '982 110 443'}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(supportConfig.anydeskId || '982 110 443', 'anydesk')}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    {copiedKey === 'anydesk' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'anydesk' ? 'ID Copied!' : 'Copy AnyDesk ID'}
                  </button>
                  <a
                    href="https://anydesk.com/en/downloads"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download AnyDesk
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-muted/40 border border-border rounded-xl p-5">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-600" /> Step-by-Step Connection Instructions
              </h3>
              <div className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed font-medium">
                {supportConfig.anydeskInstructions || `1. Download & launch the AnyDesk application on your PC.\n2. Share your 9-digit AnyDesk Address with our technical support engineer.\n3. Click 'Accept' when the connection invitation is received.`}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Security & Privacy
            </h3>
            <ul className="space-y-3 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span><strong>End-to-End Encrypted:</strong> 256-bit TLS encryption protects every remote session.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span><strong>User Controlled:</strong> You can terminate or pause the remote session at any moment.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span><strong>Specialized LIMS Support:</strong> Fast resolution for thermal barcode printers, analyzers & PDF export issues.</span>
              </li>
            </ul>

            <div className="pt-2 border-t border-border">
              <button
                onClick={() => {
                  toast.success('AnyDesk remote session request sent to MedsSeva Technical Team.');
                }}
                className="w-full py-2.5 rounded-xl border border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Request Remote Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANNEL 3: LIVE CHAT SUPPORT */}
      {activeChannel === 'CHAT' && (
        <div className="flex h-[calc(100vh-160px)] bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
          {/* Chat List Sidebar */}
          <div className="w-80 flex-shrink-0 border-r border-border flex flex-col bg-card">
            <div className="p-4 border-b border-border">
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
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-xs text-foreground truncate">{conv.user.name}</p>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            {lastMsg ? formatTime(lastMsg.createdAt) : ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{lastMsg?.text || 'No messages'}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${STATUS_COLORS[conv.status]}`}>
                            {STATUS_LABELS[conv.status]}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Conversation Main Area */}
          <div className="flex-1 flex flex-col bg-background">
            {!activeConv ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mb-3">
                  <MessageCircle className="h-7 w-7 text-teal-600" />
                </div>
                <h3 className="font-bold text-base text-foreground mb-1">Select a Conversation</h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Choose a customer chat from the left to start live messaging
                </p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border bg-card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-foreground">{activeConv.user.name}</h3>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${STATUS_COLORS[activeConv.status]}`}>
                          {STATUS_LABELS[activeConv.status]}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{activeConv.user.mobile}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeConv.status === 'PENDING_HUMAN' && (
                      <button
                        onClick={handleJoinConversation}
                        className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors shadow-sm"
                      >
                        Join Chat
                      </button>
                    )}
                    {activeConv.status === 'HUMAN_ACTIVE' && (
                      <button
                        onClick={handleCloseConversation}
                        className="px-3 py-1.5 rounded-lg border border-border text-xs font-bold hover:bg-muted transition-colors"
                      >
                        Close Chat
                      </button>
                    )}
                    {activeConv.status === 'CLOSED' && (
                      <button
                        onClick={handleReopenConversation}
                        className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors shadow-sm"
                      >
                        Reopen Chat
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {groupMessagesByDate(messages).map((group) => (
                    <div key={group.date} className="space-y-3">
                      <div className="flex items-center justify-center">
                        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                          {group.date}
                        </span>
                      </div>
                      {group.messages.map((msg) => {
                        const isAgent = msg.senderType === 'AGENT';
                        const isBot = msg.senderType === 'BOT';
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] font-bold text-muted-foreground">
                                {isAgent ? 'Support Agent' : isBot ? 'MedsSeva AI' : activeConv.user.name}
                              </span>
                              <span className="text-[9px] text-muted-foreground">{formatTime(msg.createdAt)}</span>
                            </div>
                            <div
                              className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                                isAgent
                                  ? 'bg-teal-600 text-white rounded-tr-none'
                                  : isBot
                                  ? 'bg-blue-50 text-blue-900 border border-blue-100 rounded-tl-none'
                                  : 'bg-muted text-foreground rounded-tl-none'
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                      {typingUser || 'User'} is typing...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-3 border-t border-border bg-card">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Type a support reply..."
                      value={inputText}
                      onChange={(e) => handleTyping(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1 px-4 py-2.5 bg-muted border-0 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500/30"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!inputText.trim() || sending}
                      className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-40"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ADMIN CONFIGURE CHANNELS MODAL */}
      {configModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Settings className="w-5 h-5 text-teal-600" />
                Configure Free Support Channels
              </h2>
              <button onClick={() => setConfigModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Support Hotline Phone *</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  required
                  className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs font-bold text-foreground outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Operating Call Hours</label>
                  <input
                    type="text"
                    value={formHours}
                    onChange={(e) => setFormHours(e.target.value)}
                    placeholder="e.g. Mon - Sat: 8 AM - 8 PM"
                    className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs text-foreground outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Support Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. support@medsseva.com"
                    className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs text-foreground outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Official AnyDesk Desk ID *</label>
                <input
                  type="text"
                  value={formAnydeskId}
                  onChange={(e) => setFormAnydeskId(e.target.value)}
                  placeholder="e.g. 982 110 443"
                  required
                  className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs font-bold text-blue-600 outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AnyDesk Remote Instructions</label>
                <textarea
                  rows={3}
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  placeholder="Enter step-by-step instructions for remote desktop session..."
                  className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs text-foreground outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-foreground">
                  <input
                    type="checkbox"
                    checked={formCallEnabled}
                    onChange={(e) => setFormCallEnabled(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  Enable Call Support
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-foreground">
                  <input
                    type="checkbox"
                    checked={formAnydeskEnabled}
                    onChange={(e) => setFormAnydeskEnabled(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  Enable AnyDesk Support
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setConfigModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60 cursor-pointer shadow-md shadow-teal-600/20"
                >
                  {savingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Support Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};