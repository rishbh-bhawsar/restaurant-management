import dotenv from "dotenv";
import tokenStore from "../utils/iampeckishTokenStore.js";
import {
    signIn as authSignIn,
    getTestToken as authGetTestToken,
    generateFullToken,
    exchangeOAuthToken,
    authorizeConnect as authAuthorizeConnect,
    getAuthorizationUrl as authGetAuthorizationUrl,
    getRestaurants as fetchRestaurants,
    getRestaurantById as fetchRestaurantById,
    getUnits as fetchUnits,
    getUnitConversions as fetchUnitConversions,
    getItems as fetchItems,
    getIngredients as fetchIngredients,
    getPreparations as fetchPreparations,
    getProducts as fetchProducts,
    getSuppliers as fetchSuppliers,
    getSupplierByRef as fetchSupplierByRef,
    getPurchases as fetchPurchases,
    getInvoices as fetchInvoices,
    getStocklevels as fetchStocklevels,
    getStocktakes as fetchStocktakes,
    getStocktakeById as fetchStocktakeById,
    getEventData as fetchEventData,
    postEventData as sendEventData
} from "../services/iampeckishService.js";
import {
    upsertPeckishUnitConversions,
    upsertPeckishUnits,
    upsertPeckishSuppliersDetails,
    upsertPeckishSuppliers,
    upsertPeckishStockTakeMaster,
    upsertPeckishStockLevelMaster,
    upsertPeckishProducts,
    upsertPeckishRestaurants,
    upsertPeckishPurchases,
    upsertPeckishPreparations,
    upsertPeckishIngredients,
    upsertPeckishItems,
    upsertPeckishReceives,
    upsertPeckishTransfers,
    upsertPeckishWastage,
    upsertPeckishSalesEvents,
    upsertPeckishStockTakes,
    upsertPeckishInvoices
} from "../services/iampeckishSqlService.js";

dotenv.config();

/* ======================================================
   HELPERS (modeled directly after opsimiseController.js)
====================================================== */

/**
 * Parse URL_PARAMETER formatted as KEY1=VAL1:;:KEY2=VAL2
 * Falls back directly to process.env
 */
function parseUrlParameter(urlParameter, explicitUrlPath = null) {
    if (!urlParameter) {
        const error = new Error("Missing required query param: URL_PARAMETER");
        error.statusCode = 400;
        throw error;
    }

    // URL-decode in case client/Postman encoded delimiters
    let decoded = urlParameter;
    try {
        decoded = decodeURIComponent(urlParameter);
    } catch (err) {
        decoded = urlParameter;
    }

    const map = new Map();
    let rawUrlFromSegment = null;

    decoded.split(":;:").forEach((pair) => {
        const trimmed = pair.trim();
        if (!trimmed) return;
        const idx = trimmed.indexOf("=");
        if (idx === -1) {
            // Handle when the base URL is passed as a raw URL without 'key=' (e.g. 'https://api.iampeckish.com/connect/api/')
            if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
                rawUrlFromSegment = trimmed;
            } else {
                map.set(trimmed.toUpperCase(), "");
            }
        } else {
            const key = trimmed.slice(0, idx).trim().toUpperCase();
            const val = trimmed.slice(idx + 1).trim();
            map.set(key, val);
        }
    });

    const baseUrl =
        map.get("URL_PATH") ||
        map.get("url_path") ||
        map.get("BASE_URL") ||
        map.get("baseUrl") ||
        map.get("API_URL") ||
        map.get("apiUrl") ||
        rawUrlFromSegment ||
        explicitUrlPath;

    const username =
        map.get("USERNAME") ||
        map.get("username") ||
        map.get("IAMPECKISH_USERNAME") ||
        map.get("EMAIL") ||
        map.get("email");

    const password =
        map.get("PASSWORD") ||
        map.get("password") ||
        map.get("IAMPECKISH_PASSWORD");

    const clientId =
        map.get("CLIENT_ID") ||
        map.get("clientId") ||
        map.get("client_id") ||
        map.get("APPLICATION_ID") ||
        map.get("application_id");

    const clientSecret =
        map.get("CLIENT_SECRET") ||
        map.get("clientSecret") ||
        map.get("client_secret");

    const accessToken =
        map.get("ACCESS_TOKEN") ||
        map.get("accessToken") ||
        map.get("TOKEN") ||
        map.get("token") ||
        map.get("BEARER_TOKEN") ||
        map.get("bearer_token");

    const refreshToken =
        map.get("REFRESH_TOKEN") ||
        map.get("refreshToken") ||
        map.get("refresh_token");

    const restaurantUuid =
        map.get("RESTAURANT_UUID") ||
        map.get("restaurant_uuid") ||
        map.get("restaurantUuid");

    // Validate all required fields
    const missing = [];
    if (!baseUrl) missing.push("URL_PATH");
    if (!username) missing.push("USERNAME");
    if (!password) missing.push("PASSWORD");
    if (!clientId) missing.push("CLIENT_ID");
    if (!clientSecret) missing.push("CLIENT_SECRET");
    if (!accessToken) missing.push("ACCESS_TOKEN");
    if (!restaurantUuid) missing.push("RESTAURANT_UUID");

    if (missing.length > 0) {
        const error = new Error(`URL_PARAMETER is missing required fields: ${missing.join(", ")}`);
        error.statusCode = 400;
        throw error;
    }

    // Save tokens to in-memory tokenStore
    if (accessToken || refreshToken) {
        tokenStore.saveOAuthTokens({
            access_token: accessToken,
            refresh_token: refreshToken
        });
    }

    // Save credentials to in-memory tokenStore for automatic background re-auth
    if (username || password || clientId || clientSecret || restaurantUuid) {
        tokenStore.saveCredentials({
            username: username || tokenStore.credentials?.username,
            password: password || tokenStore.credentials?.password,
            clientId: clientId || tokenStore.credentials?.clientId,
            clientSecret: clientSecret || tokenStore.credentials?.clientSecret,
            restaurant_uuid: restaurantUuid || tokenStore.credentials?.restaurant_uuid
        });
    }

    return {
        BASE_URL: baseUrl,
        URL_PATH: baseUrl,
        CLIENT_ID: clientId,
        CLIENT_SECRET: clientSecret,
        USERNAME: username,
        PASSWORD: password,
        ACCESS_TOKEN: accessToken || tokenStore.authToken || null,
        REFRESH_TOKEN: refreshToken || tokenStore.refreshToken || null,
        RESTAURANT_UUID: restaurantUuid,
        ENTITY_ID: map.get("ENTITY_ID") || map.get("entityId") || null,
        BRANCH_ID: map.get("BRANCH_ID") || map.get("branchId") || null
    };
}

