import { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function ChatPanel() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time listener for chat messages
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chat_messages'),
      where('room', '==', 'general'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => {
        msgs.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Reverse to get chronological order (oldest first)
      setMessages(msgs.reverse());

      // Calculate online users (unique users in last 15 minutes)
      const fifteenMinutesAgo = new Date();
      fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

      const recentUsers = new Set();
      msgs.forEach((msg) => {
        const msgTime = new Date(msg.createdAt);
        if (msgTime >= fifteenMinutesAgo) {
          recentUsers.add(msg.userId);
        }
      });

      setOnlineCount(recentUsers.size);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    try {
      setSending(true);

      // Add message to Firestore (this triggers real-time update)
      await addDoc(collection(db, 'chat_messages'), {
        userId: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Explorer',
        message: input.trim(),
        room: 'general',
        createdAt: new Date().toISOString(),
      });

      setInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
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

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) return null;

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-nebula-purple text-white rounded-full shadow-lg flex items-center justify-center hover:bg-nebula-purple/80 transition-all hover:scale-110 z-50"
          title="Open Chat"
        >
          <span className="text-3xl">💬</span>
          {onlineCount > 0 && (
            <div className="absolute top-0 right-0 w-5 h-5 bg-success-green rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-xs font-bold">{onlineCount}</span>
            </div>
          )}
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-cosmic-black border border-nebula-purple/50 rounded-lg shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="bg-nebula-purple/30 border-b border-nebula-purple/50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">💬</span>
              <div>
                <h3 className="text-white font-semibold">COMMUNITY CHAT</h3>
                <p className="text-xs text-gray-400">{onlineCount} online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <div className="text-4xl mb-2">💬</div>
                <p className="text-sm">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwnMessage = msg.userId === user.uid;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-baseline gap-2 mb-1">
                      <span
                        className={`text-xs font-semibold ${
                          isOwnMessage ? 'text-star-blue' : 'text-nebula-purple'
                        }`}
                      >
                        {isOwnMessage ? 'You' : msg.displayName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(msg.createdAt)}
                      </span>
                    </div>
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg ${
                        isOwnMessage
                          ? 'bg-star-blue/20 text-white'
                          : 'bg-gray-800 text-gray-200'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.message}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-nebula-purple/50 p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                disabled={sending}
                maxLength={500}
                className="flex-1 bg-cosmic-black border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-star-blue focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="px-4 py-2 bg-star-blue text-white rounded hover:bg-star-blue/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? '...' : 'Send ➤'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {input.length}/500 • Press Enter to send
            </p>
          </div>
        </div>
      )}
    </>
  );
}
