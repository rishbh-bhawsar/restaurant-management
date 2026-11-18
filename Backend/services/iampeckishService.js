import axios from "axios";
import dotenv from "dotenv";
import tokenStore from "../utils/iampeckishTokenStore.js";
import { buildPeckishRequestConfig } from "../utils/iampeckishRequestHelper.js";

dotenv.config();

const BASE_URL = "https://api.iampeckish.com/connect/api/";
const SIGNIN_URL = "https://api.iampeckish.com/auth/signin";
const AUTH_TOKEN_URL = "https://api.iampeckish.com/connect/oauth/token";
const REDIRECT_URI = process.env.IAMPECKISH_REDIRECT_URI;

/* ======================================================
   AXIOS CLIENT CONFIGURATION & INTERCEPTORS
====================================================== */

export const iampeckishAxios = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json"
    }
});

/**
 * Manually set or update Authorization header on the axios instance
 * @param {string} token 
 */
export function setAuthToken(token) {
    if (token) {
        const bearer = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
        iampeckishAxios.defaults.headers.common["Authorization"] = bearer;
    } else {
        delete iampeckishAxios.defaults.headers.common["Authorization"];
    }
}

// Request Interceptor: Inject Bearer token and Client headers
iampeckishAxios.interceptors.request.use(
    (config) => {
        if (!config.headers["Authorization"] && !config.headers["authorization"]) {
            const activeToken = tokenStore.getBearerToken();
            if (activeToken) {
                config.headers["Authorization"] = activeToken;
            }
        }

        const clientId = tokenStore.credentials?.clientId;
        const clientSecret = tokenStore.credentials?.clientSecret;
        const apiKey = tokenStore.credentials?.apiKey;

        if (clientId && !config.headers["client-id"] && !config.headers["x-client-id"]) {
            config.headers["x-client-id"] = clientId;
            config.headers["client-id"] = clientId;
        }

        if (clientSecret && !config.headers["client-secret"] && !config.headers["x-client-secret"]) {
            config.headers["x-client-secret"] = clientSecret;
            config.headers["client-secret"] = clientSecret;
        }

        if (apiKey && !config.headers["x-api-key"]) {
            config.headers["x-api-key"] = apiKey;
        }

        const queryParamsStr = config.params && Object.keys(config.params).length > 0 ? `?${new URLSearchParams(config.params).toString()}` : "";
        console.log(`🚀 [iampeckishService] [OUTBOUND] ${config.method?.toUpperCase()} ${config.baseURL || ""}${config.url}${queryParamsStr}`);
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Auto 401 Re-Authentication & Transparent Retry
iampeckishAxios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isAuthError =
            error.response?.status === 401 ||
            (error.response?.status === 403 &&
                (error.response?.data?.detail === "Could not validate credentials" ||
                    error.response?.data?.detail === "Invalid token"));

        if (isAuthError && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                console.log("[iampeckishService] Auth error encountered. Attempting automatic token refresh / regeneration...");

                let tokenRefreshed = false;
                const refreshTokenValue = tokenStore.refreshToken;
                if (refreshTokenValue) {
                    try {
                        console.log("[iampeckishService] Refreshing OAuth token via refresh_token on 401...");
                        const refreshResult = await exchangeOAuthToken({ grant_type: "refresh_token", refresh_token: refreshTokenValue });
                        if (refreshResult?.data?.access_token) {
                            tokenStore.saveOAuthTokens(refreshResult.data);
                            setAuthToken(refreshResult.data.access_token);
                            tokenRefreshed = true;
                        }
                    } catch (rfErr) {
                        console.warn("[iampeckishService] OAuth refresh_token failed, generating fresh token:", rfErr.message);
                    }
                }

                if (!tokenRefreshed) {
                    console.log("[iampeckishService] Generating fresh token via credentials...");
                    await generateFullToken(tokenStore.credentials || {});
                }

                const freshBearerToken = tokenStore.getBearerToken();
                if (originalRequest.headers && typeof originalRequest.headers.set === "function") {
                    originalRequest.headers.set("Authorization", freshBearerToken);
                } else if (originalRequest.headers) {
                    originalRequest.headers["Authorization"] = freshBearerToken;
                }

                console.log("[iampeckishService] Re-authentication successful. Retrying original request...");
                return iampeckishAxios(originalRequest);
            } catch (refreshErr) {
                console.error("[iampeckishService] Re-authentication failed:", refreshErr.response?.data || refreshErr.message);
                tokenStore.clear();
                return Promise.reject(refreshErr);
            }
        }

        console.error("[iampeckishService] [API ERROR]", error.response?.data || error.message);
        return Promise.reject(error);
    }
);

