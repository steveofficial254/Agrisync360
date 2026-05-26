import React, { useState, useEffect } from 'react';
import { communityAPI } from '../../api/community';
import Button from '../../components/common/Button';

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await communityAPI.getPosts();
      if (res.data?.success) setPosts(res.data.data);
    } catch (err) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await communityAPI.createPost({ title, content, category });
      if (res.data?.success) {
        setTitle('');
        setContent('');
        fetchPosts(); // Refresh list
      }
    } catch (err) {
      setError('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Farming Community</h1>
      
      {/* Create Post */}
      <div className="bg-white p-4 rounded-lg shadow mb-8">
        <h2 className="text-lg font-semibold mb-4">Create a Post</h2>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input className="border p-2 rounded" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea className="border p-2 rounded" placeholder="What's on your mind?" value={content} onChange={(e) => setContent(e.target.value)} rows="3" required />
          <select className="border p-2 rounded" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="general">General</option>
            <option value="market">Market</option>
            <option value="advisory">Advisory</option>
          </select>
          <Button type="submit" disabled={submitting} variant="primary" className="self-end">Post</Button>
        </form>
      </div>

      {/* Post List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Posts</h2>
        {loading ? (
          <p>Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="text-gray-500">No posts yet. Be the first to start a discussion!</p>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{post.title}</h3>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{post.category}</span>
                </div>
                <p className="text-gray-700 mb-2">{post.content}</p>
                <div className="text-xs text-gray-400">
                  Posted {new Date(post.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
