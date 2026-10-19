import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';
import userService from '../services/user.service';
import followService from '../services/follow.service';

const AuthContext = createContext(null);

const normalizeUserData = (userData) => {
  if (!userData) return null;
  const normalized = { ...userData };
  if (normalized.userId && !normalized.id) {
    normalized.id = normalized.userId;
  }
  if (normalized.id && !normalized.userId) {
    normalized.userId = normalized.id;
  }
  const avatar = normalized.avatarUrl || normalized.profilePictureUrl;
  if (avatar) {
    normalized.avatarUrl = avatar;
    normalized.profilePictureUrl = avatar;
  }
  return normalized;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [followingSet, setFollowingSet] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('following_ids') || '[]');
      return new Set(Array.isArray(saved) ? saved.map(String) : []);
    } catch {
      return new Set();
    }
  });

  const loadFollowing = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const res = await followService.getFollowing(userId, 0, 500);
      const items = res?.data?.content || res?.content || res?.data || [];
      const ids = items
        .map((item) => String(item.id || item.userId || ''))
        .filter(Boolean);
      const newSet = new Set(ids);
      setFollowingSet(newSet);
      try {
        localStorage.setItem('following_ids', JSON.stringify(Array.from(newSet)));
      } catch {
        // ignore storage error
      }
    } catch {
      // ignore
    }
  }, []);

  const isFollowing = useCallback(
    (targetUserId) => {
      if (!targetUserId) return false;
      return followingSet.has(String(targetUserId));
    },
    [followingSet]
  );

  const setFollowStatus = useCallback((targetUserId, isFollowed) => {
    if (!targetUserId) return;
    const key = String(targetUserId);
    setFollowingSet((prev) => {
      const next = new Set(prev);
      if (isFollowed) {
        next.add(key);
      } else {
        next.delete(key);
      }
      try {
        localStorage.setItem('following_ids', JSON.stringify(Array.from(next)));
      } catch {
        // ignore storage error
      }
      return next;
    });
  }, []);

  const toggleFollow = useCallback(
    async (targetUserId) => {
      if (!targetUserId) return false;
      const key = String(targetUserId);
      const currentlyFollowing = followingSet.has(key);
      const nextState = !currentlyFollowing;

      // Optimistically update
      setFollowingSet((prev) => {
        const next = new Set(prev);
        if (nextState) next.add(key);
        else next.delete(key);
        try {
          localStorage.setItem('following_ids', JSON.stringify(Array.from(next)));
        } catch {
          // ignore storage error
        }
        return next;
      });

      try {
        if (nextState) {
          await followService.followUser(key);
        } else {
          await followService.unfollowUser(key);
        }
        return nextState;
      } catch (err) {
        // Revert on error
        setFollowingSet((prev) => {
          const next = new Set(prev);
          if (currentlyFollowing) next.add(key);
          else next.delete(key);
          try {
            localStorage.setItem('following_ids', JSON.stringify(Array.from(next)));
          } catch {
            // ignore storage error
          }
          return next;
        });
        throw err;
      }
    },
    [followingSet]
  );

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await userService.getCurrentUser();
      const rawUser = response?.data || response;
      const userData = normalizeUserData(rawUser);
      setUser(userData);
      if (userData?.id) {
        loadFollowing(userData.id);
      }
      return userData;
    } catch {
      // If fetching profile fails (e.g., token invalid), clear credentials
      setUser(null);
      setToken(null);
      setFollowingSet(new Set());
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('following_ids');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loadFollowing]);

  useEffect(() => {
    const handleForcedLogout = () => {
      setUser(null);
      setToken(null);
      setFollowingSet(new Set());
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('following_ids');
      setIsLoading(false);
    };

    window.addEventListener('auth:logout', handleForcedLogout);

    const savedToken = localStorage.getItem('access_token');
    if (savedToken) {
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }

    return () => {
      window.removeEventListener('auth:logout', handleForcedLogout);
    };
  }, [fetchCurrentUser]);

  const login = (authData) => {
    const accessToken = authData.accessToken;
    const refreshToken = authData.refreshToken;
    const userData = normalizeUserData(authData.user);

    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }

    setToken(accessToken);
    setUser(userData);
    if (userData?.id) {
      loadFollowing(userData.id);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // Silently proceed with client cleanup
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('following_ids');
      setUser(null);
      setToken(null);
      setFollowingSet(new Set());
    }
  };

  const updateUser = (updatedProfile) => {
    setUser((prev) => (prev ? normalizeUserData({ ...prev, ...updatedProfile }) : normalizeUserData(updatedProfile)));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        followingSet,
        isFollowing,
        setFollowStatus,
        toggleFollow,
        loadFollowing,
        login,
        logout,
        updateUser,
        reloadUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