/* ======================================================
   1️⃣ AUTHENTICATION SERVICES
====================================================== */

export async function signIn(credentials = {}) {
    const email = credentials.email || credentials.username || credentials.USERNAME || tokenStore.credentials?.username || process.env.IAMPECKISH_USERNAME;
    const password = credentials.password || credentials.PASSWORD || tokenStore.credentials?.password || process.env.IAMPECKISH_PASSWORD;

    if (!email || !password) {
        const err = new Error("Email and password are required for IAmPeckish signin");
        err.statusCode = 400;
        throw err;
    }

    try {
        console.log(`[iampeckishService] Signing in user: ${email}...`);
        const response = await axios.post(
            SIGNIN_URL,
            { email, password },
            { headers: { "Content-Type": "application/json" } }
        );

        const data = response.data;
        const userAccessToken =
            data?.data?.accessToken ||
            data?.accessToken ||
            data?.token ||
            data?.data?.access_token ||
            data?.access_token;

        if (userAccessToken) {
            tokenStore.saveSignAuthToken(userAccessToken, { email, password });
            setAuthToken(userAccessToken);
        }

        const bearerToken = tokenStore.getSignAuthToken();

        return {
            success: true,
            signAuthToken: userAccessToken,
            bearerToken: bearerToken || undefined,
            data
        };
    } catch (error) {
        console.error("[iampeckishService] Signin Error:", error.response?.data || error.message);
        throw error;
    }
}

export async function getTestToken(options = {}) {
    const applicationId = options.applicationId || options.clientId || options.CLIENT_ID || tokenStore.credentials?.clientId;
    let signToken = options.signToken || tokenStore.getSignAuthToken();

    if (!signToken) {
        console.log("[iampeckishService] signAuthToken missing. Attempting auto-signin first...");
        const signinRes = await signIn();
        signToken = signinRes.bearerToken || signinRes.signAuthToken;
    }

    if (!signToken) {
        const err = new Error("signAuthToken is missing. Please sign in via /auth/signin first.");
        err.statusCode = 401;
        throw err;
    }

    const bearerSignToken = signToken.startsWith("Bearer ") ? signToken : `Bearer ${signToken}`;
    const url = `https://api.iampeckish.com/connect/applications/${applicationId}/test-token`;

    try {
        console.log(`[iampeckishService] Calling test-token endpoint: ${url}`);
        const response = await axios.post(
            url,
            options.payload || {},
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: bearerSignToken
                }
            }
        );

        const data = response.data;
        const receivedAuthToken =
            data?.access_token ||
            data?.accessToken ||
            data?.data?.access_token ||
            data?.data?.accessToken ||
            data?.token;

        const expiresIn = data?.expires_in || data?.data?.expires_in || 1800;

        if (receivedAuthToken) {
            tokenStore.saveAuthToken(receivedAuthToken, expiresIn);
            setAuthToken(receivedAuthToken);
        }

        const activeAuthToken = tokenStore.getAuthToken();

        return {
            success: true,
            signAuthToken: tokenStore.signAuthToken,
            authToken: tokenStore.authToken,
            bearerToken: activeAuthToken,
            expiresIn,
            data
        };
    } catch (error) {
        console.error("[iampeckishService] Test Token Error:", error.response?.data || error.message);
        throw error;
    }
}

export async function generateFullToken(credentials = {}) {
    console.log("[iampeckishService] Executing full OAuth token generation flow (signin -> authorize -> exchange)...");
    const email = credentials.email || credentials.username || credentials.USERNAME || tokenStore.credentials?.username || process.env.IAMPECKISH_USERNAME;
    const password = credentials.password || credentials.PASSWORD || tokenStore.credentials?.password || process.env.IAMPECKISH_PASSWORD;

    const signinResult = await signIn({ ...credentials, email, password });
    const signToken = signinResult.signAuthToken;
    const userUuid = signinResult.data?.data?.user?.user_uuid;
    const restaurants = signinResult.data?.data?.restaurants || [];
    const restUuids = restaurants.map((r) => r.restaurant_uuid || r.uuid).filter(Boolean);

    const clientId = credentials.clientId || credentials.CLIENT_ID || tokenStore.credentials?.clientId;
    const clientSecret = credentials.clientSecret || credentials.CLIENT_SECRET || tokenStore.credentials?.clientSecret;
    const redirectUri = credentials.redirectUri || credentials.redirect_uri || process.env.IAMPECKISH_REDIRECT_URI || REDIRECT_URI;

    // Authorize Connect
    const authRes = await authorizeConnect(
        {
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            response_type: "code",
            user_uuid: userUuid,
            restaurant_uuids: restUuids
        },
        signToken
    );

    return {
        success: true,
        message: "IAmPeckish OAuth tokens generated and connected successfully",
        accessToken: tokenStore.authToken,
        authToken: tokenStore.authToken,
        refreshToken: tokenStore.refreshToken,
        signAuthToken: tokenStore.signAuthToken,
        bearerToken: tokenStore.getBearerToken(),
        expiresAt: tokenStore.tokenExpiry?.toISOString() || null
    };
}

