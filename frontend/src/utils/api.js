/**
 * API Fetch Client Wrapper
 */

const API_BASE_URL = '/api';

export async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  } catch (netErr) {
    throw new Error('Unable to connect to backend server. Please check your network connection or verify the backend service is running on port 8080.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (data.message) {
      throw new Error(data.message);
    }
    if (data.error) {
      throw new Error(data.error);
    }

    let defaultMsg;
    switch (response.status) {
      case 400:
        defaultMsg = 'Invalid request parameters. Please verify your input.';
        break;
      case 401:
        defaultMsg = 'Session expired or invalid credentials. Please log in again.';
        break;
      case 403:
        defaultMsg = 'Access Denied: You do not have permission to perform this action.';
        break;
      case 404:
        defaultMsg = 'The requested resource was not found.';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        defaultMsg = 'Backend server is currently unavailable. Please try again in a few moments.';
        break;
      default:
        defaultMsg = `API Request failed with status code ${response.status}.`;
    }
    throw new Error(defaultMsg);
  }

  return data;
}

export const authApi = {
  login: (credentials) => apiRequest('/auth/login', 'POST', credentials),
  register: (userData) => apiRequest('/auth/register', 'POST', userData),
  logout: (token) => apiRequest('/auth/logout', 'POST', null, token),
  sendOtp: (email) => apiRequest('/auth/send-otp', 'POST', { email }),
  verifyOtp: (email, otp) => apiRequest('/auth/verify-otp', 'POST', { email, otp }),
  sendForgotPasswordOtp: (email) => apiRequest('/auth/forgot-password/send-otp', 'POST', { email }),
  resetPassword: (email, otp, newPassword) => apiRequest('/auth/reset-password', 'POST', { email, otp, newPassword }),
};

export const vaultApi = {
  getItems: (token, category = '', favorite = false) => {
    let query = '';
    const params = [];
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    if (favorite) params.push(`favorite=true`);
    if (params.length > 0) query = `?${params.join('&')}`;
    return apiRequest(`/vault/items${query}`, 'GET', null, token);
  },

  getItemById: (id, token) => apiRequest(`/vault/items/${id}`, 'GET', null, token),

  createItem: (itemData, token) => apiRequest('/vault/items', 'POST', itemData, token),

  updateItem: (id, itemData, token) => apiRequest(`/vault/items/${id}`, 'PUT', itemData, token),

  deleteItem: (id, token) => apiRequest(`/vault/items/${id}`, 'DELETE', null, token),

  toggleFavorite: (id, token) => apiRequest(`/vault/items/${id}/favorite`, 'PATCH', null, token),

  updatePermissionLevel: (id, level, recipientEmail = '', token = null, encryptedPayload = null) => {
    let url = `/vault/items/${id}/permission?level=${encodeURIComponent(level)}`;
    if (recipientEmail && recipientEmail.trim()) {
      url += `&recipientEmail=${encodeURIComponent(recipientEmail.trim())}`;
    }
    return apiRequest(url, 'PATCH', encryptedPayload, token);
  },
};

export const securityApi = {
  getLogs: (token) => apiRequest('/auth/logs', 'GET', null, token),
  clearLogs: (token) => apiRequest('/auth/logs', 'DELETE', null, token),
  deleteLog: (id, token) => apiRequest(`/auth/logs/${id}`, 'DELETE', null, token),
  getSuspiciousActivities: (token) => apiRequest('/security/suspicious-activities', 'GET', null, token),
  getAlerts: (token) => apiRequest('/security/alerts', 'GET', null, token),
  markAlertRead: (id, token) => apiRequest(`/security/alerts/${id}/read`, 'PATCH', null, token),
  getAuditLogs: (token) => apiRequest('/security/audit-logs', 'GET', null, token),
  getAnalytics: (token) => apiRequest('/security/analytics', 'GET', null, token),
};

export const reportsApi = {
  getPasswordHealth: (token) => apiRequest('/reports/password-health', 'GET', null, token),
  getLoginActivity: (token) => apiRequest('/reports/login-activity', 'GET', null, token),
};

export const notificationApi = {
  getNotifications: (token) => apiRequest('/notifications', 'GET', null, token),
  getUnreadCount: (token) => apiRequest('/notifications/unread-count', 'GET', null, token),
  markRead: (id, token) => apiRequest(`/notifications/${id}/read`, 'PATCH', null, token),
  markAllRead: (token) => apiRequest('/notifications/read-all', 'PATCH', null, token),
  checkExpirations: (token) => apiRequest('/notifications/check-expirations', 'POST', null, token),
};



