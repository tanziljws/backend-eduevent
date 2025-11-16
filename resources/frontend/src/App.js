import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import components
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import EventRegistration from './pages/EventRegistration';
import Attendance from './pages/Attendance';
// import EventHistory from './pages/EventHistory';
// import Certificates from './pages/Certificates';
import Wishlist from './pages/Wishlist';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEvents from './pages/admin/AdminEvents';
import AdminBanners from './pages/admin/AdminBanners';
import AdminParticipants from './pages/admin/AdminParticipants';
import AdminMessages from './pages/admin/AdminMessages';
import AdminSettings from './pages/admin/AdminSettings';

// Auth context
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SessionProvider } from './contexts/SessionContext';

// Protected Route component
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

// Admin Route component - requires admin role
function AdminRoute({ children }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Check if user has admin role
  if (user.role !== 'admin' && !user.is_admin) {
    return <Navigate to="/profile?section=settings" />;
  }
  
  return children;
}

function App() {
  return (
    <AuthProvider>
      <SessionProvider>
        <Router>
          <div className="App min-h-screen bg-gray-900">
            <Navbar />
            <main className="main-content bg-gray-900">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/events/:id/register" element={<EventRegistration />} />
                <Route 
                  path="/events/:id/attendance" 
                  element={
                    <ProtectedRoute>
                      <Attendance />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/contact" element={<Contact />} />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/wishlist" 
                  element={
                    <ProtectedRoute>
                      <Wishlist />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/dashboard" 
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/events" 
                  element={
                    <AdminRoute>
                      <AdminEvents />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/banners" 
                  element={
                    <AdminRoute>
                      <AdminBanners />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/participants" 
                  element={
                    <AdminRoute>
                      <AdminParticipants />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/messages" 
                  element={
                    <AdminRoute>
                      <AdminMessages />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/settings" 
                  element={
                    <AdminRoute>
                      <AdminSettings />
                    </AdminRoute>
                  } 
                />
              </Routes>
            </main>
          </div>
        </Router>
      </SessionProvider>
    </AuthProvider>
  );
}

export default App;