export async function ensureValidToken(creds = {}) {
    // Save credentials/tokens into tokenStore if provided
    if (creds.CLIENT_ID) tokenStore.credentials = { ...(tokenStore.credentials || {}), clientId: creds.CLIENT_ID };
    if (creds.CLIENT_SECRET) tokenStore.credentials = { ...(tokenStore.credentials || {}), clientSecret: creds.CLIENT_SECRET };
    if (creds.USERNAME) tokenStore.credentials = { ...(tokenStore.credentials || {}), username: creds.USERNAME };
    if (creds.PASSWORD) tokenStore.credentials = { ...(tokenStore.credentials || {}), password: creds.PASSWORD };
    if (creds.RESTAURANT_UUID) tokenStore.credentials = { ...(tokenStore.credentials || {}), restaurant_uuid: creds.RESTAURANT_UUID };
    // if (creds.REFRESH_TOKEN) tokenStore.refreshToken = creds.REFRESH_TOKEN;

    // 1. If valid unexpired active token exists in memory, return it
    if (!tokenStore.isExpired() && tokenStore.getBearerToken()) {
        return tokenStore.getBearerToken();
    }

    // 2. If explicit ACCESS_TOKEN is passed in creds and token is not yet in memory
    if (creds.ACCESS_TOKEN && !tokenStore.authToken) {
        const rawToken = creds.ACCESS_TOKEN.startsWith("Bearer ") ? creds.ACCESS_TOKEN.slice(7) : creds.ACCESS_TOKEN;
        tokenStore.authToken = rawToken;
        setAuthToken(rawToken);
        return tokenStore.getBearerToken();
    }

    // 3. Single Refresh Token Flow: Use REFRESH_TOKEN (from creds, tokenStore, or .env)
    const refreshTokenValue =
        tokenStore.refreshToken;

    if (refreshTokenValue) {
        try {
            console.log("[iampeckishService] Access token missing or expired. Generating fresh access_token via single refresh_token...");
            const refreshResult = await exchangeOAuthToken({
                grant_type: "refresh_token",
                refresh_token: refreshTokenValue,
                client_id: creds.CLIENT_ID || tokenStore.credentials?.clientId,
                client_secret: creds.CLIENT_SECRET || tokenStore.credentials?.clientSecret
            });
            if (refreshResult?.data?.access_token) {
                tokenStore.saveOAuthTokens(refreshResult.data);
                setAuthToken(refreshResult.data.access_token);
                return tokenStore.getBearerToken();
            }
        } catch (e) {
            console.warn("[iampeckishService] OAuth refresh failed, attempting fallback:", e.response?.data || e.message);
        }
    }

    // 4. Fallback: Full login token generation if credentials exist
    const hasUserCreds =
        (creds.USERNAME || tokenStore.credentials?.username || process.env.IAMPECKISH_USERNAME) &&
        (creds.PASSWORD || tokenStore.credentials?.password || process.env.IAMPECKISH_PASSWORD);

    if (hasUserCreds) {
        console.log("[iampeckishService] Token expired or absent. Generating fresh token via credentials...");
        const authRes = await generateFullToken(creds);
        return authRes.bearerToken;
    }

    return tokenStore.getBearerToken();
}

