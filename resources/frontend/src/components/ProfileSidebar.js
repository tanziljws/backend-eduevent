import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { User, LogOut, Lock, Heart, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NavItem = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  // Active state considers query params (section)
  const current = new URL(`http://x${location.pathname}${location.search}`);
  const target = new URL(`http://x${to}`);
  const currentSection = current.searchParams.get('section') || 'settings';
  const targetSection = target.searchParams.get('section') || 'settings';
  const active = current.pathname === target.pathname && currentSection === targetSection;
  return (
    <Link
      to={to}
      className={`group relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
        active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {/* Active bar */}
      <span
        className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r ${
          active ? 'bg-blue-600' : 'bg-transparent group-hover:bg-gray-300'
        }`}
      />
      <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
      {label}
    </Link>
  );
};

export default function ProfileSidebar() {
  const { logout, user } = useAuth();
  return (
    <Card className="bg-white/90 border-gray-200 shadow-sm rounded-lg">
      <CardContent className="p-4 space-y-3.5">
        <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500">Hai, {user?.name?.split(' ')[0] || 'Pengguna'}</div>
            <div className="text-sm font-semibold text-gray-900 truncate">{user?.name}</div>
            <div className="text-xs text-gray-600 truncate">{user?.email}</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 pt-0.5">
          <NavItem to="/profile?section=settings" icon={User} label="Pengaturan Akun" />
          <NavItem to="/profile?section=transactions" icon={Calendar} label="Daftar Event" />
          <NavItem to="/profile?section=wishlist" icon={Heart} label="My Wishlist" />
          <NavItem to="/profile?section=password" icon={Lock} label="Atur Kata Sandi" />
        </nav>

        <div className="pt-1.5">
          <Button
            onClick={logout}
            variant="outline"
            className="w-full h-9 px-3 text-[13px] border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
