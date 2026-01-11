import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { setToken } from '../utils/auth';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(username, password);
      setToken(response.data.access_token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl float" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl float" style={{ animationDelay: '-3s' }} />

      <div className="glass-card rounded-2xl p-10 w-full max-w-md relative z-10 shimmer">
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl glow">
              <span className="text-white font-bold text-3xl">H</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">HALO AI</span>
          </h1>
          <p className="text-gray-600">AI-powered call automation platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="glass-input w-full px-4 py-3 rounded-xl text-gray-900 font-medium"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input w-full px-4 py-3 rounded-xl text-gray-900 font-medium"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="glass-dark rounded-xl px-4 py-3 border border-red-400/50">
              <p className="text-red-200 text-sm font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="glass-button w-full text-white font-semibold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed glow-hover flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Logging in...</span>
              </>
            ) : (
              <span>Login to Dashboard</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            <span className="font-medium">Default credentials:</span> admin / admin
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