export async function exchangeOAuthToken(payload = {}) {
    const grantType = payload.grant_type || (payload.refresh_token ? "refresh_token" : "authorization_code");
    const clientId = payload.client_id || payload.clientId || payload.CLIENT_ID || tokenStore.credentials?.clientId;
    const clientSecret = payload.client_secret || payload.clientSecret || payload.CLIENT_SECRET || tokenStore.credentials?.clientSecret;
    const redirectUri = payload.redirect_uri || payload.redirectUri || process.env.IAMPECKISH_REDIRECT_URI || REDIRECT_URI;
    const tokenUrl = AUTH_TOKEN_URL;

    let requestBody = {};
    if (grantType === "authorization_code") {
        requestBody = {
            grant_type: "authorization_code",
            code: payload.code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri
        };
    } else if (grantType === "refresh_token") {
        requestBody = {
            grant_type: "refresh_token",
            refresh_token: payload.refresh_token || tokenStore.refreshToken,
            client_id: clientId,
            client_secret: clientSecret
        };
    } else {
        requestBody = {
            grant_type: grantType,
            client_id: clientId,
            client_secret: clientSecret,
            ...payload
        };
    }

    try {
        console.log(`[iampeckishService] Requesting OAuth token from ${tokenUrl} (grant_type: ${grantType})...`);
        const response = await axios.post(
            tokenUrl,
            requestBody,
            { headers: { "Content-Type": "application/json" } }
        );

        const data = response.data;
        if (data?.access_token) {
            tokenStore.saveOAuthTokens(data);
            setAuthToken(data.access_token);
        }

        return { success: true, data };
    } catch (error) {
        console.error("[iampeckishService] OAuth Token Error:", error.response?.data || error.message);
        throw error;
    }
}

const AUTHORIZE_URL = "https://api.iampeckish.com/connect/oauth/authorize";

export async function authorizeConnect(payload = {}, signTokenOverride = null) {
    const clientId = payload.client_id || payload.clientId || payload.CLIENT_ID || tokenStore.credentials?.clientId;
    const clientSecret = payload.client_secret || payload.clientSecret || payload.CLIENT_SECRET || tokenStore.credentials?.clientSecret;
    const redirectUri = payload.redirect_uri || payload.redirectUri || process.env.IAMPECKISH_REDIRECT_URI || REDIRECT_URI;
    const responseType = payload.response_type || "code";
    const userUuid = payload.user_uuid;
    const restaurantUuids = payload.restaurant_uuids;

    let signToken = signTokenOverride || tokenStore.getSignAuthToken();
    if (!signToken) {
        console.log("[iampeckishService] signAuthToken missing. Attempting auto-signin first...");
        const signinRes = await signIn(tokenStore.credentials || {});
        signToken = signinRes.bearerToken || signinRes.signAuthToken;
    }

    if (!signToken) {
        const err = new Error("signAuthToken is missing. Please sign in via /auth/signin first.");
        err.statusCode = 401;
        throw err;
    }

    const bearerSignToken = signToken.startsWith("Bearer ") ? signToken : `Bearer ${signToken}`;
    const authorizeUrl = AUTHORIZE_URL;

    const requestBody = {
        response_type: responseType,
        client_id: clientId,
        redirect_uri: redirectUri,
        ...(restaurantUuids ? { restaurant_uuids: restaurantUuids } : {}),
        ...(userUuid ? { user_uuid: userUuid } : {})
    };

    console.log(`[iampeckishService] Sending POST to ${authorizeUrl} with payload:`, JSON.stringify(requestBody));

    try {
        const response = await axios.post(
            authorizeUrl,
            requestBody,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: bearerSignToken
                }
            }
        );

        const authData = response.data;
        console.log("[iampeckishService] Authorize response:", JSON.stringify(authData));

        // Extract authorization code from response if present
        let authCode =
            authData?.code ||
            authData?.data?.code ||
            authData?.authorization_code ||
            authData?.data?.authorization_code;

        const redirectUrl = authData?.redirect_url || authData?.redirect_uri || authData?.url;
        if (!authCode && redirectUrl) {
            try {
                const parsedUrl = new URL(redirectUrl, "http://localhost");
                authCode = parsedUrl.searchParams.get("code");
            } catch (urlErr) {
                console.warn("[iampeckishService] Could not parse redirect_url for code:", urlErr.message);
            }
        }

        let tokenExchangeResult = null;

        if (authCode) {
            console.log(`[iampeckishService] Authorization code obtained: ${authCode}. Exchanging for tokens...`);
            tokenExchangeResult = await exchangeOAuthToken({
                grant_type: "authorization_code",
                code: authCode,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri
            });
        } else if (authData?.access_token) {
            tokenStore.saveOAuthTokens(authData);
            setAuthToken(authData.access_token);
        } else if (authData?.data?.access_token) {
            tokenStore.saveOAuthTokens(authData.data);
            setAuthToken(authData.data.access_token);
        }

        return {
            success: true,
            message: "Peckish Connect authorization completed and tokens saved successfully",
            accessToken: tokenStore.authToken,
            refreshToken: tokenStore.refreshToken,
            tokenExpiry: tokenStore.tokenExpiry?.toISOString() || null,
            bearerToken: tokenStore.getBearerToken(),
            // data: authData,
            // tokenData: tokenExchangeResult?.data || authData
        };
    } catch (error) {
        console.error("[iampeckishService] Authorize Error:", error.response?.data || error.message);
        throw error;
    }
}

