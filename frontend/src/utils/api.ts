// Module-level token state — initialized from localStorage
let _token: string | null = localStorage.getItem('authToken')
let _onUnauthorized: (() => void) | null = null

export function setToken(token: string) {
  _token = token
  localStorage.setItem('authToken', token)
}

export function clearToken() {
  _token = null
  localStorage.removeItem('authToken')
}

export function getToken(): string | null {
  return _token
}

export function registerUnauthorizedHandler(cb: () => void) {
  _onUnauthorized = cb
}

/** Drop-in replacement for `fetch` that attaches the Bearer token automatically. */
export async function apiFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers((init.headers as HeadersInit | undefined) ?? {})
  if (_token) {
    headers.set('Authorization', `Bearer ${_token}`)
  }
  const res = await fetch(input, { ...init, headers })
  if (res.status === 401) {
    clearToken()
    _onUnauthorized?.()
  }
  return res
}
