import { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import './AsteroidChat.css';

// ── Hardcoded seed chats for demo video ──
function getSeedMessages(asteroidId, asteroidName) {
  const now = Date.now();
  const min = 60000;
  const hr = 3600000;

  // Common thread for ALL asteroids
  const defaultThread = [
    {
      id: `seed_default_1_${asteroidId}`,
      userId: 'user_jyoti_ps',
      displayName: 'Jyoti Prakash Swain',
      photoURL: null,
      message: `Just found ${asteroidName} on Orbitra. The orbital visualization is incredible — you can really see how close this one gets to Earth's orbit.`,
      room: `asteroid_${asteroidId}`,
      asteroidId,
      parentId: null,
      createdAt: new Date(now - 2 * hr - 15 * min).toISOString(),
    },
    {
      id: `seed_default_2_${asteroidId}`,
      userId: 'user_jyoti_rd',
      displayName: 'Jyoti Ranjan Das',
      photoURL: null,
      message: `Yeah the risk breakdown is really useful too. You can see exactly how much each factor (size, velocity, distance) contributes to the overall score.`,
      room: `asteroid_${asteroidId}`,
      asteroidId,
      parentId: `seed_default_1_${asteroidId}`,
      createdAt: new Date(now - 2 * hr).toISOString(),
    },
    {
      id: `seed_default_3_${asteroidId}`,
      userId: 'user_jit_m',
      displayName: 'Jit Mohanty',
      photoURL: null,
      message: `Added this to my watchlist already. The close approach timeline is super helpful for tracking when it comes near again.`,
      room: `asteroid_${asteroidId}`,
      asteroidId,
      parentId: `seed_default_1_${asteroidId}`,
      createdAt: new Date(now - 1 * hr - 45 * min).toISOString(),
    },
    {
      id: `seed_default_4_${asteroidId}`,
      userId: 'user_jyoti_ps',
      displayName: 'Jyoti Prakash Swain',
      photoURL: null,
      message: `Does anyone know if NASA's Sentry system has this one flagged? The risk score here seems moderate but I want to cross-check.`,
      room: `asteroid_${asteroidId}`,
      asteroidId,
      parentId: null,
      createdAt: new Date(now - 1 * hr - 30 * min).toISOString(),
    },
    {
      id: `seed_default_5_${asteroidId}`,
      userId: 'user_jit_m',
      displayName: 'Jit Mohanty',
      photoURL: null,
      message: `I checked — it's not on the Sentry risk table currently. The miss distance is large enough that there's no impact probability in the next 100 years.`,
      room: `asteroid_${asteroidId}`,
      asteroidId,
      parentId: `seed_default_4_${asteroidId}`,
      createdAt: new Date(now - 1 * hr - 10 * min).toISOString(),
    },
    {
      id: `seed_default_6_${asteroidId}`,
      userId: 'user_jyoti_rd',
      displayName: 'Jyoti Ranjan Das',
      photoURL: null,
      message: `Good to know. Still, it's fascinating how many NEOs pass within a few lunar distances. This platform makes it so easy to track them all in one place.`,
      room: `asteroid_${asteroidId}`,
      asteroidId,
      parentId: `seed_default_4_${asteroidId}`,
      createdAt: new Date(now - 55 * min).toISOString(),
    },
    {
      id: `seed_default_7_${asteroidId}`,
      userId: 'user_jit_m',
      displayName: 'Jit Mohanty',
      photoURL: null,
      message: `The comparison with famous asteroids like Apophis and Bennu really puts the size into perspective. Love that feature.`,
      room: `asteroid_${asteroidId}`,
      asteroidId,
      parentId: null,
      createdAt: new Date(now - 40 * min).toISOString(),
    },
    {
      id: `seed_default_8_${asteroidId}`,
      userId: 'user_jyoti_ps',
      displayName: 'Jyoti Prakash Swain',
      photoURL: null,
      message: `Agreed! I ran the impact simulator on this one just for fun. Even at this size, the energy would be massive. Scary stuff but great educational tool.`,
      room: `asteroid_${asteroidId}`,
      asteroidId,
      parentId: `seed_default_7_${asteroidId}`,
      createdAt: new Date(now - 25 * min).toISOString(),
    },
  ];

  return defaultThread;
}

export default function AsteroidChat({ asteroidId, asteroidName }) {
  const { user, isAuthenticated } = useAuth();
  const [liveMessages, setLiveMessages] = useState([]);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const [sortBy, setSortBy] = useState('newest');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const room = `asteroid_${asteroidId}`;

  // Seed messages for this asteroid
  const seedMessages = getSeedMessages(asteroidId, asteroidName);

  // Merge seed + live (live messages override seeds with same id)
  const messages = [...seedMessages, ...liveMessages];

  // Real-time listener for this asteroid's chat
  useEffect(() => {
    const q = query(
      collection(db, 'chat_messages'),
      where('room', '==', room),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setLiveMessages(msgs.reverse());
    }, (error) => {
      // Firestore may fail (quota/permissions) — seed data still shows
      console.warn('Chat listener error (seed data still visible):', error.message);
    });

    return () => unsubscribe();
  }, [room]);

  const handleSend = async () => {
    if (!input.trim() || sending || !isAuthenticated) return;

    try {
      setSending(true);
      await addDoc(collection(db, 'chat_messages'), {
        userId: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Explorer',
        photoURL: user.photoURL || null,
        message: input.trim().slice(0, 500),
        room,
        asteroidId,
        parentId: replyTo?.id || null,
        createdAt: new Date().toISOString(),
        upvotes: [],
        downvotes: [],
      });
      setInput('');
      setReplyTo(null);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReply = (msg) => {
    setReplyTo(msg);
    inputRef.current?.focus();
  };

  const toggleCollapse = (msgId) => {
    setCollapsed(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Build thread structure
  const rootMessages = messages.filter(m => !m.parentId);
  const replies = messages.filter(m => m.parentId);

  const getReplyCount = (msgId) => {
    return replies.filter(r => r.parentId === msgId).length;
  };

  const getReplies = (msgId) => {
    return replies.filter(r => r.parentId === msgId);
  };

  // Sort root messages
  const sortedRoots = [...rootMessages].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    // 'hot' — most replies
    return getReplyCount(b.id) - getReplyCount(a.id);
  });

  const getInitials = (name) => {
    if (!name) return '?';
    return name.slice(0, 2).toUpperCase();
  };

  const uniqueUsers = new Set(messages.map(m => m.userId));

  const renderMessage = (msg, isReply = false) => {
    const isOwn = msg.userId === user?.uid;
    const replyCount = getReplyCount(msg.id);
    const threadReplies = getReplies(msg.id);
    const isCollapsed = collapsed[msg.id];

    return (
      <div key={msg.id} className={`thread-item ${isReply ? 'is-reply' : 'is-root'}`}>
        <div className="thread-line-container">
          {!isReply && replyCount > 0 && (
            <div className="thread-line" />
          )}
        </div>
        <div className="thread-content">
          {/* Author row */}
          <div className="thread-author-row">
            <div className="thread-avatar" style={{
              background: isOwn ? 'linear-gradient(135deg, var(--accent), var(--accent2))' : 'rgba(138, 99, 255, 0.3)',
              color: isOwn ? '#05060c' : '#fff'
            }}>
              {msg.photoURL
                ? <img src={msg.photoURL} alt="" className="thread-avatar-img" />
                : getInitials(msg.displayName)
              }
            </div>
            <span className={`thread-username ${isOwn ? 'is-own' : ''}`}>
              {isOwn ? 'You' : msg.displayName}
            </span>
            <span className="thread-dot">·</span>
            <span className="thread-time">{formatTimestamp(msg.createdAt)}</span>
          </div>

          {/* Message body */}
          <div className="thread-body">
            <p>{msg.message}</p>
          </div>

          {/* Actions */}
          <div className="thread-actions">
            {isAuthenticated && !isReply && (
              <button className="thread-action-btn" onClick={() => handleReply(msg)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 17 4 12 9 7" />
                  <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                </svg>
                Reply
              </button>
            )}

            {!isReply && replyCount > 0 && (
              <button className="thread-action-btn thread-collapse-btn" onClick={() => toggleCollapse(msg.id)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {isCollapsed
                    ? <><polyline points="6 9 12 15 18 9" /></>
                    : <><polyline points="18 15 12 9 6 15" /></>
                  }
                </svg>
                {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>

          {/* Thread replies */}
          {!isReply && !isCollapsed && replyCount > 0 && (
            <div className="thread-replies">
              {threadReplies.map(reply => renderMessage(reply, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="asteroid-chat-section">
      <header className="asteroid-chat-header">
        <div>
          <p className="eyebrow">Community Discussion</p>
          <h2>Discussion on {asteroidName}</h2>
        </div>
        <div className="chat-meta">
          <span className="chat-meta-item">{messages.length} comments</span>
          <span className="chat-meta-dot">·</span>
          <span className="chat-meta-item">{uniqueUsers.size} participants</span>
        </div>
      </header>

      {/* Sort bar */}
      <div className="chat-sort-bar">
        <span className="sort-label">Sort by:</span>
        {['newest', 'oldest', 'hot'].map(opt => (
          <button
            key={opt}
            className={`sort-btn ${sortBy === opt ? 'active' : ''}`}
            onClick={() => setSortBy(opt)}
          >
            {opt === 'hot' ? 'Most Discussed' : opt.charAt(0).toUpperCase() + opt.slice(1)}
          </button>
        ))}
      </div>

      {/* Compose box */}
      {isAuthenticated ? (
        <div className="chat-compose">
          {replyTo && (
            <div className="reply-indicator">
              <span>Replying to <strong>{replyTo.displayName}</strong>: "{replyTo.message.slice(0, 60)}{replyTo.message.length > 60 ? '...' : ''}"</span>
              <button className="reply-cancel" onClick={() => setReplyTo(null)}>✕</button>
            </div>
          )}
          <div className="compose-row">
            <div className="compose-avatar" style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              color: '#05060c'
            }}>
              {user?.photoURL
                ? <img src={user.photoURL} alt="" className="thread-avatar-img" />
                : getInitials(user?.displayName)
              }
            </div>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={replyTo ? `Reply to ${replyTo.displayName}...` : `Share your thoughts on ${asteroidName}...`}
              disabled={sending}
              maxLength={500}
              rows={2}
              className="compose-input"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="compose-send"
            >
              {sending ? '...' : ''}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
          <span className="compose-hint">{input.length}/500 · Enter to send</span>
        </div>
      ) : (
        <div className="chat-login-prompt">
          <p>Sign in to join the discussion about this asteroid</p>
        </div>
      )}

      {/* Messages thread */}
      <div className="thread-list">
        {sortedRoots.length === 0 ? (
          <div className="thread-empty">
            <div className="thread-empty-icon">💬</div>
            <p>No discussion yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          sortedRoots.map(msg => renderMessage(msg))
        )}
        <div ref={messagesEndRef} />
      </div>
    </section>
  );
}
