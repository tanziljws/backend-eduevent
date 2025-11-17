import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Menu, User, X, Home, Calendar, LogOut, Settings, Info, Phone } from 'lucide-react';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  
  // Define pages where navbar should be hidden (use after hooks to obey rules-of-hooks)
  const authPages = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Navigation items for different user types
  const publicNavigationItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/events', label: 'Event', icon: Calendar },
    { path: '/contact', label: 'Contact', icon: Phone },
  ];

  // Removed Riwayat from top navigation as requested

  // Check if user is admin
  const isAdmin = user && (user.role === 'admin' || user.is_admin);
  
  // Build navigation based on user type
  let navigationItems = isAdmin ? [] : [...publicNavigationItems];

  // If admin, force redirect to admin dashboard when outside admin pages
  useEffect(() => {
    if (isAdmin) {
      const onAdminPage = location.pathname.startsWith('/admin');
      if (!onAdminPage) {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [isAdmin, location.pathname, navigate]);

  // Safely decide if navbar should be hidden (after hooks have been declared)
  const hideNavbar = authPages.includes(location.pathname);
  if (hideNavbar) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src={`${process.env.PUBLIC_URL}/edufes.tlogo.png`}
              alt="EduFest Logo" 
              className="h-10 w-10 object-contain"
              onError={(e) => {
                console.error('Logo failed to load:', e.target.src);
                e.target.style.display = 'none';
              }}
            />
            <div className="text-xl font-bold">
              <span className="text-blue-600">EDU</span><span className="text-blue-500">FEST</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Admin Badge */}
                {/* Hide Admin Panel button as requested */}
                
                {/* User Info with dropdown */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileMenuOpen(v => !v)}
                    className="flex items-center space-x-3 px-3 py-1.5 bg-gray-50 rounded-lg hover:bg-gray-100"
                    aria-haspopup="menu"
                    aria-expanded={isProfileMenuOpen}
                    title="User menu"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-medium text-gray-900 truncate max-w-32">{user.name}</span>
                      {isAdmin && <span className="text-xs text-purple-600 font-medium">Administrator</span>}
                    </div>
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                      {/* My Riwayat - only for regular users, not admin */}
                      {!isAdmin && (
                        <Link
                          to="/profile"
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>My Riwayat</span>
                        </Link>
                      )}
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        onClick={handleLogout}
                      >
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:text-blue-600 hover:border-blue-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="md:hidden text-gray-600 hover:text-blue-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 text-base font-medium transition-colors ${
                      isActive(item.path)
                        ? 'text-blue-600'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
              
              {/* Mobile User Actions */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                {user ? (
                  <div className="px-3 py-2 space-y-4">
                    {/* User Info */}
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        {isAdmin && <div className="text-xs text-purple-600 font-medium">Administrator</div>}
                      </div>
                    </div>
                    
                    {/* My Profile Link - only for regular users, not admin */}
                    {!isAdmin && (
                    <Link
                        to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <User className="w-4 h-4 mr-2" />
                        My Profile
                    </Link>
                    )}

                    {/* Admin Panel Link */}
                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg text-sm font-medium"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                    
                    {/* Logout Button */}
                    <Button 
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="px-3 py-2 space-y-3">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-center w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-center w-full px-4 py-3 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Daftar
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
