import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  School,
  MessageSquare,
  Image
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminSidebar = ({ className = '', onNavigate = () => {} }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin/dashboard',
      active: location.pathname === '/admin/dashboard'
    },
    {
      title: 'Events',
      icon: Calendar,
      path: '/admin/events',
      active: location.pathname.includes('/admin/events')
    },
    {
      title: 'Hero Banners',
      icon: Image,
      path: '/admin/banners',
      active: location.pathname === '/admin/banners'
    },
    {
      title: 'Participants',
      icon: Users,
      path: '/admin/participants',
      active: location.pathname === '/admin/participants'
    },
    {
      title: 'Messages',
      icon: MessageSquare,
      path: '/admin/messages',
      active: location.pathname === '/admin/messages'
    }
  ];

  const handleLogout = () => {
    logout();
    onNavigate();
  };

  return (
    <div className={`w-64 bg-white border-r border-gray-200 h-full md:h-screen flex flex-col ${className}`}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img 
            src={`${process.env.PUBLIC_URL}/edufes.tlogo.png`}
            alt="EduFest Logo" 
            className="w-10 h-10 object-contain"
            onError={(e) => {
              console.error('Logo failed to load:', e.target.src);
              e.target.style.display = 'none';
            }}
          />
          <div>
            <h1 className="text-lg font-bold text-gray-800">EduFest Admin</h1>
            <p className="text-sm text-gray-500">SMKN 4 Bogor</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link
                to={item.path}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  item.active
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <item.icon className={`w-5 h-5 ${item.active ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className="font-medium">{item.title}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-2">
          <Link
            to="/admin/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all duration-200"
          >
            <Settings className="w-5 h-5 text-gray-500" />
            <span className="font-medium">Settings</span>
          </Link>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
