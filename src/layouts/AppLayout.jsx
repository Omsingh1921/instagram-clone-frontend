import stompClient from '../services/websocket';
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  Compass,
  Film,
  MessageCircle,
  Heart,
  PlusSquare,
  Settings,
  ShieldAlert,
  Menu,
  Sun,
  Moon,
  LogOut,
  Instagram,
  X,
  Mail,
  FileText,
  ChevronRight,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';
import Avatar from '../components/common/Avatar';
import CreateModal from '../components/modals/CreateModal';
import CreatePostModal from '../components/modals/CreatePostModal';
import CreateStoryModal from '../components/modals/CreateStoryModal';
import CreateReelModal from '../components/modals/CreateReelModal';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notification.service';
import './AppLayout.css';

export const AppLayout = () => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('app_theme') || 'dark'
  );
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [createReelOpen, setCreateReelOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile drawer & popups on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMoreMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  // Real-time unread notification count
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await notificationService.getUnreadCount();
        const count = res?.data ?? res ?? 0;
        setUnreadNotifications(Number(count) || 0);
      } catch {
        // Ignore fallback
      }
    };

    fetchUnreadCount();

    // Subscribe to websocket for live notifications
    let unsubscribe;
    if (stompClient && stompClient.connected) {
      unsubscribe = stompClient.subscribe('/user/queue/notifications', () => {
        setUnreadNotifications((prev) => prev + 1);
      });
    }

    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, location.pathname]);

  const isAdmin =
    user?.role === 'ADMIN' ||
    user?.role === 'ROLE_ADMIN' ||
    user?.authorities?.some(
      (a) => a.authority === 'ROLE_ADMIN' || a === 'ROLE_ADMIN'
    );

  return (
    <div className="instagram-app-layout">
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <NavLink to="/" className="brand-link" aria-label="Instagram Home">
          <span className="brand-logo-text">Instagram</span>
        </NavLink>

        <div className="mobile-header-actions">
          <NavLink
            to="/search"
            className="mobile-icon-btn"
            aria-label="Search"
            title="Search"
          >
            <Search size={22} />
          </NavLink>

          <NavLink
            to="/notifications"
            className="mobile-icon-btn"
            aria-label="Notifications"
            title="Notifications"
          >
            <Heart size={22} />
            {unreadNotifications > 0 && <span className="nav-badge-dot" />}
          </NavLink>

          <NavLink
            to="/messages"
            className="mobile-icon-btn"
            aria-label="Messages"
            title="Direct Messages"
          >
            <MessageCircle size={22} />
          </NavLink>

          <button
            type="button"
            className="mobile-icon-btn mobile-menu-trigger"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open mobile menu"
            title="Menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer / Action Sheet */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="mobile-drawer-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <div className="sheet-drag-handle" />

            {/* Sheet Header with User Overview */}
            <div className="sheet-header">
              <div className="sheet-user-info">
                <Avatar
                  src={user?.avatarUrl || user?.profilePictureUrl}
                  alt={user?.username || 'Profile'}
                  size="sm"
                />
                <div className="sheet-user-meta">
                  <div className="sheet-username-row">
                    <span className="sheet-username">@{user?.username}</span>
                    {isAdmin && (
                      <span className="sheet-admin-badge">ADMIN</span>
                    )}
                  </div>
                  <span className="sheet-fullname">
                    {user?.displayName || user?.fullName || 'Instagram User'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Theme Switcher */}
            <div className="sheet-theme-row">
              <div className="sheet-theme-label">
                {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                <span>{theme === 'dark' ? 'Dark Theme' : 'Light Theme'}</span>
              </div>
              <button
                type="button"
                className="sheet-theme-toggle-btn"
                onClick={toggleTheme}
              >
                Switch to {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>

            {/* Main Links */}
            <div className="sheet-links-list">
              <NavLink
                to={`/profile/${user?.id || ''}`}
                className="sheet-nav-item"
              >
                <UserIcon size={20} />
                <span>My Profile</span>
                <ChevronRight size={16} className="sheet-arrow" />
              </NavLink>

              <NavLink to="/explore" className="sheet-nav-item">
                <Compass size={20} />
                <span>Explore</span>
                <ChevronRight size={16} className="sheet-arrow" />
              </NavLink>

              <NavLink to="/settings" className="sheet-nav-item">
                <Settings size={20} />
                <span>Settings & Privacy</span>
                <ChevronRight size={16} className="sheet-arrow" />
              </NavLink>

              {/* Admin Section if Admin */}
              {isAdmin && (
                <div className="sheet-admin-section">
                  <div className="sheet-section-title">
                    <ShieldAlert size={16} />
                    <span>ADMIN STUDIO</span>
                  </div>

                  <NavLink to="/admin" end className="sheet-nav-item admin-link">
                    <ShieldAlert size={18} />
                    <span>User Management</span>
                    <ChevronRight size={16} className="sheet-arrow" />
                  </NavLink>

                  <NavLink to="/admin/reports" className="sheet-nav-item admin-link">
                    <FileText size={18} />
                    <span>Content Reports</span>
                    <ChevronRight size={16} className="sheet-arrow" />
                  </NavLink>

                  <NavLink to="/admin/email" className="sheet-nav-item admin-link">
                    <Mail size={18} />
                    <span>Dynamic Email & Templates</span>
                    <ChevronRight size={16} className="sheet-arrow" />
                  </NavLink>
                </div>
              )}
            </div>

            {/* Sheet Footer Logout */}
            <div className="sheet-footer">
              <button
                type="button"
                className="sheet-logout-btn"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar Navigation */}
      <aside className="desktop-sidebar">
        <div className="sidebar-brand-zone">
          <NavLink to="/" className="brand-link" aria-label="Instagram Home">
            <span className="brand-logo-text">Instagram</span>
          </NavLink>
        </div>

        <nav className="sidebar-nav-list" aria-label="Main Navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <div className="nav-icon-wrapper">
              <Home size={24} />
            </div>
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/search"
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <div className="nav-icon-wrapper">
              <Search size={24} />
            </div>
            <span>Search</span>
          </NavLink>

          <NavLink
            to="/explore"
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <div className="nav-icon-wrapper">
              <Compass size={24} />
            </div>
            <span>Explore</span>
          </NavLink>

          <NavLink
            to="/reels"
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <div className="nav-icon-wrapper">
              <Film size={24} />
            </div>
            <span>Reels</span>
          </NavLink>

          <NavLink
            to="/messages"
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <div className="nav-icon-wrapper">
              <MessageCircle size={24} />
            </div>
            <span>Messages</span>
          </NavLink>

          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <div className="nav-icon-wrapper">
              <Heart size={24} />
              {unreadNotifications > 0 && (
                <span className="nav-badge-count">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </div>
            <span>Notifications</span>
          </NavLink>

          <button
            type="button"
            className="sidebar-nav-item"
            onClick={() => setCreateModalOpen(true)}
          >
            <div className="nav-icon-wrapper">
              <PlusSquare size={24} />
            </div>
            <span>Create</span>
          </button>

          <NavLink
            to={`/profile/${user?.id || ''}`}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <div className="nav-icon-wrapper">
              <Avatar
                src={user?.avatarUrl || user?.profilePictureUrl}
                alt={user?.username || 'Profile'}
                size="xs"
              />
            </div>
            <span>Profile</span>
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <div className="nav-icon-wrapper">
                <ShieldAlert
                  size={24}
                  style={{ color: 'var(--color-warning, #f59e0b)' }}
                />
              </div>
              <span>Admin Studio</span>
            </NavLink>
          )}
        </nav>

        {/* Sidebar Footer / More Menu */}
        <div className="sidebar-footer">
          {moreMenuOpen && (
            <div className="more-popup-menu">
              <button
                type="button"
                className="more-menu-item"
                onClick={() => {
                  setMoreMenuOpen(false);
                  navigate('/settings');
                }}
              >
                <Settings size={18} />
                <span>Settings</span>
              </button>
              <button
                type="button"
                className="more-menu-item"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                <span>Switch theme</span>
              </button>
              <button
                type="button"
                className="more-menu-item logout-item"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                <span>Log out</span>
              </button>
            </div>
          )}

          <button
            type="button"
            className="sidebar-nav-item"
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
          >
            <div className="nav-icon-wrapper">
              <Menu size={24} />
            </div>
            <span>More</span>
          </button>
        </div>
      </aside>

      {/* Main Outlet */}
      <main className="app-main-content">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `mobile-nav-item ${isActive ? 'active' : ''}`
          }
          aria-label="Home"
        >
          <Home size={24} />
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) =>
            `mobile-nav-item ${isActive ? 'active' : ''}`
          }
          aria-label="Search"
        >
          <Search size={24} />
        </NavLink>

        <button
          type="button"
          className="mobile-nav-item create-highlight-btn"
          onClick={() => setCreateModalOpen(true)}
          aria-label="Create Post"
        >
          <PlusSquare size={26} />
        </button>

        <NavLink
          to="/reels"
          className={({ isActive }) =>
            `mobile-nav-item ${isActive ? 'active' : ''}`
          }
          aria-label="Reels"
        >
          <Film size={24} />
        </NavLink>

        <NavLink
          to={`/profile/${user?.id || ''}`}
          className={({ isActive }) =>
            `mobile-nav-item ${isActive ? 'active' : ''}`
          }
          aria-label="My Profile"
        >
          <Avatar
            src={user?.avatarUrl || user?.profilePictureUrl}
            alt={user?.username || 'Profile'}
            size="xs"
          />
        </NavLink>
      </nav>

      {/* Modals */}
      <CreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSelectPost={() => setCreatePostOpen(true)}
        onSelectStory={() => setCreateStoryOpen(true)}
        onSelectReel={() => setCreateReelOpen(true)}
      />

      <CreatePostModal
        isOpen={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onPostCreated={() => {
          window.dispatchEvent(new Event('feed:refresh'));
        }}
      />

      <CreateStoryModal
        isOpen={createStoryOpen}
        onClose={() => setCreateStoryOpen(false)}
        onStoryCreated={() => {
          window.dispatchEvent(new Event('story:refresh'));
        }}
      />

      <CreateReelModal
        isOpen={createReelOpen}
        onClose={() => setCreateReelOpen(false)}
        onReelCreated={() => {
          window.dispatchEvent(new Event('reel:refresh'));
        }}
      />
    </div>
  );
};

export default AppLayout;