export function getAuthorizationUrl(options = {}) {
    const baseUrl = "https://connect.iampeckish.com/authorize";
    const params = new URLSearchParams();
    params.append("response_type", "code");
    params.append("client_id", options.client_id || options.clientId || options.CLIENT_ID || tokenStore.credentials?.clientId || "");

    const redirectUri = options.redirect_uri || options.redirectUri || process.env.IAMPECKISH_REDIRECT_URI || REDIRECT_URI;
    if (redirectUri) params.append("redirect_uri", redirectUri);
    if (options.state) params.append("state", options.state);
    if (options.scope) params.append("scope", options.scope);

    return `${baseUrl}?${params.toString()}`;
}

/* ======================================================
   RESTAURANT UUID RESOLVER HELPER
====================================================== */

export async function resolveRestaurantUuid(params = {}, reqHeaders = {}, creds = {}) {
    let restUuid =
        creds?.RESTAURANT_UUID ||
        reqHeaders["restaurant-uuid"] ||
        reqHeaders["x-restaurant-uuid"] ||
        params["restaurant_uuid"] ||
        params["restaurant-uuid"];

    if (!restUuid) {
        try {
            console.log("[iampeckishService] restaurant-uuid not provided; auto-fetching restaurants list...");
            const list = await getRestaurants(params, reqHeaders, creds);
            const restaurants = Array.isArray(list) ? list : (list?.data || list?.restaurants || []);
            if (restaurants.length > 0) {
                restUuid = restaurants[0].restaurant_uuid || restaurants[0].uuid || restaurants[0].id;
                console.log(`[iampeckishService] Auto-resolved default restaurant-uuid: ${restUuid}`);
            }
        } catch (e) {
            console.warn("[iampeckishService] Could not auto-resolve restaurant-uuid:", e.message);
        }
    }
    return restUuid;
}

/* ======================================================
   2️⃣ RESTAURANTS SERVICES
====================================================== */

export async function getRestaurants(params = {}, reqHeaders = {}, creds = {}) {
    try {
        await ensureValidToken(creds);
        const clientId = creds.CLIENT_ID || creds.clientId || tokenStore.credentials?.clientId;
        const config = buildPeckishRequestConfig(params, reqHeaders, creds);

        if (clientId) {
            try {
                console.log(`[iampeckishService] Fetching connected application restaurants for [${clientId}]...`);
                const appRestResponse = await axios.get(
                    `https://api.iampeckish.com/connect/applications/${clientId}/restaurants`,
                    config
                );
                if (appRestResponse.data) {
                    const list = Array.isArray(appRestResponse.data) ? appRestResponse.data : (appRestResponse.data?.data || appRestResponse.data?.restaurants || []);
                    if (list.length > 0) {
                        return list;
                    }
                }
            } catch (appErr) {
                console.log("[iampeckishService] Application restaurants endpoint fallback to /restaurants:", appErr.message);
            }
        }

        console.log("[iampeckishService] Fetching restaurants list...");
        const response = await iampeckishAxios.get("restaurants", config);
        return response.data;
    } catch (error) {
        console.error("[iampeckishService] Error fetching restaurants:", error.response?.data || error.message);
        throw error;
    }
}

export async function getRestaurantById(restaurantUuid, reqHeaders = {}, creds = {}) {
    try {
        await ensureValidToken(creds);
        const headersWithRest = { ...(reqHeaders || {}) };
        if (!headersWithRest["restaurant-uuid"] && !headersWithRest["x-restaurant-uuid"]) {
            headersWithRest["restaurant-uuid"] = restaurantUuid;
        }
        const config = buildPeckishRequestConfig({}, headersWithRest, creds);
        console.log(`[iampeckishService] Fetching restaurant [${restaurantUuid}]...`);
        const response = await iampeckishAxios.get(`restaurants/${restaurantUuid}`, config);
        return response.data;
    } catch (error) {
        console.error(`[iampeckishService] Error fetching restaurant [${restaurantUuid}]:`, error.response?.data || error.message);
        throw error;
    }
}