/**
 * Parse common parameters from request query / headers / URL_PARAMETER
 * Defaults entityId and branchId to fallback if not provided so SP always executes.
 */
function parseCommonParams(req, requireEntityBranch = true) {
    const urlParam = req.query?.URL_PARAMETER || req.body?.URL_PARAMETER;
    const explicitUrlPath =
        req.query?.URL_PATH ||
        req.query?.url_path ||
        req.query?.apiUrl ||
        req.query?.API_URL ||
        req.query?.baseUrl ||
        req.query?.BASE_URL;

    const creds = parseUrlParameter(urlParam, explicitUrlPath);

    if (explicitUrlPath) {
        creds.BASE_URL = explicitUrlPath;
        creds.URL_PATH = explicitUrlPath;
    }

    const queryRestUuid =
        req.query?.["restaurant-uuid"] ||
        req.query?.restaurant_uuid ||
        req.query?.RESTAURANT_UUID;

    if (queryRestUuid) {
        creds.RESTAURANT_UUID = queryRestUuid;
    }

    const rawEntity =
        req.query?.entityId ||
        creds.ENTITY_ID;

    const rawBranch =
        req.query?.branchId ||
        creds.BRANCH_ID;

    if (requireEntityBranch) {
        const missingParams = [];
        if (rawEntity == null || rawEntity === "") missingParams.push("entityId");
        if (rawBranch == null || rawBranch === "") missingParams.push("branchId");

        if (missingParams.length > 0) {
            const error = new Error(`Missing required query parameter(s): ${missingParams.join(", ")}`);
            error.statusCode = 400;
            throw error;
        }
    }

    const entityId = rawEntity != null && rawEntity !== "" ? Number(rawEntity) : null;
    const branchId = rawBranch != null && rawBranch !== "" ? Number(rawBranch) : null;

    return {
        creds,
        entityId,
        branchId
    };
}

/**
 * Standardized success response helper
 */
function sendSuccessResponse(res, data, entityId = null, branchId = null, extra = {}) {
    const items = Array.isArray(data) ? data : (data?.data || data?.items || data?.units || data?.restaurants || []);
    const count = items.length;

    return res.status(200).json({
        success: true,
        status: count > 0 ? 2 : 4,
        total: count,
        entityId,
        branchId,
        ...extra,
        data
    });
}

/**
 * Standardized error response helper
 */
function sendErrorResponse(res, error, prefix = "IAmPeckish") {
    console.error(`[iampeckishController] ${prefix} error:`, error.message);
    return res.status(error.statusCode || error.response?.status || 500).json({
        success: false,
        status: 3,
        error: error.response?.data || error.message
    });
}

/* ======================================================
   1️⃣ AUTHENTICATION CONTROLLERS
====================================================== */

export const signIn = async (req, res) => {
    try {
        const { creds } = parseCommonParams(req, false);
        const email = req.body?.email || req.body?.username || creds.USERNAME;
        const password = req.body?.password || creds.PASSWORD;

        const result = await authSignIn({ email, password });

        if (result.bearerToken) {
            res.setHeader("Authorization", result.bearerToken);
        }

        return res.status(200).json({
            success: true,
            status: 2,
            message: "Successfully signed in to IAmPeckish",
            data: result.data?.data || result.data
        });
    } catch (error) {
        return sendErrorResponse(res, error, "signIn");
    }
};

export const getTestToken = async (req, res) => {
    try {
        const { creds } = parseCommonParams(req, false);
        const applicationId = req.body?.applicationId || creds.CLIENT_ID;
        const signToken =
            req.headers.authorization ||
            req.headers["sign-auth-token"] ||
            req.body?.signToken ||
            req.body?.signAuthToken;

        const result = await authGetTestToken({
            applicationId,
            signToken,
            payload: req.body
        });

        if (result.bearerToken) {
            res.setHeader("Authorization", result.bearerToken);
        }

        return res.status(200).json({
            success: true,
            status: 2,
            message: "Application test-token generated successfully",
            authToken: result.authToken,
            bearerToken: result.bearerToken,
            expiresIn: result.expiresIn
        });
    } catch (error) {
        return sendErrorResponse(res, error, "getTestToken");
    }
};

export const generateToken = async (req, res) => {
    try {
        const { creds } = parseCommonParams(req, false);
        const credentials = {
            email: req.body?.email || req.body?.username || creds.USERNAME,
            password: req.body?.password || creds.PASSWORD,
            clientId: req.body?.clientId || creds.CLIENT_ID
        };

        const result = await generateFullToken(credentials);

        if (result.bearerToken) {
            res.setHeader("Authorization", result.bearerToken);
        }

        return res.status(200).json({
            success: true,
            status: 2,
            ...result
        });
    } catch (error) {
        return sendErrorResponse(res, error, "generateToken");
    }
};

