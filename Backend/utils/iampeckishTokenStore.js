/**
 * In-memory token storage for IAmPeckish API
 * 1. signAuthToken: User Access token returned by /auth/signin
 * 2. authToken: Connect Application access token / OAuth token
 * 3. tokenExpiry: Timestamp when authToken expires
 * 4. credentials: Saved credentials for automatic re-authentication
 * 5. refreshToken: OAuth 2.0 refresh token
 */

class PeckishTokenStore {
    constructor() {
        this.signAuthToken = null;
        this.authToken = null;
        this.tokenExpiry = null;
        this.credentials = null;
        this.refreshToken = null;
    }

    /**
     * Save OAuth 2.0 access & refresh tokens in memory
     */
    saveOAuthTokens(tokenData = {}) {
        const access_token =
            tokenData.access_token ||
            tokenData.accessToken ||
            tokenData.data?.access_token ||
            tokenData.data?.accessToken;

        const refresh_token =
            tokenData.refresh_token ||
            tokenData.refreshToken ||
            tokenData.data?.refresh_token ||
            tokenData.data?.refreshToken;

        const expires_in =
            tokenData.expires_in ||
            tokenData.expiresIn ||
            tokenData.data?.expires_in ||
            tokenData.data?.expiresIn ||
            1800;

        if (access_token) {
            this.authToken = access_token.startsWith("Bearer ") ? access_token.slice(7) : access_token;
            const ttlMs = Math.max((Number(expires_in) - 60) * 1000, 10000);
            this.tokenExpiry = new Date(Date.now() + ttlMs);
            console.log(`[iampeckishTokenStore] In-memory OAuth access_token saved. Expires at: ${this.tokenExpiry.toISOString()}`);
        }
        if (refresh_token) {
            this.refreshToken = refresh_token;
            console.log("[iampeckishTokenStore] In-memory OAuth refresh_token saved.");
        }
    }

    saveCredentials(credentials) {
        if (credentials) {
            this.credentials = credentials;
        }
    }

    /**
     * Save token returned by /auth/signin in memory
     * @param {string} token 
     * @param {{ email: string, password: string }} [credentials] 
     */
    saveSignAuthToken(token, credentials = null) {
        if (!token) return;
        this.signAuthToken = token.startsWith("Bearer ") ? token.slice(7) : token;
        if (credentials) {
            this.credentials = credentials;
        }
        console.log("[iampeckishTokenStore] In-memory signAuthToken saved.");
    }

    /**
     * Save token returned by test-token endpoint in memory
     * @param {string} token 
     * @param {number} expiresIn - Lifetime in seconds (default: 1800)
     */
    saveAuthToken(token, expiresIn = 1800) {
        if (!token) return;
        this.authToken = token.startsWith("Bearer ") ? token.slice(7) : token;
        const ttlSeconds = Number(expiresIn) || 1800;
        const ttlMs = Math.max((ttlSeconds - 60) * 1000, 10000);
        this.tokenExpiry = new Date(Date.now() + ttlMs);
        console.log(`[iampeckishTokenStore] In-memory authToken saved. Expires at: ${this.tokenExpiry.toISOString()}`);
    }

    /**
     * Returns signAuthToken in "Bearer <token>" format, or null if unavailable.
     * @returns {string|null}
     */
    getSignAuthToken() {
        if (!this.signAuthToken) return null;
        return `Bearer ${this.signAuthToken}`;
    }

    /**
     * Returns authToken in "Bearer <token>" format, or null if unavailable.
     * @returns {string|null}
     */
    getAuthToken() {
        if (!this.authToken) return null;
        return `Bearer ${this.authToken}`;
    }

    /**
     * Returns active bearer token (prioritizes authToken, falls back to signAuthToken)
     * @returns {string|null}
     */
    getBearerToken() {
        return this.getAuthToken() || this.getSignAuthToken();
    }

    /**
     * Returns true if the stored authToken is missing or expired.
     * @returns {boolean}
     */
    isExpired() {
        if (!this.authToken && !this.signAuthToken) return true;
        if (!this.tokenExpiry) return false;
        return Date.now() >= this.tokenExpiry.getTime();
    }

    /**
     * Clears all stored tokens & credentials.
     */
    clear() {
        this.signAuthToken = null;
        this.authToken = null;
        this.tokenExpiry = null;
        this.credentials = null;
        this.refreshToken = null;
        console.log("[iampeckishTokenStore] Cleared all in-memory tokens.");
    }
}

export const tokenStore = new PeckishTokenStore();
export default tokenStore;