/* ======================================================
   3️⃣ UNITS SERVICES
====================================================== */

export async function getUnits(params = {}, reqHeaders = {}, creds = {}) {
    try {
        await ensureValidToken(creds);
        const restUuid = await resolveRestaurantUuid(params, reqHeaders, creds);
        const headersWithRest = { ...reqHeaders };
        if (restUuid && !headersWithRest["restaurant-uuid"] && !headersWithRest["x-restaurant-uuid"]) {
            headersWithRest["restaurant-uuid"] = restUuid;
        }

        const config = buildPeckishRequestConfig(params, headersWithRest, creds);
        console.log("[iampeckishService] Fetching units from Connect API...");
        const response = await iampeckishAxios.get("units", config);
        return response.data;
    } catch (error) {
        console.error("[iampeckishService] Error fetching units:", error.response?.data || error.message);
        throw error;
    }
}

export async function getUnitConversions(params = {}, reqHeaders = {}, creds = {}) {
    try {
        await ensureValidToken(creds);
        const restUuid = await resolveRestaurantUuid(params, reqHeaders, creds);
        const headersWithRest = { ...reqHeaders };
        if (restUuid && !headersWithRest["restaurant-uuid"] && !headersWithRest["x-restaurant-uuid"]) {
            headersWithRest["restaurant-uuid"] = restUuid;
        }

        const config = buildPeckishRequestConfig(params, headersWithRest, creds);
        console.log("[iampeckishService] Fetching unit conversions from Connect API...");
        const response = await iampeckishAxios.get("units/conversions", config);
        return response.data;
    } catch (error) {
        console.error("[iampeckishService] Error fetching unit conversions:", error.response?.data || error.message);
        throw error;
    }
}

/* ======================================================
   4️⃣ ITEMS SERVICES
====================================================== */

export async function getItems(params = {}, reqHeaders = {}, creds = {}) {
    try {
        await ensureValidToken(creds);
        const restUuid = await resolveRestaurantUuid(params, reqHeaders, creds);
        const headersWithRest = { ...reqHeaders };
        if (restUuid && !headersWithRest["restaurant-uuid"] && !headersWithRest["x-restaurant-uuid"]) {
            headersWithRest["restaurant-uuid"] = restUuid;
        }

        const config = buildPeckishRequestConfig(params, headersWithRest, creds);
        console.log("[iampeckishService] Fetching items list...");
        const response = await iampeckishAxios.get("items/items", config);
        return response.data;
    } catch (error) {
        console.error("[iampeckishService] Error fetching items:", error.response?.data || error.message);
        throw error;
    }
}

export async function getIngredients(params = {}, reqHeaders = {}, creds = {}) {
    try {
        await ensureValidToken(creds);
        const restUuid = await resolveRestaurantUuid(params, reqHeaders, creds);
        const headersWithRest = { ...reqHeaders };
        if (restUuid && !headersWithRest["restaurant-uuid"] && !headersWithRest["x-restaurant-uuid"]) {
            headersWithRest["restaurant-uuid"] = restUuid;
        }

        const config = buildPeckishRequestConfig(params, headersWithRest, creds);
        console.log("[iampeckishService] Fetching ingredients list...");
        const response = await iampeckishAxios.get("items/ingredients", config);
        return response.data;
    } catch (error) {
        console.error("[iampeckishService] Error fetching ingredients:", error.response?.data || error.message);
        throw error;
    }
}

export async function getPreparations(params = {}, reqHeaders = {}, creds = {}) {
    try {
        await ensureValidToken(creds);
        const restUuid = await resolveRestaurantUuid(params, reqHeaders, creds);
        const headersWithRest = { ...reqHeaders };
        if (restUuid && !headersWithRest["restaurant-uuid"] && !headersWithRest["x-restaurant-uuid"]) {
            headersWithRest["restaurant-uuid"] = restUuid;
        }

        const config = buildPeckishRequestConfig(params, headersWithRest, creds);
        console.log("[iampeckishService] Fetching preparations list...");
        const response = await iampeckishAxios.get("items/preparations", config);
        return response.data;
    } catch (error) {
        console.error("[iampeckishService] Error fetching preparations:", error.response?.data || error.message);
        throw error;
    }
}

