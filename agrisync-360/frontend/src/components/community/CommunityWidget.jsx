/**
 * CommunityWidget — Dashboard teaser card for the Community Messaging feature.
 * Shows online count, latest messages, and a quick compose button.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MessageCircle, Globe, ChevronRight, Radio } from 'lucide-react';
import { communityMsgAPI } from '../../api/communityMessaging';

const ROLE_COLORS = {
  farmer: 'from-green-500 to-green-700',
  agro_dealer: 'from-blue-500 to-blue-700',
  ngo_partner: 'from-purple-500 to-purple-700',
  admin: 'from-red-500 to-red-700',
};

function MiniAvatar({ name = '?', role }) {
  const initials = (name || '?').slice(0, 2).toUpperCase();
  const gradient = ROLE_COLORS[role] || 'from-gray-400 to-gray-600';
  return (
    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

export default function CommunityWidget() {
  const navigate = useNavigate();
  const [stats, setStats]     = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      communityMsgAPI.getStats(),
      communityMsgAPI.getMessages({ per_page: 3 }),
    ]).then(([sRes, mRes]) => {
      if (cancelled) return;
      setStats(sRes.data?.data);
      setMessages((mRes.data?.data?.messages || []).slice(-3).reverse());
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-white border border-green-100 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-green-500 to-green-700 rounded-lg text-white">
            <Users size={16} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Community</h3>
            {stats && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <Radio size={9} className="text-green-500 animate-pulse" />
                <span className="text-[11px] text-gray-500">{stats.online_members} online</span>
                <span className="text-gray-300">·</span>
                <span className="text-[11px] text-gray-500">{(stats.total_members || 0).toLocaleString()} members</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate('/farmer/community')}
          className="flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700 transition-colors"
        >
          Open <ChevronRight size={13} />
        </button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Farmers',  val: stats.members_by_role?.farmers,  color: 'text-green-600 bg-green-50' },
            { label: 'Dealers',  val: stats.members_by_role?.dealers,  color: 'text-blue-600 bg-blue-50' },
            { label: 'NGOs',     val: stats.members_by_role?.ngos,     color: 'text-purple-600 bg-purple-50' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl px-2 py-2 text-center ${s.color}`}>
              <p className="font-bold text-sm">{(s.val || 0).toLocaleString()}</p>
              <p className="text-[10px] opacity-70">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Latest messages */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Latest Messages</p>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-2 animate-pulse">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-2.5 bg-gray-100 rounded w-3/4" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-3">No messages yet. Be first!</p>
        ) : (
          <div className="space-y-2.5">
            {messages.map(msg => (
              <div key={msg.id} className="flex items-start gap-2 cursor-pointer group" onClick={() => navigate('/farmer/community')}>
                <MiniAvatar name={msg.sender?.phone} role={msg.sender?.role} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-semibold text-gray-800 truncate">{msg.sender?.phone}</span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(msg.created_at)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate group-hover:text-gray-700 transition-colors">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => navigate('/farmer/community')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-green-500 to-green-700 text-white text-xs font-semibold rounded-xl hover:from-green-600 hover:to-green-800 transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Globe size={13} /> Global Chat
        </button>
        <button
          onClick={() => navigate('/farmer/community')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-green-200 text-green-700 text-xs font-semibold rounded-xl hover:bg-green-50 transition-all"
        >
          <MessageCircle size={13} /> Messages
        </button>
      </div>
    </div>
  );
}
