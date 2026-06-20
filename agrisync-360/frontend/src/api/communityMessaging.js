import API from './axios';
import { apiConfig } from './config';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const delay = (ms = 250) => new Promise(r => setTimeout(r, ms));

const MOCK_MEMBERS = [
  { id: 'm1', user_id: 'u1', name: '0712345678', role: 'farmer',   bio: 'Maize & bean farmer, Nakuru.', location: 'Nakuru', is_online: true,  last_seen: new Date().toISOString(), joined_date: '2024-01-15T00:00:00Z' },
  { id: 'm2', user_id: 'u2', name: '0733000002', role: 'agro_dealer', bio: 'Certified agro-dealer, Kiambu.', location: 'Kiambu', is_online: true,  last_seen: new Date().toISOString(), joined_date: '2024-02-10T00:00:00Z' },
  { id: 'm3', user_id: 'u3', name: '0744000003', role: 'ngo_partner', bio: 'Agricultural development NGO.', location: 'Nairobi', is_online: false, last_seen: new Date(Date.now() - 3600000).toISOString(), joined_date: '2024-03-05T00:00:00Z' },
  { id: 'm4', user_id: 'u4', name: '0755000004', role: 'farmer',   bio: 'Horticulture farmer, Meru.', location: 'Meru',   is_online: false, last_seen: new Date(Date.now() - 7200000).toISOString(), joined_date: '2024-03-20T00:00:00Z' },
];

const MOCK_GLOBAL = [
  { id: 'g1', sender_id: 'u1', sender: { phone: '0712345678', role: 'farmer' },   message_type: 'text', content: 'Habari wote! Maize prices in Nakuru are up 15% this week 🌽', is_pinned: false, reactions: [], read_count: 5, created_at: new Date(Date.now() - 3600000 * 3).toISOString() },
  { id: 'g2', sender_id: 'u3', sender: { phone: '0744000003', role: 'ngo_partner' }, message_type: 'announcement', content: '📢 Free soil testing workshop this Saturday in Nairobi. Register at agrisync360.co.ke/workshop', is_pinned: true, reactions: [{ emoji: '👍', count: 12 }], read_count: 22, created_at: new Date(Date.now() - 3600000 * 1).toISOString() },
  { id: 'g3', sender_id: 'u2', sender: { phone: '0733000002', role: 'agro_dealer' }, message_type: 'resource', content: 'New hybrid maize seeds just arrived — 30% higher yield potential. DM me for pricing.', resource_title: 'H614D Hybrid Maize', is_pinned: false, reactions: [], read_count: 8, created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: 'g4', sender_id: 'u4', sender: { phone: '0755000004', role: 'farmer' },   message_type: 'text', content: 'Can anyone recommend good tomato fertilizer available in Meru?', is_pinned: false, reactions: [{ emoji: '❤️', count: 3 }], read_count: 4, created_at: new Date(Date.now() - 600000).toISOString() },
];

const MOCK_DMs = {
  u2: [
    { id: 'd1', sender_id: 'u1', recipient_id: 'u2', sender: { phone: '0712345678', role: 'farmer' }, content: 'Hello, are those seeds available in 5kg bags?', is_read: true, created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: 'd2', sender_id: 'u2', recipient_id: 'u1', sender: { phone: '0733000002', role: 'agro_dealer' }, content: 'Yes! We have 5kg, 10kg and 25kg packs. Price is KSH 850 per 5kg.', is_read: true, created_at: new Date(Date.now() - 7000000).toISOString() },
    { id: 'd3', sender_id: 'u1', recipient_id: 'u2', sender: { phone: '0712345678', role: 'farmer' }, content: 'Great, I will come on Friday.', is_read: false, created_at: new Date(Date.now() - 600000).toISOString() },
  ],
};

const MOCK_STATS = {
  total_members: 1247,
  online_members: 89,
  members_by_role: { farmers: 980, dealers: 215, ngos: 52 },
  total_messages: 8420,
  messages_today: 143,
  messages_this_week: 891,
  trending_topics: ['maize', 'drought', 'workshop', 'seeds', 'fertilizer'],
  most_active_members: MOCK_MEMBERS.slice(0, 3).map(m => ({ ...m, message_count: Math.floor(Math.random() * 50 + 10) })),
};

