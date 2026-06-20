/**
 * AgriSync 360 — Community Messaging
 * Full-featured chat: global broadcast, direct messages, member directory
 * Green-gradient theme | Tailwind CSS | React hooks
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, Users, MessageSquare, MessageCircle, Search, Pin,
  ChevronRight, MoreVertical, Smile, Paperclip, ArrowLeft,
  Bell, CheckCheck, Check, Globe, Leaf, Zap, Heart,
  ThumbsUp, Laugh, AlertTriangle, RefreshCw, X, Edit3,
  Trash2, BookOpen, ExternalLink, UserCircle, Radio,
} from 'lucide-react';
import { communityMsgAPI } from '../../api/communityMessaging';
import { useAuth } from '../../context/AuthContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const EMOJIS = ['👍', '❤️', '😂', '🌱', '🌽', '🔥'];
const MSG_TYPE_COLORS = {
  text:         'bg-white',
  announcement: 'bg-amber-50 border-l-4 border-amber-400',
  resource:     'bg-blue-50 border-l-4 border-blue-400',
  alert:        'bg-red-50 border-l-4 border-red-400',
  photo:        'bg-white',
};
const MSG_TYPE_ICONS = {
  announcement: <Bell size={14} className="text-amber-500" />,
  resource:     <BookOpen size={14} className="text-blue-500" />,
  alert:        <AlertTriangle size={14} className="text-red-500" />,
};
const ROLE_COLORS = {
  farmer:       'bg-green-100 text-green-700',
  agro_dealer:  'bg-blue-100 text-blue-700',
  ngo_partner:  'bg-purple-100 text-purple-700',
  admin:        'bg-red-100 text-red-700',
  county_officer: 'bg-amber-100 text-amber-700',
};
const ROLE_LABELS = {
  farmer: 'Farmer', agro_dealer: 'Agro Dealer',
  ngo_partner: 'NGO Partner', admin: 'Admin', county_officer: 'County Officer',
};

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)  return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

function Avatar({ name = '?', role, size = 'md' }) {
  const initials = (name || '?').slice(0, 2).toUpperCase();
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm';
  const colors = {
    farmer: 'from-green-500 to-green-700',
    agro_dealer: 'from-blue-500 to-blue-700',
    ngo_partner: 'from-purple-500 to-purple-700',
    admin: 'from-red-500 to-red-700',
  };
  const gradient = colors[role] || 'from-gray-400 to-gray-600';
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ─── Global Message Bubble ────────────────────────────────────────────────────
function MessageBubble({ msg, currentUserId, onReact, onPin, onDelete, onEdit }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const isMine = msg.sender_id === currentUserId || msg.sender?.phone === 'mine';
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setShowMenu(false); setShowEmoji(false); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={`group flex gap-2 mb-3 ${isMine ? 'flex-row-reverse' : ''}`} ref={ref}>
      <Avatar name={msg.sender?.phone} role={msg.sender?.role} size="sm" />
      <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        {/* Sender label */}
        {!isMine && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-semibold text-gray-700 truncate max-w-[120px]">{msg.sender?.phone}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[msg.sender?.role] || 'bg-gray-100 text-gray-600'}`}>
              {ROLE_LABELS[msg.sender?.role] || 'User'}
            </span>
          </div>
        )}

        {/* Bubble */}
        <div className={`relative rounded-2xl px-4 py-2.5 shadow-sm text-sm leading-relaxed
          ${isMine
            ? 'bg-gradient-to-br from-green-500 to-green-700 text-white rounded-tr-sm'
            : `${MSG_TYPE_COLORS[msg.message_type] || 'bg-white'} text-gray-800 rounded-tl-sm border border-gray-100`
          }`}>

          {/* Pinned badge */}
          {msg.is_pinned && (
            <div className="flex items-center gap-1 mb-1.5 text-amber-500 text-[10px] font-semibold">
              <Pin size={10} /> Pinned message
            </div>
          )}

          {/* Type icon */}
          {MSG_TYPE_ICONS[msg.message_type] && !isMine && (
            <div className="flex items-center gap-1.5 mb-1 text-xs font-medium opacity-75">
              {MSG_TYPE_ICONS[msg.message_type]}
              <span className="capitalize">{msg.message_type}</span>
            </div>
          )}

          <p className="whitespace-pre-wrap break-words">{msg.content}</p>

          {msg.resource_title && (
            <div className={`mt-2 rounded-lg p-2 flex items-center gap-2 text-xs font-medium ${isMine ? 'bg-white/20' : 'bg-blue-100'}`}>
              <ExternalLink size={12} />
              <span>{msg.resource_title}</span>
            </div>
          )}

          {msg.edit_count > 0 && (
            <span className="text-[10px] opacity-60 italic"> (edited)</span>
          )}
        </div>

        {/* Reactions & meta */}
        <div className={`flex items-center gap-2 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-gray-400">{timeAgo(msg.created_at)}</span>

          {(msg.reactions || []).filter(r => r.count > 0).map((r, i) => (
            <button key={i} onClick={() => onReact(msg.id, r.emoji)}
              className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-full px-1.5 py-0.5 text-xs hover:bg-gray-50 shadow-sm">
              {r.emoji} <span className="text-gray-600 text-[10px]">{r.count}</span>
            </button>
          ))}

          {/* Actions (visible on hover) */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <button onClick={() => setShowEmoji(v => !v)}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600">
              <Smile size={13} />
            </button>
            {isMine && (
              <button onClick={() => setShowMenu(v => !v)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <MoreVertical size={13} />
              </button>
            )}
          </div>

          {/* Emoji picker */}
          {showEmoji && (
            <div className="absolute z-20 bg-white border border-gray-200 rounded-xl shadow-lg px-2 py-1.5 flex gap-1.5 mt-1">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => { onReact(msg.id, e); setShowEmoji(false); }}
                  className="text-lg hover:scale-125 transition-transform">{e}</button>
              ))}
            </div>
          )}

          {/* Message menu */}
          {showMenu && (
            <div className="absolute z-20 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-36">
              <button onClick={() => { onEdit(msg); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                <Edit3 size={13} /> Edit
              </button>
              <button onClick={() => { onPin(msg.id); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                <Pin size={13} /> {msg.is_pinned ? 'Unpin' : 'Pin'}
              </button>
              <button onClick={() => { onDelete(msg.id); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DM Bubble ────────────────────────────────────────────────────────────────
function DMBubble({ msg, currentUserId }) {
  const isMine = msg.sender_id === currentUserId;
  return (
    <div className={`flex gap-2 mb-3 ${isMine ? 'flex-row-reverse' : ''}`}>
      <Avatar name={msg.sender?.phone} role={msg.sender?.role} size="sm" />
      <div className={`max-w-[72%] flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm
          ${isMine
            ? 'bg-gradient-to-br from-green-500 to-green-700 text-white rounded-tr-sm'
            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
          }`}>
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        </div>
        <div className={`flex items-center gap-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-gray-400">{timeAgo(msg.created_at)}</span>
          {isMine && (msg.is_read
            ? <CheckCheck size={12} className="text-green-500" />
            : <Check size={12} className="text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Member Card ──────────────────────────────────────────────────────────────
function MemberCard({ member, onMessage }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-green-50 border border-transparent hover:border-green-100 transition-all cursor-pointer group">
      <div className="relative flex-shrink-0">
        <Avatar name={member.name} role={member.role} />
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${member.is_online ? 'bg-green-400' : 'bg-gray-300'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[member.role] || 'bg-gray-100 text-gray-600'}`}>
          {ROLE_LABELS[member.role]}
        </span>
        {member.location && <p className="text-xs text-gray-400 mt-0.5 truncate">📍 {member.location}</p>}
      </div>
      <button onClick={() => onMessage(member)}
        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-all">
        <MessageCircle size={14} />
      </button>
    </div>
  );
}

// ─── Compose Bar ──────────────────────────────────────────────────────────────
function ComposeBar({ onSend, recipientId, placeholder, disabled }) {
  const [text, setText] = useState('');
  const [msgType, setMsgType] = useState('text');
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const textareaRef = useRef();

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend({ content: trimmed, message_type: msgType });
    setText('');
    setMsgType('text');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const typeOptions = [
    { value: 'text', label: 'Message', icon: <MessageSquare size={14} /> },
    { value: 'announcement', label: 'Announcement', icon: <Bell size={14} /> },
    { value: 'resource', label: 'Resource', icon: <BookOpen size={14} /> },
    { value: 'alert', label: 'Alert', icon: <AlertTriangle size={14} /> },
  ];

  return (
    <div className="p-3 border-t border-gray-100 bg-white">
      <div className="flex items-end gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-3 py-2 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100 transition-all">
        {/* Type selector (global only) */}
        {!recipientId && (
          <div className="relative flex-shrink-0 mb-1">
            <button onClick={() => setShowTypeMenu(v => !v)}
              className={`p-1.5 rounded-lg transition-colors ${msgType !== 'text' ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
              {typeOptions.find(t => t.value === msgType)?.icon}
            </button>
            {showTypeMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-44 z-20">
                {typeOptions.map(t => (
                  <button key={t.value} onClick={() => { setMsgType(t.value); setShowTypeMenu(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${msgType === t.value ? 'text-green-600 font-semibold' : 'text-gray-700'}`}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder || 'Type a message…'}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400 resize-none py-1 max-h-28"
          style={{ lineHeight: '1.5' }}
        />

        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="flex-shrink-0 mb-1 p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-700 text-white hover:from-green-600 hover:to-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95">
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CommunityMessaging() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('global'); // global | dms | members
  const [stats, setStats] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeDM, setActiveDM] = useState(null);       // { user_id, phone, role }
  const [dmMessages, setDMMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dmLoading, setDMLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [editingMsg, setEditingMsg] = useState(null);
  const [pinnedMsg, setPinnedMsg] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);

  const globalEndRef = useRef();
  const dmEndRef = useRef();
  const heartbeatRef = useRef();
  const typingRef = useRef();

  // ── Load initial data ──────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, msgsRes, membersRes, convoRes] = await Promise.all([
        communityMsgAPI.getStats(),
        communityMsgAPI.getMessages({ per_page: 50 }),
        communityMsgAPI.getMembers({ per_page: 30 }),
        communityMsgAPI.listConversations(),
      ]);
      setStats(statsRes.data?.data);
      const msgs = msgsRes.data?.data?.messages || [];
      setMessages(msgs);
      setPinnedMsg(msgs.find(m => m.is_pinned) || null);
      setMembers(membersRes.data?.data?.members || []);
      setConversations(convoRes.data?.data || []);
      setOnlineCount(statsRes.data?.data?.online_members || 0);
    } catch (err) {
      console.warn('Community load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Heartbeat & typing poll ────────────────────────────────────────────────
  useEffect(() => {
    loadData();

    // Online status heartbeat every 30s
    heartbeatRef.current = setInterval(async () => {
      try { await communityMsgAPI.updateStatus({ is_online: true }); } catch {}
    }, 30000);

    // Typing status poll every 3s when in global chat
    typingRef.current = setInterval(async () => {
      try {
        const res = await communityMsgAPI.getTypingStatus({ recipient_id: 'global' });
        setTypingUsers(res.data?.data?.typing_users || []);
      } catch {}
    }, 3000);

    communityMsgAPI.updateStatus({ is_online: true }).catch(() => {});

    return () => {
      clearInterval(heartbeatRef.current);
      clearInterval(typingRef.current);
      communityMsgAPI.updateStatus({ is_online: false }).catch(() => {});
    };
  }, [loadData]);

  // ── Auto scroll ────────────────────────────────────────────────────────────
  useEffect(() => { globalEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { dmEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [dmMessages]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSendGlobal = async (payload) => {
    try {
      const res = await communityMsgAPI.postMessage(payload);
      const newMsg = res.data?.data;
      if (newMsg) setMessages(prev => [...prev, newMsg]);
    } catch (err) { console.warn('Send error:', err); }
  };

  const handleReact = async (msgId, emoji) => {
    try {
      await communityMsgAPI.reactToMessage(msgId, { emoji });
      // Optimistic update
      setMessages(prev => prev.map(m => {
        if (m.id !== msgId) return m;
        const existing = (m.reactions || []).find(r => r.emoji === emoji);
        if (existing) {
          return { ...m, reactions: m.reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r) };
        }
        return { ...m, reactions: [...(m.reactions || []), { emoji, count: 1 }] };
      }));
    } catch {}
  };

  const handlePin = async (msgId) => {
    try {
      await communityMsgAPI.pinMessage(msgId);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_pinned: !m.is_pinned } : m));
      const pinned = messages.find(m => m.id === msgId);
      setPinnedMsg(pinned?.is_pinned ? null : pinned);
    } catch {}
  };

  const handleDelete = async (msgId) => {
    try {
      await communityMsgAPI.deleteMessage(msgId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch {}
  };

  const handleOpenDM = async (member) => {
    setActiveDM(member);
    setActiveTab('dms');
    setDMLoading(true);
    try {
      const res = await communityMsgAPI.getDirectMessages(member.user_id, { per_page: 50 });
      setDMMessages(res.data?.data?.messages || []);
    } catch {}
    setDMLoading(false);
  };

  const handleSendDM = async (payload) => {
    if (!activeDM) return;
    try {
      const res = await communityMsgAPI.sendDirectMessage(activeDM.user_id, payload);
      const newMsg = res.data?.data;
      if (newMsg) setDMMessages(prev => [...prev, newMsg]);
    } catch {}
  };

  const handleTyping = async () => {
    try { await communityMsgAPI.setTyping({ recipient_id: activeDM?.user_id || 'global', is_typing: true }); } catch {}
  };

  const filteredMembers = members.filter(m =>
    !memberSearch || m.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.role?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.location?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const filteredMessages = messages.filter(m =>
    !globalSearch || m.content?.toLowerCase().includes(globalSearch.toLowerCase())
  );

  // ── Tabs config ────────────────────────────────────────────────────────────
  const tabs = [
    { key: 'global',  label: 'Global Chat', icon: <Globe size={16} /> },
    { key: 'dms',     label: 'Messages',    icon: <MessageCircle size={16} />, badge: conversations.reduce((s, c) => s + (c.unread_count || 0), 0) },
    { key: 'members', label: 'Members',     icon: <Users size={16} />, count: stats?.total_members },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Loading community…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-green-700 to-green-600 text-white px-4 lg:px-6 py-4 shadow-lg flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Users size={22} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">AgriSync Community</h1>
              <p className="text-green-200 text-xs">
                {onlineCount} online · {stats?.total_members?.toLocaleString() || '—'} members
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadData} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Pinned message strip */}
        {pinnedMsg && (
          <div className="max-w-6xl mx-auto mt-3 bg-white/15 backdrop-blur rounded-xl px-4 py-2.5 flex items-center gap-3 border border-white/20">
            <Pin size={14} className="text-amber-300 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-green-100 truncate">{pinnedMsg.content}</p>
            </div>
            <span className="text-[10px] text-green-200 flex-shrink-0">{pinnedMsg.sender?.phone}</span>
          </div>
        )}

        {/* Stats strip */}
        {stats && (
          <div className="max-w-6xl mx-auto mt-3 grid grid-cols-4 gap-2">
            {[
              { label: 'Farmers',  val: stats.members_by_role?.farmers,  icon: <Leaf size={12} /> },
              { label: 'Dealers',  val: stats.members_by_role?.dealers,  icon: <Zap size={12} /> },
              { label: 'NGOs',     val: stats.members_by_role?.ngos,     icon: <Heart size={12} /> },
              { label: 'Today',    val: stats.messages_today,            icon: <MessageSquare size={12} /> },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-lg px-2 py-1.5 text-center">
                <div className="flex items-center justify-center gap-1 text-green-200 mb-0.5">{s.icon}</div>
                <p className="font-bold text-sm">{(s.val || 0).toLocaleString()}</p>
                <p className="text-[10px] text-green-200">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Trending topics */}
        {stats?.trending_topics?.length > 0 && (
          <div className="max-w-6xl mx-auto mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-green-200 text-xs">Trending:</span>
            {stats.trending_topics.map(t => (
              <span key={t} onClick={() => { setGlobalSearch(t); setActiveTab('global'); }}
                className="text-xs bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded-full cursor-pointer transition-colors">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex bg-white border-b border-gray-100 flex-shrink-0 shadow-sm">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all relative
              ${activeTab === t.key
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            {t.badge > 0 && (
              <span className="absolute top-2 right-[calc(50%-20px)] min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {t.badge > 9 ? '9+' : t.badge}
              </span>
            )}
            {t.count && <span className="text-[10px] text-gray-400">({t.count?.toLocaleString()})</span>}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden flex">

        {/* ════ GLOBAL CHAT ═══════════════════════════════════════════════════ */}
        {activeTab === 'global' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search bar */}
            <div className="px-4 py-2.5 bg-white border-b border-gray-100">
              <div className="relative max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={globalSearch}
                  onChange={e => setGlobalSearch(e.target.value)}
                  placeholder="Search messages…"
                  className="w-full pl-8 pr-8 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
                />
                {globalSearch && (
                  <button onClick={() => setGlobalSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Messages scroll area */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="max-w-3xl mx-auto">
                {filteredMessages.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No messages yet</p>
                    <p className="text-sm mt-1">Be the first to post!</p>
                  </div>
                ) : (
                  filteredMessages.map(msg => (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      currentUserId={user?.id}
                      onReact={handleReact}
                      onPin={handlePin}
                      onDelete={handleDelete}
                      onEdit={setEditingMsg}
                    />
                  ))
                )}
                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex items-center gap-2 mb-2 text-gray-500 text-xs">
                    <div className="flex gap-0.5">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>{typingUsers.map(u => u.phone).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…</span>
                  </div>
                )}
                <div ref={globalEndRef} />
              </div>
            </div>

            <ComposeBar onSend={handleSendGlobal} placeholder="Send a message to the community…" />
          </div>
        )}

        {/* ════ DIRECT MESSAGES ════════════════════════════════════════════════ */}
        {activeTab === 'dms' && (
          <div className="flex-1 flex min-h-0">
            {/* Sidebar: conversation list */}
            <div className={`w-full sm:w-72 lg:w-80 flex flex-col border-r border-gray-100 bg-white flex-shrink-0 ${activeDM ? 'hidden sm:flex' : 'flex'}`}>
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Messages</h2>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {conversations.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 px-4">
                    <MessageCircle size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No conversations yet</p>
                    <p className="text-xs mt-1">Go to Members to start a chat</p>
                  </div>
                ) : (
                  conversations.map(c => (
                    <button key={c.user_id} onClick={() => handleOpenDM(c)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${activeDM?.user_id === c.user_id ? 'bg-green-50' : ''}`}>
                      <div className="relative flex-shrink-0">
                        <Avatar name={c.phone} role={c.role} size="sm" />
                        {c.is_online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900 truncate">{c.phone}</p>
                          {c.last_message_time && <span className="text-[10px] text-gray-400 ml-1 flex-shrink-0">{timeAgo(c.last_message_time)}</span>}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{c.last_message}</p>
                      </div>
                      {c.unread_count > 0 && (
                        <span className="flex-shrink-0 min-w-[20px] h-5 bg-green-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                          {c.unread_count}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* DM conversation panel */}
            {activeDM ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* DM header */}
                <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center gap-3">
                  <button onClick={() => setActiveDM(null)} className="sm:hidden p-1.5 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft size={18} />
                  </button>
                  <div className="relative">
                    <Avatar name={activeDM.phone || activeDM.name} role={activeDM.role} />
                    {activeDM.is_online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{activeDM.phone || activeDM.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[activeDM.role] || 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABELS[activeDM.role]}
                    </span>
                  </div>
                </div>

                {/* DM messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {dmLoading ? (
                    <div className="text-center py-8 text-gray-400">
                      <div className="w-8 h-8 border-2 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-sm">Loading messages…</p>
                    </div>
                  ) : dmMessages.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                      <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No messages yet</p>
                      <p className="text-sm mt-1">Send a message to start the conversation</p>
                    </div>
                  ) : (
                    dmMessages.map(msg => (
                      <DMBubble key={msg.id} msg={msg} currentUserId={user?.id} />
                    ))
                  )}
                  <div ref={dmEndRef} />
                </div>

                <ComposeBar onSend={handleSendDM} recipientId={activeDM.user_id} placeholder={`Message ${activeDM.phone || activeDM.name}…`} />
              </div>
            ) : (
              <div className="hidden sm:flex flex-1 items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageCircle size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="font-medium text-gray-500">Select a conversation</p>
                  <p className="text-sm mt-1">Or go to Members to start a new chat</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ MEMBERS DIRECTORY ══════════════════════════════════════════════ */}
        {activeTab === 'members' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search & role filters */}
            <div className="px-4 py-3 bg-white border-b border-gray-100 space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  placeholder="Search members…"
                  className="w-full pl-8 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
                />
                {memberSearch && (
                  <button onClick={() => setMemberSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {['All', 'Farmers', 'Dealers', 'NGOs'].map(f => {
                  const roleMap = { All: '', Farmers: 'farmer', Dealers: 'agro_dealer', NGOs: 'ngo_partner' };
                  const active = memberSearch === roleMap[f] || (f === 'All' && !memberSearch.match(/farmer|agro_dealer|ngo_partner/));
                  return (
                    <button key={f}
                      onClick={() => setMemberSearch(roleMap[f])}
                      className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors
                        ${f === 'All' && !['farmer','agro_dealer','ngo_partner'].includes(memberSearch)
                          ? 'bg-green-600 text-white'
                          : memberSearch === roleMap[f]
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Online section */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 py-3">
                {/* Online members */}
                {filteredMembers.some(m => m.is_online) && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Radio size={12} className="text-green-500 animate-pulse" />
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Online Now</p>
                    </div>
                    <div className="space-y-1">
                      {filteredMembers.filter(m => m.is_online).map(m => (
                        <MemberCard key={m.id} member={m} onMessage={handleOpenDM} />
                      ))}
                    </div>
                  </div>
                )}

                {/* All members */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    All Members ({filteredMembers.length})
                  </p>
                  {filteredMembers.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <Users size={36} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No members found</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredMembers.map(m => (
                        <MemberCard key={m.id} member={m} onMessage={handleOpenDM} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
