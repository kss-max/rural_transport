import request from './api'

export function fetchCurrentUser() {
  return request('/auth/me')
}

export function login({ email, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}

export function register({ email, password, role }) {
  return request('/auth/register', {
    method: 'POST',
    body: { email, password, role },
  })
}

export function registerDriver({ email, password, role = 'DRIVER' }) {
  return request('/auth/register', {
    method: 'POST',
    body: { email, password, role },
  })
}

export function logout() {
  return request('/auth/logout', {
    method: 'POST',
  })
}