// ─── Mock API ─────────────────────────────────────────────────────────────────
const mockCommunityMsgAPI = {
  getMembers:      async (p) => { await delay(); return { data: { success: true, data: { members: MOCK_MEMBERS, total: MOCK_MEMBERS.length, total_members: MOCK_MEMBERS.length, by_role: MOCK_STATS.members_by_role } } }; },
  getMemberProfile:async (id) => { await delay(); const m = MOCK_MEMBERS.find(x => x.id === id || x.user_id === id); return { data: { success: true, data: m || MOCK_MEMBERS[0] } }; },
  getMyProfile:    async () => { await delay(); return { data: { success: true, data: MOCK_MEMBERS[0] } }; },
  updateMyProfile: async (d) => { await delay(); return { data: { success: true, data: { ...MOCK_MEMBERS[0], ...d } } }; },
  getOnlineMembers:async () => { await delay(); return { data: { success: true, data: MOCK_MEMBERS.filter(m => m.is_online), count: 2 } }; },
  updateStatus:    async (d) => { await delay(); return { data: { success: true } }; },
  setTyping:       async (d) => { await delay(); return { data: { success: true } }; },
  getTypingStatus: async (p) => { await delay(); return { data: { success: true, data: { typing_users: [] } } }; },
  getMessages:     async (p) => { await delay(); return { data: { success: true, data: { messages: MOCK_GLOBAL, total: MOCK_GLOBAL.length } } }; },
  postMessage:     async (d) => { await delay(400); const msg = { id: `g${Date.now()}`, sender_id: 'u1', sender: { phone: '0712345678', role: 'farmer' }, message_type: d.message_type || 'text', content: d.content, image_url: d.image_url, resource_link: d.resource_link, resource_title: d.resource_title, is_pinned: false, reactions: [], read_count: 0, created_at: new Date().toISOString() }; return { data: { success: true, data: msg } }; },
  editMessage:     async (id, d) => { await delay(); return { data: { success: true, data: { id, ...d } } }; },
  deleteMessage:   async (id) => { await delay(); return { data: { success: true } }; },
  pinMessage:      async (id) => { await delay(); return { data: { success: true } }; },
  reactToMessage:  async (id, d) => { await delay(); return { data: { success: true } }; },
  markRead:        async (id) => { await delay(); return { data: { success: true } }; },
  listConversations: async () => { await delay(); return { data: { success: true, data: Object.keys(MOCK_DMs).map(uid => ({ user_id: uid, phone: '0733000002', role: 'agro_dealer', last_message: MOCK_DMs[uid].slice(-1)[0]?.content, last_message_time: MOCK_DMs[uid].slice(-1)[0]?.created_at, unread_count: MOCK_DMs[uid].filter(m => !m.is_read && m.sender_id !== 'u1').length })) } }; },
  getDirectMessages: async (uid, p) => { await delay(); return { data: { success: true, data: { messages: MOCK_DMs[uid] || [], total: (MOCK_DMs[uid] || []).length } } }; },
  sendDirectMessage: async (uid, d) => { await delay(300); const msg = { id: `d${Date.now()}`, sender_id: 'u1', recipient_id: uid, sender: { phone: '0712345678', role: 'farmer' }, content: d.content, is_read: false, created_at: new Date().toISOString() }; return { data: { success: true, data: msg } }; },
  getStats:        async () => { await delay(); return { data: { success: true, data: MOCK_STATS } }; },
};

// ─── Real API ─────────────────────────────────────────────────────────────────
const realCommunityMsgAPI = {
  getMembers:       (params) => API.get('/community/members', { params }),
  getMemberProfile: (id) => API.get(`/community/members/${id}`),
  getMyProfile:     ()   => API.get('/community/me'),
  updateMyProfile:  (d)  => API.put('/community/me', d),
  getOnlineMembers: ()   => API.get('/community/members/online'),
  updateStatus:     (d)  => API.post('/community/status', d),
  setTyping:        (d)  => API.post('/community/typing', d),
  getTypingStatus:  (p)  => API.get('/community/typing-status', { params: p }),
  getMessages:      (p)  => API.get('/community/messages', { params: p }),
  postMessage:      (d)  => API.post('/community/messages', d),
  editMessage:      (id, d) => API.put(`/community/messages/${id}`, d),
  deleteMessage:    (id) => API.delete(`/community/messages/${id}`),
  pinMessage:       (id) => API.post(`/community/messages/${id}/pin`),
  reactToMessage:   (id, d) => API.post(`/community/messages/${id}/react`, d),
  markRead:         (id) => API.post(`/community/messages/${id}/read`),
  listConversations:()   => API.get('/direct-messages'),
  getDirectMessages:(id, p) => API.get(`/direct-messages/${id}`, { params: p }),
  sendDirectMessage:(id, d) => API.post(`/direct-messages/${id}`, d),
  getStats:         ()   => API.get('/community/stats'),
};

export const communityMsgAPI = apiConfig.useMock ? mockCommunityMsgAPI : realCommunityMsgAPI;
