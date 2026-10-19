import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import axios from 'axios';
import api from '../services/api';

describe('Frontend API Interceptor & Refresh Token Rotation Suite', () => {
  const originalAdapter = api.defaults.adapter;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    // Mock api default adapter to return simulated response without network requests
    api.defaults.adapter = async (config) => ({
      data: { success: true, retriedUrl: config.url },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  });

  afterAll(() => {
    api.defaults.adapter = originalAdapter;
  });

  it('1. Persists both new accessToken and rotated refreshToken upon 401 refresh', async () => {
    localStorage.setItem('access_token', 'expired-access-token');
    localStorage.setItem('refresh_token', 'initial-refresh-token');

    const postSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          accessToken: 'rotated-access-token-999',
          refreshToken: 'rotated-refresh-token-888',
        },
      },
    });

    const originalRequest = {
      headers: {},
      url: '/users/me',
    };

    const error = {
      response: { status: 401, data: { message: 'Token expired' } },
      config: originalRequest,
    };

    const responseInterceptor = api.interceptors.response.handlers[0];

    const res = await responseInterceptor.rejected(error);

    // Verify refresh endpoint was called with current refresh_token
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledWith(
      expect.stringContaining('/auth/refresh'),
      { refreshToken: 'initial-refresh-token' }
    );

    // Verify new tokens are saved in localStorage
    expect(localStorage.getItem('access_token')).toBe('rotated-access-token-999');
    expect(localStorage.getItem('refresh_token')).toBe('rotated-refresh-token-888');

    // Verify retried request had new authorization header
    expect(originalRequest.headers.Authorization).toBe('Bearer rotated-access-token-999');
    expect(res).toBeDefined();

    postSpy.mockRestore();
  });

  it('2. Collapses concurrent 401 errors into a single refresh request', async () => {
    localStorage.setItem('access_token', 'expired-access');
    localStorage.setItem('refresh_token', 'shared-refresh');

    let resolveRefresh;
    const refreshPromise = new Promise((resolve) => {
      resolveRefresh = resolve;
    });

    const postSpy = vi.spyOn(axios, 'post').mockImplementation(() => refreshPromise);

    const req1 = { headers: {}, url: '/posts' };
    const req2 = { headers: {}, url: '/stories' };

    const err1 = { response: { status: 401 }, config: req1 };
    const err2 = { response: { status: 401 }, config: req2 };

    const responseInterceptor = api.interceptors.response.handlers[0];

    // Trigger two concurrent 401 rejections
    const p1 = responseInterceptor.rejected(err1);
    const p2 = responseInterceptor.rejected(err2);

    // Resolve the single refresh call
    resolveRefresh({
      data: {
        data: {
          accessToken: 'fresh-acc',
          refreshToken: 'fresh-ref',
        },
      },
    });

    const [res1, res2] = await Promise.all([p1, p2]);

    // Ensure refresh was invoked exactly once
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('access_token')).toBe('fresh-acc');
    expect(localStorage.getItem('refresh_token')).toBe('fresh-ref');
    expect(req1.headers.Authorization).toBe('Bearer fresh-acc');
    expect(req2.headers.Authorization).toBe('Bearer fresh-acc');
    expect(res1).toBeDefined();
    expect(res2).toBeDefined();

    postSpy.mockRestore();
  });

  it('3. Clears credentials and fires logout on failed refresh', async () => {
    localStorage.setItem('access_token', 'bad-access');
    localStorage.setItem('refresh_token', 'revoked-refresh');

    const logoutEventSpy = vi.fn();
    window.addEventListener('auth:logout', logoutEventSpy);

    const postSpy = vi.spyOn(axios, 'post').mockRejectedValueOnce({
      response: { status: 401, data: { message: 'Refresh token revoked' } },
    });

    const req = { headers: {}, url: '/profile' };
    const err = { response: { status: 401 }, config: req };

    const responseInterceptor = api.interceptors.response.handlers[0];

    await expect(responseInterceptor.rejected(err)).rejects.toBeDefined();

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(logoutEventSpy).toHaveBeenCalled();

    window.removeEventListener('auth:logout', logoutEventSpy);
    postSpy.mockRestore();
  });
});
