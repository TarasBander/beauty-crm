import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  getStoredToken,
  messageFrom,
  request,
  setStoredToken,
  setUnauthorizedHandler,
} from './http'

function mockFetchOnce(status: number, body: unknown, ok = status >= 200 && status < 300) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status,
      json: () => Promise.resolve(body),
    }),
  )
}

describe('request() / ApiError parsing', () => {
  beforeEach(() => {
    localStorage.clear()
    setUnauthorizedHandler(null)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('turns a non-ok response with a string message into an ApiError carrying that message and status', async () => {
    mockFetchOnce(409, { message: 'Email вже використовується' })

    await expect(request('/clients')).rejects.toMatchObject({
      status: 409,
      message: 'Email вже використовується',
    })
    await expect(request('/clients')).rejects.toBeInstanceOf(ApiError)
  })

  it('joins a class-validator-style array of messages with a comma', async () => {
    // NestJS's ValidationPipe sends `message` as string[] when several
    // fields fail at once — the UI shows one line, so this has to
    // collapse to a single string, not "[object Object]" or similar.
    mockFetchOnce(400, { message: ['phone must be a valid phone number', 'email must be an email'] })

    await expect(request('/clients')).rejects.toMatchObject({
      status: 400,
      message: 'phone must be a valid phone number, email must be an email',
    })
  })

  it('falls back to a generic "HTTP {status}" when the body has neither message nor error', async () => {
    // e.g. a 502 from a proxy/load balancer with an HTML error page —
    // res.json() throws, the .catch(() => null) below turns that into
    // payload === null, and there's nothing to read a message from.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: () => Promise.reject(new Error('not JSON')),
      }),
    )

    await expect(request('/clients')).rejects.toMatchObject({
      status: 502,
      message: 'HTTP 502',
    })
  })

  it('reads `error` when `message` is absent (Nest\'s default exception shape)', async () => {
    mockFetchOnce(500, { error: 'Internal Server Error' });

    await expect(request('/clients')).rejects.toMatchObject({
      status: 500,
      message: 'Internal Server Error',
    })
  })

  it('on a 401 for a request that carried a token, clears the stored token and fires the unauthorized handler', async () => {
    setStoredToken('some.jwt.token')
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    mockFetchOnce(401, { message: 'Unauthorized' })

    await expect(request('/clients', { token: 'some.jwt.token' })).rejects.toBeInstanceOf(ApiError)

    expect(getStoredToken()).toBeNull()
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('on a 401 with NO token attached (a failed login, not a dead session), does not touch the stored token or fire the handler', async () => {
    // A wrong password also comes back as 401 — but request() never sent
    // a token on that call, so this must stay an ordinary form error,
    // not trigger the same "your session died" flow as an expired JWT.
    setStoredToken('still.valid.jwt')
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    mockFetchOnce(401, { message: 'Invalid credentials' })

    await expect(request('/auth/login', { method: 'POST', body: {} })).rejects.toBeInstanceOf(ApiError)

    expect(getStoredToken()).toBe('still.valid.jwt')
    expect(handler).not.toHaveBeenCalled()
  })

  it('resolves successfully and parses the JSON body when the response is ok', async () => {
    mockFetchOnce(200, { id: '1', firstName: 'Юлія' })

    await expect(request('/clients/1')).resolves.toEqual({ id: '1', firstName: 'Юлія' })
  })

  it('returns undefined for a 204 No Content instead of trying to parse an empty body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error('should not be called')),
      }),
    )

    await expect(request('/api-keys/1/revoke')).resolves.toBeUndefined()
  })
})

describe('messageFrom', () => {
  it('unwraps an ApiError to its own message, ignoring the fallback', () => {
    expect(messageFrom(new ApiError(400, 'Некоректний email'), 'fallback text')).toBe('Некоректний email')
  })

  it('uses the fallback for anything that is not an ApiError — a network failure, a plain Error, a thrown string', () => {
    expect(messageFrom(new TypeError('Failed to fetch'), 'fallback text')).toBe('fallback text')
    expect(messageFrom('boom', 'fallback text')).toBe('fallback text')
    expect(messageFrom(undefined, 'fallback text')).toBe('fallback text')
  })
})