export async function getProducts(params = {}, reqHeaders = {}, creds = {}) {
    try {
        await ensureValidToken(creds);
        const restUuid = await resolveRestaurantUuid(params, reqHeaders, creds);
        const headersWithRest = { ...reqHeaders };
        if (restUuid && !headersWithRest["restaurant-uuid"] && !headersWithRest["x-restaurant-uuid"]) {
            headersWithRest["restaurant-uuid"] = restUuid;
        }

        const config = buildPeckishRequestConfig(params, headersWithRest, creds);
        console.log("[iampeckishService] Fetching products list...");
        const response = await iampeckishAxios.get("items/products", config);
        return response.data;
    } catch (error) {
        console.error("[iampeckishService] Error fetching products:", error.response?.data || error.message);
        throw error;
    }
}

/* ======================================================
   5️⃣ SUPPLIERS SERVICES
====================================================== */

export async function getSuppliers(params = {}, reqHeaders = {}, creds = {}) {
    try {
        await ensureValidToken(creds);
        const restUuid = await resolveRestaurantUuid(params, reqHeaders, creds);
        const headersWithRest = { ...reqHeaders };
        if (restUuid && !headersWithRest["restaurant-uuid"] && !headersWithRest["x-restaurant-uuid"]) {
            headersWithRest["restaurant-uuid"] = restUuid;
        }

        const config = buildPeckishRequestConfig(params, headersWithRest, creds);
        console.log("[iampeckishService] Fetching suppliers list...");
        const response = await iampeckishAxios.get("suppliers", config);
        return response.data;
    } catch (error) {
        console.error("[iampeckishService] Error fetching suppliers:", error.response?.data || error.message);
        throw error;
    }
}

export async function getSupplierByRef(supplierRef, reqHeaders = {}, creds = {}) {
    try {
        await ensureValidToken(creds);
        const restUuid = await resolveRestaurantUuid({}, reqHeaders, creds);
        const headersWithRest = { ...reqHeaders };
        if (restUuid && !headersWithRest["restaurant-uuid"] && !headersWithRest["x-restaurant-uuid"]) {
            headersWithRest["restaurant-uuid"] = restUuid;
        }

        const config = buildPeckishRequestConfig({}, headersWithRest, creds);
        console.log(`[iampeckishService] Fetching supplier [${supplierRef}]...`);
        const response = await iampeckishAxios.get(`suppliers/${supplierRef}`, config);
        return response.data;
    } catch (error) {
        console.error(`[iampeckishService] Error fetching supplier [${supplierRef}]:`, error.response?.data || error.message);
        throw error;
    }
}

/* ======================================================
   6️⃣ PURCHASES & INVOICES SERVICES
====================================================== */

export async function getPurchases(params = {}, reqHeaders = {}, creds = {}) {
    try {
        await ensureValidToken(creds);
        const restUuid = await resolveRestaurantUuid(params, reqHeaders, creds);
        const headersWithRest = { ...reqHeaders };
        if (restUuid && !headersWithRest["restaurant-uuid"] && !headersWithRest["x-restaurant-uuid"]) {
            headersWithRest["restaurant-uuid"] = restUuid;
        }

        const config = buildPeckishRequestConfig(params, headersWithRest, creds);
        console.log("[iampeckishService] Fetching purchases list...");
        const response = await iampeckishAxios.get("purchases", config);
        return response.data;
    } catch (error) {
        console.error("[iampeckishService] Error fetching purchases:", error.response?.data || error.message);
        throw error;
    }
}

export async function getInvoices(params = {}, reqHeaders = {}, creds = {}) {
    try {
        await ensureValidToken(creds);
        const restUuid = await resolveRestaurantUuid(params, reqHeaders, creds);
        const headersWithRest = { ...reqHeaders };
        if (restUuid && !headersWithRest["restaurant-uuid"] && !headersWithRest["x-restaurant-uuid"]) {
            headersWithRest["restaurant-uuid"] = restUuid;
        }

        const config = buildPeckishRequestConfig(params, headersWithRest, creds);
        console.log("[iampeckishService] Fetching invoices list...");
        const response = await iampeckishAxios.get("invoices", config);
        return response.data;
    } catch (error) {
        console.error("[iampeckishService] Error fetching invoices:", error.response?.data || error.message);
        throw error;
    }
}

/* ======================================================
   7️⃣ STOCK SERVICES
====================================================== */

