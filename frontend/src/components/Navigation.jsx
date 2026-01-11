import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  const navItems = [
    { name: 'Start Demo', path: '/start-call' },
    { name: 'Templates', path: '/templates' },
    { name: 'Analytics', path: '/analytics' },
  ];

  const isActive = (path) => {
    return location.pathname === path ||
           (path === '/start-call' && location.pathname === '/');
  };

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <h1
              className="text-2xl font-bold text-white cursor-pointer hover:scale-105 transition-transform"
              onClick={() => navigate('/')}
            >
              HALO AI
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="flex space-x-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`group relative px-6 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                  isActive(item.path)
                    ? 'glass-button text-white shadow-lg'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{item.name}</span>
                {isActive(item.path) && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 rounded-xl font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