export const authorizeConnect = async (req, res) => {
    try {
        const { creds } = parseCommonParams(req, false);
        const signToken =
            req.headers.authorization ||
            req.headers["sign-auth-token"] ||
            req.body?.signToken ||
            req.body?.signAuthToken ||
            req.body?.accessToken;

        const payload = {
            client_id: req.body?.client_id || creds.CLIENT_ID,
            client_secret: req.body?.client_secret || creds.CLIENT_SECRET,
            redirect_uri: req.body?.redirect_uri || process.env.IAMPECKISH_REDIRECT_URI,
            response_type: req.body?.response_type || "code",
            restaurant_uuids: req.body?.restaurant_uuids || req.body?.restaurantUuids,
            user_uuid: req.body?.user_uuid || req.body?.userUuid
        };

        const result = await authAuthorizeConnect(payload, signToken);

        if (result.bearerToken) {
            res.setHeader("Authorization", result.bearerToken);
        }

        return res.status(200).json({
            success: true,
            status: 2,
            ...result
        });
    } catch (error) {
        return sendErrorResponse(res, error, "authorizeConnect");
    }
};

/* ======================================================
   HTML TEMPLATES FOR OAUTH CALLBACK
====================================================== */

function renderOAuthSuccessHtml(tokenData, errorMsg = null) {
    const expiresAt = tokenStore.tokenExpiry ? tokenStore.tokenExpiry.toLocaleString() : "N/A";
    const accessToken = tokenStore.authToken || tokenData?.access_token || tokenData?.data?.access_token || "N/A";
    const refreshToken = tokenStore.refreshToken || tokenData?.refresh_token || tokenData?.data?.refresh_token || "N/A";
    const maskedToken = accessToken !== "N/A" && accessToken.length > 16
        ? `${accessToken.substring(0, 10)}...${accessToken.substring(accessToken.length - 8)}`
        : accessToken;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Peckish Connect | Connected</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: radial-gradient(circle at 50% 0%, #1a2333 0%, #0a0d14 100%);
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow-x: hidden;
    }
    .container {
      width: 100%;
      max-width: 580px;
      background: rgba(18, 24, 38, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(24px);
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(16, 185, 129, 0.12);
      position: relative;
    }
    .badge-wrapper {
      display: flex;
      justify-content: center;
      margin-bottom: 24px;
    }
    .icon-pulse {
      width: 76px;
      height: 76px;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3));
      border: 2px solid rgba(52, 211, 153, 0.4);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #34d399;
      box-shadow: 0 0 30px rgba(16, 185, 129, 0.3);
      animation: pulse 2.5s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 30px rgba(16, 185, 129, 0.3); }
      50% { transform: scale(1.05); box-shadow: 0 0 45px rgba(16, 185, 129, 0.5); }
    }
    h1 {
      font-size: 26px;
      font-weight: 700;
      text-align: center;
      color: #ffffff;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 14px;
      text-align: center;
      color: #94a3b8;
      margin-bottom: 32px;
      line-height: 1.5;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(52, 211, 153, 0.3);
      color: #34d399;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 14px;
      border-radius: 9999px;
      margin-bottom: 14px;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      background: #34d399;
      border-radius: 50%;
      box-shadow: 0 0 8px #34d399;
    }
    .details-card {
      background: rgba(10, 14, 23, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 28px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-size: 13px;
    }
    .info-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .info-row:first-child {
      padding-top: 0;
    }
    .label {
      color: #64748b;
      font-weight: 500;
    }
    .value {
      color: #f1f5f9;
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
    }
    .token-box {
      margin-top: 14px;
      padding: 12px 14px;
      background: rgba(0, 0, 0, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #a5b4fc;
      word-break: break-all;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn-group {
      display: flex;
      gap: 12px;
    }
    .btn {
      flex: 1;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }
    .btn-primary {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
    }
    .btn-primary:hover {
      opacity: 0.95;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge-wrapper">
      <div class="icon-pulse">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
    </div>
    
    <div style="text-align: center;">
      <div class="status-pill">
        <span class="status-dot"></span>
        OAuth 2.0 Connected
      </div>
    </div>

    <h1>Peckish Connect Authorized</h1>
    <p class="subtitle">Access & refresh tokens have been exchanged and securely saved in memory.</p>

    <div class="details-card">
      <div class="info-row">
        <span class="label">Provider</span>
        <span class="value">Peckish Connect (OAuth 2.0)</span>
      </div>
      <div class="info-row">
        <span class="label">Token Status</span>
        <span class="value" style="color: #34d399;">Active & Valid</span>
      </div>
      <div class="info-row">
        <span class="label">Expires At</span>
        <span class="value">${expiresAt}</span>
      </div>
      <div class="info-row">
        <span class="label">Has Refresh Token</span>
        <span class="value">${refreshToken !== "N/A" ? "Yes (Saved)" : "No"}</span>
      </div>
      <div class="token-box">
        <span>Bearer ${maskedToken}</span>
        <span style="color: #64748b; font-size: 10px;">ACTIVE_TOKEN</span>
      </div>
    </div>

    <div class="btn-group">
      <a href="/api/auth/status" class="btn btn-secondary">Check Status</a>
      <button onclick="window.close()" class="btn btn-primary">Done / Close Window</button>
    </div>
  </div>
</body>
</html>`;
}

function renderOAuthErrorHtml(errorTitle, errorMessage) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Peckish Connect | Authorization Error</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: radial-gradient(circle at 50% 0%, #2a151b 0%, #0a0d14 100%);
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .container {
      width: 100%;
      max-width: 540px;
      background: rgba(26, 17, 22, 0.9);
      border: 1px solid rgba(244, 63, 94, 0.25);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(244, 63, 94, 0.12);
    }
    .badge-wrapper {
      display: flex;
      justify-content: center;
      margin-bottom: 24px;
    }
    .icon-alert {
      width: 72px;
      height: 72px;
      background: rgba(244, 63, 94, 0.15);
      border: 2px solid rgba(244, 63, 94, 0.4);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fb7185;
      box-shadow: 0 0 30px rgba(244, 63, 94, 0.25);
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      text-align: center;
      color: #ffffff;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 14px;
      text-align: center;
      color: #94a3b8;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .error-card {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(244, 63, 94, 0.2);
      border-radius: 12px;
      padding: 16px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #fca5a5;
      margin-bottom: 24px;
      word-break: break-all;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      text-align: center;
      background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
      color: #ffffff;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(244, 63, 94, 0.35);
    }
    .btn:hover {
      opacity: 0.95;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge-wrapper">
      <div class="icon-alert">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
    </div>
    <h1>${errorTitle || "Authorization Failed"}</h1>
    <p class="subtitle">Peckish Connect could not complete the OAuth 2.0 authorization process.</p>
    <div class="error-card">${typeof errorMessage === "object" ? JSON.stringify(errorMessage, null, 2) : (errorMessage || "Unknown error occurred.")}</div>
    <a href="/api/auth/login" class="btn">Try Again</a>
  </div>
</body>
</html>`;
}

export const refreshToken = async (req, res) => {
    try {
        const { creds } = parseCommonParams(req);
        const refreshTokenValue =
            // req.body?.refresh_token ||
            // req.query?.refresh_token ||
            // req.query?.REFRESH_TOKEN ||
            // req.headers["refresh-token"] ||
            // req.headers["x-refresh-token"] ||
            // creds?.REFRESH_TOKEN ||
            tokenStore.refreshToken;

        if (refreshTokenValue) {
            try {
                const oauthResult = await exchangeOAuthToken({
                    grant_type: "refresh_token",
                    refresh_token: refreshTokenValue,
                    client_id: req.body?.client_id || creds.CLIENT_ID,
                    client_secret: req.body?.client_secret || creds.CLIENT_SECRET
                });
                return res.status(200).json({
                    success: true,
                    status: 2,
                    message: "OAuth token refreshed successfully",
                    data: oauthResult.data,
                    activeBearerToken: tokenStore.getBearerToken(),
                    expiresAt: tokenStore.tokenExpiry?.toISOString() || null
                });
            } catch (rfErr) {
                console.warn("[iampeckishController] OAuth refresh_token failed, falling back to credentials token generation:", rfErr.message);
            }
        }

        tokenStore.clear();
        const result = await generateFullToken(creds);

        if (result.bearerToken) {
            res.setHeader("Authorization", result.bearerToken);
        }

        return res.status(200).json({
            success: true,
            status: 2,
            message: "IAmPeckish token refreshed successfully",
            ...result
        });
    } catch (error) {
        return sendErrorResponse(res, error, "refreshToken");
    }
};

export const exchangeToken = async (req, res) => {
    try {
        const { code, refresh_token, grant_type, client_id, client_secret, redirect_uri } = req.body || {};

        if (!code && !refresh_token && !grant_type) {
            return res.status(400).json({
                success: false,
                status: 3,
                error: "Missing required parameters: 'code' or 'refresh_token' must be provided in request body."
            });
        }

        const payload = {
            grant_type: grant_type || (refresh_token ? "refresh_token" : "authorization_code"),
            code,
            refresh_token,
            client_id,
            client_secret,
            redirect_uri
        };

        const tokenResult = await exchangeOAuthToken(payload);

        return res.status(200).json({
            success: true,
            status: 2,
            message: "OAuth token exchanged successfully",
            data: tokenResult.data,
            activeBearerToken: tokenStore.getBearerToken(),
            expiresAt: tokenStore.tokenExpiry?.toISOString() || null
        });
    } catch (error) {
        return sendErrorResponse(res, error, "exchangeToken");
    }
};

export const getAuthorizeUrl = (req, res) => {
    try {
        const authUrl = authGetAuthorizationUrl(req.query);
        if (req.query?.redirect === "true") {
            return res.redirect(authUrl);
        }
        return res.status(200).json({
            success: true,
            status: 2,
            authorizationUrl: authUrl,
            clientId: req.query?.client_id || null,
            redirectUri: req.query?.redirect_uri || process.env.IAMPECKISH_REDIRECT_URI || null
        });
    } catch (error) {
        return sendErrorResponse(res, error, "getAuthorizeUrl");
    }
};

export const getAuthStatus = async (req, res) => {
    try {
        const isExpired = tokenStore.isExpired();
        const hasSignToken = Boolean(tokenStore.signAuthToken);
        const hasAuthToken = Boolean(tokenStore.authToken);
        const hasRefreshToken = Boolean(tokenStore.refreshToken);
        const expiresAt = tokenStore.tokenExpiry?.toISOString() || null;

        return res.status(200).json({
            success: true,
            status: 2,
            authenticated: hasAuthToken && !isExpired,
            isExpired,
            hasSignToken,
            hasAuthToken,
            hasRefreshToken,
            expiresAt,
            bearerToken: tokenStore.getBearerToken() || null
        });
    } catch (error) {
        return sendErrorResponse(res, error, "getAuthStatus");
    }
};

export const login = (req, res) => {
    try {
        const authUrl = authGetAuthorizationUrl(req.query);
        console.log(`[iampeckishController] Redirecting to authorization URL: ${authUrl}`);
        return res.redirect(authUrl);
    } catch (error) {
        return sendErrorResponse(res, error, "login");
    }
};

export const callback = async (req, res) => {
    const acceptsHtml = req.accepts(["html", "json"]) === "html" || (req.headers["accept"] && req.headers["accept"].includes("text/html"));

    try {
        const { code, error, error_description } = req.query;

        if (error) {
            if (acceptsHtml) {
                return res.status(400).send(renderOAuthErrorHtml(error, error_description || "Peckish Connect authorization was denied or failed."));
            }
            return res.status(400).json({
                success: false,
                status: 3,
                error,
                error_description: error_description || "Authorization failed."
            });
        }

        if (!code) {
            const msg = "Missing 'code' query parameter in callback URL.";
            if (acceptsHtml) {
                return res.status(400).send(renderOAuthErrorHtml("Missing Authorization Code", msg));
            }
            return res.status(400).json({
                success: false,
                status: 3,
                error: msg
            });
        }

        const tokenResult = await exchangeOAuthToken({
            grant_type: "authorization_code",
            code,
            redirect_uri: req.query?.redirect_uri || process.env.IAMPECKISH_REDIRECT_URI
        });

        if (acceptsHtml) {
            return res.status(200).send(renderOAuthSuccessHtml(tokenResult.data, tokenResult.data));
        }

        return res.status(200).json({
            success: true,
            status: 2,
            message: "Successfully authenticated with Peckish Connect!",
            tokens: tokenResult.data,
            activeBearerToken: tokenStore.getBearerToken(),
            expiresAt: tokenStore.tokenExpiry?.toISOString() || null
        });
    } catch (err) {
        const errMsg = err.response?.data || err.message;
        if (acceptsHtml) {
            return res.status(500).send(renderOAuthErrorHtml("Token Exchange Error", errMsg));
        }
        return sendErrorResponse(res, err, "callback");
    }
};

export const getProfile = async (req, res) => {
    return res.status(200).json({
        success: true,
        status: 2,
        message: "Authenticated request successfully verified",
        bearerToken: tokenStore.getBearerToken()
    });
};

/* ======================================================
   2️⃣ RESTAURANTS CONTROLLERS (PRC_INS_UPD_PECKISH_RESTURANT)
====================================================== */

export const getRestaurants = async (req, res) => {
    try {
        const { creds, entityId, branchId } = parseCommonParams(req);
        const data = await fetchRestaurants(req.query, req.headers, creds);
        const restaurants = Array.isArray(data) ? data : (data?.data || data?.restaurants || []);

        let synced = 0;
        if (restaurants.length > 0) {
            try {
                synced = await upsertPeckishRestaurants({ restaurants, entityId, branchId });
                console.log(`[iampeckishController] API Call -> Executed PRC_INS_UPD_PECKISH_RESTURANT. Rows Synced: ${synced}`);
            } catch (dbErr) {
                console.error(`[iampeckishController] DB Error in PRC_INS_UPD_PECKISH_RESTURANT:`, dbErr.message);
            }
        }

        return sendSuccessResponse(res, data, entityId, branchId, { synced });
    } catch (error) {
        return sendErrorResponse(res, error, "getRestaurants");
    }
};

export const getRestaurantById = async (req, res) => {
    try {
        const { creds, entityId, branchId } = parseCommonParams(req);
        const { restaurant_uuid } = req.params;
        const data = await fetchRestaurantById(restaurant_uuid, req.headers, creds);
        const item = data?.data || data;
        const restaurants = Array.isArray(item) ? item : (item ? [item] : []);

        let synced = 0;
        if (restaurants.length > 0) {
            try {
                synced = await upsertPeckishRestaurants({ restaurants, entityId, branchId });
                console.log(`[iampeckishController] API Call -> Synced single restaurant [${restaurant_uuid}]. Rows Synced: ${synced}`);
            } catch (dbErr) {
                console.error(`[iampeckishController] DB Error in getRestaurantById:`, dbErr.message);
            }
        }

        return sendSuccessResponse(res, data, entityId, branchId, { synced });
    } catch (error) {
        return sendErrorResponse(res, error, "getRestaurantById");
    }
};

/* ======================================================
   3️⃣ UNITS CONTROLLERS (PRC_INS_UPD_PECKISH_UNITS & CONVERSION)
====================================================== */

export const getUnits = async (req, res) => {
    try {
        const { creds, entityId, branchId } = parseCommonParams(req);
        const data = await fetchUnits(req.query, req.headers, creds);
        const units = Array.isArray(data) ? data : (data?.data || data?.units || []);

        let synced = 0;
        if (units.length > 0) {
            try {
                synced = await upsertPeckishUnits({ units, entityId, branchId });
                console.log(`[iampeckishController] API Call -> Executed PRC_INS_UPD_PECKISH_UNITS. Rows Synced: ${synced}`);
            } catch (dbErr) {
                console.error(`[iampeckishController] DB Error in PRC_INS_UPD_PECKISH_UNITS:`, dbErr.message);
            }
        }

        return sendSuccessResponse(res, data, entityId, branchId, { synced });
    } catch (error) {
        return sendErrorResponse(res, error, "getUnits");
    }
};

export const getUnitConversions = async (req, res) => {
    try {
        const { creds, entityId, branchId } = parseCommonParams(req);
        const data = await fetchUnitConversions(req.query, req.headers, creds);
        const conversions = Array.isArray(data) ? data : (data?.data || data?.conversions || []);
        let synced = 0;
        if (conversions.length > 0) {
            try {
                synced = await upsertPeckishUnitConversions({ conversions, entityId, branchId });
                console.log(`[iampeckishController] API Call -> Executed PRC_INS_UPD_PECKISH_UNIT_CONVERSION. Rows Synced: ${synced}`);
            } catch (dbErr) {
                console.error(`[iampeckishController] DB Error in PRC_INS_UPD_PECKISH_UNIT_CONVERSION:`, dbErr.message);
            }
        }

        return sendSuccessResponse(res, data, entityId, branchId, { synced });
    } catch (error) {
        return sendErrorResponse(res, error, "getUnitConversions");
    }
};

/* ======================================================
   4️⃣ ITEMS & PRODUCTS CONTROLLERS (PRC_INS_UPD_PECKISH_ITEMS, INGREDIENTS, PRODUCTS, PREPARATIONS)
====================================================== */

export const getItems = async (req, res) => {
    try {
        const { creds, entityId, branchId } = parseCommonParams(req);
        const data = await fetchItems(req.query, req.headers, creds);
        const items = Array.isArray(data) ? data : (data?.data || data?.items || []);

        let synced = 0;
        if (items.length > 0) {
            try {
                synced = await upsertPeckishItems({ items, entityId, branchId });
                console.log(`[iampeckishController] API Call -> Executed PRC_INS_UPD_PECKISH_ITEMS. Rows Synced: ${synced}`);
            } catch (dbErr) {
                console.error(`[iampeckishController] DB Error in PRC_INS_UPD_PECKISH_ITEMS:`, dbErr.message);
            }
        }

        return sendSuccessResponse(res, data, entityId, branchId, { synced });
    } catch (error) {
        return sendErrorResponse(res, error, "getItems");
    }
};

export const getIngredients = async (req, res) => {
    try {
        const { creds, entityId, branchId } = parseCommonParams(req);
        const data = await fetchIngredients(req.query, req.headers, creds);
        const ingredients = Array.isArray(data) ? data : (data?.data || data?.ingredients || []);

        let synced = 0;
        if (ingredients.length > 0) {
            try {
                synced = await upsertPeckishIngredients({ ingredients, entityId, branchId });
                console.log(`[iampeckishController] API Call -> Executed PRC_INS_UPD_PECKISH_INGREDIENTS. Rows Synced: ${synced}`);
            } catch (dbErr) {
                console.error(`[iampeckishController] DB Error in PRC_INS_UPD_PECKISH_INGREDIENTS:`, dbErr.message);
            }
        }

        return sendSuccessResponse(res, data, entityId, branchId, { synced });
    } catch (error) {
        return sendErrorResponse(res, error, "getIngredients");
    }
};

export const getPreparations = async (req, res) => {
    try {
        const { creds, entityId, branchId } = parseCommonParams(req);
        const data = await fetchPreparations(req.query, req.headers, creds);
        const preparations = Array.isArray(data) ? data : (data?.data || data?.preparations || []);

        let synced = 0;
        if (preparations.length > 0) {
            try {
                synced = await upsertPeckishPreparations({ preparations, entityId, branchId });
                console.log(`[iampeckishController] API Call -> Executed PRC_INS_UPD_PECKISH_PREPARATIONS. Rows Synced: ${synced}`);
            } catch (dbErr) {
                console.error(`[iampeckishController] DB Error in PRC_INS_UPD_PECKISH_PREPARATIONS:`, dbErr.message);
            }
        }

        return sendSuccessResponse(res, data, entityId, branchId, { synced });
    } catch (error) {
        return sendErrorResponse(res, error, "getPreparations");
    }
};

export const getProducts = async (req, res) => {
    try {
        const { creds, entityId, branchId } = parseCommonParams(req);
        const data = await fetchProducts(req.query, req.headers, creds);
        const products = Array.isArray(data) ? data : (data?.data || data?.products || []);

        let synced = 0;
        if (products.length > 0) {
            try {
                synced = await upsertPeckishProducts({ products, entityId, branchId });
                console.log(`[iampeckishController] API Call -> Executed PRC_INS_UPD_PECKISH_PRODUCTS. Rows Synced: ${synced}`);
            } catch (dbErr) {
                console.error(`[iampeckishController] DB Error in PRC_INS_UPD_PECKISH_PRODUCTS:`, dbErr.message);
            }
        }

        return sendSuccessResponse(res, data, entityId, branchId, { synced });
    } catch (error) {
        return sendErrorResponse(res, error, "getProducts");
    }
};

/* ======================================================
   5️⃣ SUPPLIERS CONTROLLERS (PRC_INS_UPD_PECKISH_SUPPLIERS & DETAILS)
====================================================== */

export const getSuppliers = async (req, res) => {
    try {
        const { creds, entityId, branchId } = parseCommonParams(req);
        const data = await fetchSuppliers(req.query, req.headers, creds);
        const suppliers = Array.isArray(data) ? data : (data?.data || data?.suppliers || []);

        let synced = 0;
        if (suppliers.length > 0) {
            try {
                synced = await upsertPeckishSuppliers({ suppliers, entityId, branchId });
                console.log(`[iampeckishController] API Call -> Executed PRC_INS_UPD_PECKISH_SUPPLIERS. Rows Synced: ${synced}`);
            } catch (dbErr) {
                console.error(`[iampeckishController] DB Error in PRC_INS_UPD_PECKISH_SUPPLIERS:`, dbErr.message);
            }
        }

        return sendSuccessResponse(res, data, entityId, branchId, { synced });
    } catch (error) {
        return sendErrorResponse(res, error, "getSuppliers");
    }
};

export const getSupplierByRef = async (req, res) => {
    try {
        const { creds, entityId, branchId } = parseCommonParams(req);
        const { supplier_ref } = req.params;
        const data = await fetchSupplierByRef(supplier_ref, req.headers, creds);
        const suppliersDetails = Array.isArray(data) ? data : (data ? [data] : []);

        let synced = 0;
        if (suppliersDetails.length > 0) {
            try {
                synced = await upsertPeckishSuppliersDetails({ suppliersDetails, entityId, branchId });
                console.log(`[iampeckishController] API Call -> Executed PRC_INS_UPD_PECKISH_SUPPLIERS_DETAILS. Rows Synced: ${synced}`);
            } catch (dbErr) {
                console.error(`[iampeckishController] DB Error in PRC_INS_UPD_PECKISH_SUPPLIERS_DETAILS:`, dbErr.message);
            }
        }

        return sendSuccessResponse(res, data, entityId, branchId, { synced });
    } catch (error) {
        return sendErrorResponse(res, error, "getSupplierByRef");
    }
};

/* ======================================================
   6️⃣ PURCHASES & INVOICES CONTROLLERS (PRC_INS_UPD_PECKISH_PURCHASE)
====================================================== */

export const getPurchases = async (req, res) => {
    try {
        const { creds, entityId, branchId } = parseCommonParams(req);
        const data = await fetchPurchases(req.query, req.headers, creds);
        const purchases = Array.isArray(data) ? data : (data?.data || data?.purchases || []);

        let synced = 0;
        if (purchases.length > 0) {
            try {
                synced = await upsertPeckishPurchases({ purchases, entityId, branchId });
                console.log(`[iampeckishController] API Call -> Executed PRC_INS_UPD_PECKISH_PURCHASE. Rows Synced: ${synced}`);
            } catch (dbErr) {
                console.error(`[iampeckishController] DB Error in PRC_INS_UPD_PECKISH_PURCHASE:`, dbErr.message);
            }
        }

        return sendSuccessResponse(res, data, entityId, branchId, { synced });
    } catch (error) {
        return sendErrorResponse(res, error, "getPurchases");
    }
};

export const getInvoices = async (req, res) => {
    try {
        const { creds, entityId, branchId } = parseCommonParams(req);
        const data = await fetchInvoices(req.query, req.headers, creds);
        const invoices = Array.isArray(data) ? data : (data?.data || data?.invoices || []);

        let synced = 0;
        if (invoices.length > 0) {
            try {
                synced = await upsertPeckishInvoices({ invoices, entityId, branchId });
                console.log(`[iampeckishController] API Call -> Executed PRC_INS_UPD_PECKISH_INVOICES. Rows Synced: ${synced}`);
            } catch (dbErr) {
                console.error(`[iampeckishController] DB Error in PRC_INS_UPD_PECKISH_INVOICES:`, dbErr.message);
            }
        }

        return sendSuccessResponse(res, data, entityId, branchId, { synced });
    } catch (error) {
        return sendErrorResponse(res, error, "getInvoices");
    }
};

/* ======================================================
   7️⃣ STOCK CONTROLLERS (PRC_INS_UPD_PECKISH_STOCK_LEVEL & TAKE_MASTER)
====================================================== */

export const getStocklevels = async (req, res) => {
    try {
        const { creds, entityId, branchId } = parseCommonParams(req);
        const data = await fetchStocklevels(req.query, req.headers, creds);
        const stockLevels = Array.isArray(data) ? data : (data?.data || data?.stocklevels || []);

        let synced = 0;
        if (stockLevels.length > 0) {
            try {
                synced = await upsertPeckishStockLevelMaster({ stockLevels, entityId, branchId });
                console.log(`[iampeckishController] API Call -> Executed PRC_INS_UPD_PECKISH_STOCK_LEVEL_MASTER. Rows Synced: ${synced}`);
            } catch (dbErr) {
                console.error(`[iampeckishController] DB Error in PRC_INS_UPD_PECKISH_STOCK_LEVEL_MASTER:`, dbErr.message);
            }
        }

        return sendSuccessResponse(res, data, entityId, branchId, { synced });
    } catch (error) {
        return sendErrorResponse(res, error, "getStocklevels");
    }
};

export const getStocktakes = async (req, res) => {
    try {
        const { creds, entityId, branchId } = parseCommonParams(req);
        const data = await fetchStocktakes(req.query, req.headers, creds);
        const stocktakes = Array.isArray(data) ? data : (data?.data || data?.stocktakes || []);

        let synced = 0;
        if (stocktakes.length > 0) {
            try {
                synced = await upsertPeckishStockTakeMaster({ stocktakes, entityId, branchId });
                console.log(`[iampeckishController] API Call -> Executed PRC_INS_UPD_PECKISH_STOCK_TAKE_MASTER. Rows Synced: ${synced}`);
            } catch (dbErr) {
                console.error(`[iampeckishController] DB Error in PRC_INS_UPD_PECKISH_STOCK_TAKE_MASTER:`, dbErr.message);
            }
        }

        return sendSuccessResponse(res, data, entityId, branchId, { synced });
    } catch (error) {
        return sendErrorResponse(res, error, "getStocktakes");
    }
};

export const getStocktakeById = async (req, res) => {
    try {
        const { creds, entityId, branchId } = parseCommonParams(req);
        const { stocktake_uuid } = req.params;
        const data = await fetchStocktakeById(stocktake_uuid, req.headers, creds);
        const item = data?.data || data;
        const stocktakes = Array.isArray(item) ? item : (item ? [item] : []);

        let synced = 0;
        if (stocktakes.length > 0) {
            try {
                synced = await upsertPeckishStockTakeMaster({ stocktakes, entityId, branchId });
                console.log(`[iampeckishController] API Call -> Synced single stocktake [${stocktake_uuid}]. Rows Synced: ${synced}`);
            } catch (dbErr) {
                console.error(`[iampeckishController] DB Error in getStocktakeById:`, dbErr.message);
            }
        }

        return sendSuccessResponse(res, data, entityId, branchId, { synced });
    } catch (error) {
        return sendErrorResponse(res, error, "getStocktakeById");
    }
};

/* ======================================================
   8️⃣ EVENTS CONTROLLERS
====================================================== */

export const getEventsWastes = async (req, res) => {
    try {
        const { creds, entityId, branchId } = parseCommonParams(req);
        const data = await fetchEventData("wastes", req.query, req.headers, creds);
        const wastage = Array.isArray(data) ? data : (data?.data || data?.wastes || []);

        let synced = 0;
        if (wastage.length > 0) {
            try {
                synced = await upsertPeckishWastage({ wastage, entityId, branchId });
                console.log(`[iampeckishController] API Call -> Executed PRC_INS_UPD_PECKISH_WASTAGE. Rows Synced: ${synced}`);
            } catch (dbErr) {
                console.error(`[iampeckishController] DB Error in PRC_INS_UPD_PECKISH_WASTAGE:`, dbErr.message);
            }
        }

        return sendSuccessResponse(res, data, entityId, branchId, { synced });
    } catch (error) {
        return sendErrorResponse(res, error, "getEventsWastes");
    }
};

export const getEventsStocktakes = async (req, res) => {
    try {
        const { creds, entityId, branchId } = parseCommonParams(req);
        const data = await fetchEventData("stocktakes", req.query, req.headers, creds);
        const stocktakes = Array.isArray(data) ? data : (data?.data || data?.stocktakes || []);

        let synced = 0;
        if (stocktakes.length > 0) {
            try {
                synced = await upsertPeckishStockTakes({ stocktakes, entityId, branchId });
                console.log(`[iampeckishController] API Call -> Executed PRC_INS_UPD_PECKISH_STOCK_TAKES. Rows Synced: ${synced}`);
            } catch (dbErr) {
                console.error(`[iampeckishController] DB Error in PRC_INS_UPD_PECKISH_STOCK_TAKES:`, dbErr.message);
            }
        }

        return sendSuccessResponse(res, data, entityId, branchId, { synced });
    } catch (error) {
        return sendErrorResponse(res, error, "getEventsStocktakes");
    }
};

export const getEventsTransfers = async (req, res) => {
    try {
        const { creds, entityId, branchId } = parseCommonParams(req);
        const data = await fetchEventData("transfers", req.query, req.headers, creds);
        const transfers = Array.isArray(data) ? data : (data?.data || data?.transfers || []);

        let synced = 0;
        if (transfers.length > 0) {
            try {
                synced = await upsertPeckishTransfers({ transfers, entityId, branchId });
                console.log(`[iampeckishController] API Call -> Executed PRC_INS_UPD_PECKISH_TRANSFERS. Rows Synced: ${synced}`);
            } catch (dbErr) {
                console.error(`[iampeckishController] DB Error in PRC_INS_UPD_PECKISH_TRANSFERS:`, dbErr.message);
            }
        }

        return sendSuccessResponse(res, data, entityId, branchId, { synced });
    } catch (error) {
        return sendErrorResponse(res, error, "getEventsTransfers");
    }
};

export const getEventsSales = async (req, res) => {
    try {
        const { creds, entityId, branchId } = parseCommonParams(req);
        const data = await fetchEventData("sales", req.query, req.headers, creds);
        const sales = Array.isArray(data) ? data : (data?.data || data?.sales || []);

        let synced = 0;
        if (sales.length > 0) {
            try {
                synced = await upsertPeckishSalesEvents({ sales, entityId, branchId });
                console.log(`[iampeckishController] API Call -> Executed PRC_INS_UPD_PECKISH_SALES_EVENTS. Rows Synced: ${synced}`);
            } catch (dbErr) {
                console.error(`[iampeckishController] DB Error in PRC_INS_UPD_PECKISH_SALES_EVENTS:`, dbErr.message);
            }
        }

        return sendSuccessResponse(res, data, entityId, branchId, { synced });
    } catch (error) {
        return sendErrorResponse(res, error, "getEventsSales");
    }
};

export const getEventsReceives = async (req, res) => {
    try {
        const { creds, entityId, branchId } = parseCommonParams(req);
        const data = await fetchEventData("receives", req.query, req.headers, creds);
        const receives = Array.isArray(data) ? data : (data?.data || data?.receives || []);

        let synced = 0;
        if (receives.length > 0) {
            try {
                synced = await upsertPeckishReceives({ receives, entityId, branchId });
                console.log(`[iampeckishController] API Call -> Executed PRC_INS_UPD_PECKISH_RECEIVES. Rows Synced: ${synced}`);
            } catch (dbErr) {
                console.error(`[iampeckishController] DB Error in PRC_INS_UPD_PECKISH_RECEIVES:`, dbErr.message);
            }
        }

        return sendSuccessResponse(res, data, entityId, branchId, { synced });
    } catch (error) {
        return sendErrorResponse(res, error, "getEventsReceives");
    }
};

export const postEvent = async (req, res) => {
    try {
        const { creds, entityId, branchId } = parseCommonParams(req);
        const { eventType } = req.params;
        const data = await sendEventData(eventType, req.body, req.headers, creds);
        return res.status(200).json({
            success: true,
            status: 2,
            entityId,
            branchId,
            data
        });
    } catch (error) {
        return sendErrorResponse(res, error, "postEvent");
    }
};


