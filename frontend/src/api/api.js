const API_BASE_URL = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const { headers, ...restOptions } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export async function checkBackendHealth() {
  return request('/health');
}

export async function registerUser(userData) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function loginUser(userData) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function getCurrentUser() {
  const token = localStorage.getItem('streamforgeToken');

  return request('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createStream(streamData) {
  const token = localStorage.getItem('streamforgeToken');

  return request('/streams/create', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(streamData),
  });
}

export async function getStreams() {
  return request('/streams');
}

export async function getMyStreamHistory() {
  const token = localStorage.getItem('streamforgeToken');

  return request('/streams/history/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
