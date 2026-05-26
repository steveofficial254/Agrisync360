import React, { useState } from 'react';
import { aiAPI } from '../../api/ai';
import Button from '../../components/common/Button';

export default function AIAssistant() {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = { sender: 'user', text: message };
    setChat((prev) => [...prev, userMessage]);
    setMessage('');
    setLoading(true);
    setError(null);

    try {
      const response = await aiAPI.chat(userMessage.text);
      if (response.data?.success) {
        setChat((prev) => [...prev, { sender: 'ai', text: response.data.data.response }]);
      } else {
        setError('Failed to get AI response');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      // Gracefully handle missing API key or other errors
      setChat((prev) => [...prev, { sender: 'ai', text: "I'm currently unavailable or missing API key." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">AI Assistant</h1>
      <div className="bg-white rounded-lg shadow p-4 flex flex-col h-[600px]">
        <div className="flex-1 overflow-y-auto mb-4 border p-4 rounded bg-gray-50">
          {chat.length === 0 ? (
            <p className="text-gray-500 text-center mt-10">Ask me anything about farming!</p>
          ) : (
            chat.map((msg, idx) => (
              <div key={idx} className={`mb-4 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-lg max-w-[75%] ${msg.sender === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  {msg.text}
                </div>
              </div>
            ))
          )}
          {loading && <div className="text-gray-500">AI is typing...</div>}
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        </div>
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            className="flex-1 border rounded p-2 focus:ring-primary-500 focus:border-primary-500"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your question..."
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !message.trim()} variant="primary">Send</Button>
        </form>
      </div>
    </div>
  );
}