export async function getStocklevels(params = {}, reqHeaders = {}, creds = {}) {
    try {
        await ensureValidToken(creds);
        const restUuid = await resolveRestaurantUuid(params, reqHeaders, creds);
        const headersWithRest = { ...reqHeaders };
        if (restUuid && !headersWithRest["restaurant-uuid"] && !headersWithRest["x-restaurant-uuid"]) {
            headersWithRest["restaurant-uuid"] = restUuid;
        }

        const config = buildPeckishRequestConfig(params, headersWithRest, creds);
        console.log("[iampeckishService] Fetching stocklevels list...");
        const response = await iampeckishAxios.get("stocklevels", config);
        return response.data;
    } catch (error) {
        console.error("[iampeckishService] Error fetching stocklevels:", error.response?.data || error.message);
        throw error;
    }
}

export async function getStocktakes(params = {}, reqHeaders = {}, creds = {}) {
    try {
        await ensureValidToken(creds);
        const restUuid = await resolveRestaurantUuid(params, reqHeaders, creds);
        const headersWithRest = { ...reqHeaders };
        if (restUuid && !headersWithRest["restaurant-uuid"] && !headersWithRest["x-restaurant-uuid"]) {
            headersWithRest["restaurant-uuid"] = restUuid;
        }

        const config = buildPeckishRequestConfig(params, headersWithRest, creds);
        console.log("[iampeckishService] Fetching stocktakes list...");
        const response = await iampeckishAxios.get("stocktakes", config);
        return response.data;
    } catch (error) {
        console.error("[iampeckishService] Error fetching stocktakes:", error.response?.data || error.message);
        throw error;
    }
}

export async function getStocktakeById(stocktakeUuid, reqHeaders = {}, creds = {}) {
    try {
        await ensureValidToken(creds);
        const restUuid = await resolveRestaurantUuid({}, reqHeaders, creds);
        const headersWithRest = { ...reqHeaders };
        if (restUuid && !headersWithRest["restaurant-uuid"] && !headersWithRest["x-restaurant-uuid"]) {
            headersWithRest["restaurant-uuid"] = restUuid;
        }

        const config = buildPeckishRequestConfig({}, headersWithRest, creds);
        console.log(`[iampeckishService] Fetching stocktake [${stocktakeUuid}]...`);
        const response = await iampeckishAxios.get(`stocktakes/${stocktakeUuid}`, config);
        return response.data;
    } catch (error) {
        console.error(`[iampeckishService] Error fetching stocktake [${stocktakeUuid}]:`, error.response?.data || error.message);
        throw error;
    }
}

/* ======================================================
   8️⃣ EVENTS SERVICES
====================================================== */

export async function getEventData(eventType, params = {}, reqHeaders = {}, creds = {}) {
    try {
        await ensureValidToken(creds);
        const restUuid = await resolveRestaurantUuid(params, reqHeaders, creds);
        const headersWithRest = { ...reqHeaders };
        if (restUuid && !headersWithRest["restaurant-uuid"] && !headersWithRest["x-restaurant-uuid"]) {
            headersWithRest["restaurant-uuid"] = restUuid;
        }

        const limit = params.limit ? parseInt(params.limit, 10) : 100;
        const offset = params.offset ? parseInt(params.offset, 10) : 0;

        let start = params.start;
        if (!start) {
            const date = new Date();
            date.setDate(date.getDate() - 30);
            start = date.toISOString();
        }
        const end = params.end || new Date().toISOString();

        const mergedParams = { ...params, limit, offset, start, end };
        const config = buildPeckishRequestConfig(mergedParams, headersWithRest, creds);

        console.log(`[iampeckishService] Fetching events for [${eventType}]...`);
        const response = await iampeckishAxios.get(`events/${eventType}`, config);
        return response.data;
    } catch (error) {
        console.error(`[iampeckishService] Error fetching event [${eventType}]:`, error.response?.data || error.message);
        throw error;
    }
}

export async function postEventData(eventType, payload = {}, reqHeaders = {}, creds = {}) {
    try {
        await ensureValidToken(creds);
        const restUuid = await resolveRestaurantUuid({}, reqHeaders, creds);
        const headersWithRest = { ...reqHeaders };
        if (restUuid && !headersWithRest["restaurant-uuid"] && !headersWithRest["x-restaurant-uuid"]) {
            headersWithRest["restaurant-uuid"] = restUuid;
        }

        const config = buildPeckishRequestConfig({}, headersWithRest, creds);
        console.log(`[iampeckishService] Posting event for [${eventType}]...`);
        const response = await iampeckishAxios.post(`events/${eventType}`, payload, config);
        return response.data;
    } catch (error) {
        console.error(`[iampeckishService] Error posting event [${eventType}]:`, error.response?.data || error.message);
        throw error;
    }
}
