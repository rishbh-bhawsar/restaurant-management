/**
 * Helper to construct Axios request configuration forwarding query params and headers
 * 
 * @param {Object} [params] - Query parameters
 * @param {Object|string} [reqHeaders] - Express request headers
 * @param {Object} [creds] - Optional credential overrides
 * @returns {Object} Axios request config
 */
export function buildPeckishRequestConfig(params = {}, reqHeaders = {}, creds = {}) {
    const config = {
        params: { ...(creds.extraParams || {}), ...params },
        headers: {}
    };

    // Remove internal routing query params so they don't pollute the outbound API call
    delete config.params.URL_PARAMETER;
    delete config.params.entityId;
    delete config.params.branchId;
    delete config.params.URL_PATH;
    delete config.params.url_path;
    delete config.params.apiUrl;
    delete config.params.API_URL;
    delete config.params.baseUrl;
    delete config.params.BASE_URL;
    delete config.params["restaurant-uuid"];
    delete config.params["restaurant_uuid"];
    delete config.params["RESTAURANT_UUID"];

    const baseUrl =
        creds.URL_PATH ||
        creds.BASE_URL ||
        params.URL_PATH ||
        params.url_path ||
        params.apiUrl ||
        params.API_URL ||
        params.baseUrl ||
        params.BASE_URL;

    if (baseUrl) {
        config.baseURL = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    }

    const headersObj = typeof reqHeaders === "string" ? { authorization: reqHeaders } : (reqHeaders || {});

    const authHeader =
        creds.ACCESS_TOKEN ||
        headersObj.authorization ||
        headersObj.Authorization ||
        creds.TOKEN;

    if (authHeader) {
        config.headers["Authorization"] = authHeader.startsWith("Bearer ") ? authHeader : `Bearer ${authHeader}`;
    }

    const restUuid =
        creds.RESTAURANT_UUID ||
        headersObj["restaurant-uuid"] ||
        headersObj["x-restaurant-uuid"] ||
        params["restaurant_uuid"] ||
        params["restaurant-uuid"];

    if (restUuid) {
        config.headers["restaurant-uuid"] = restUuid;
    }

    const DEFAULT_CLIENT_ID = process.env.IAMPECKISH_CLIENT_ID;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const rawClientId = creds.CLIENT_ID || creds.clientId || headersObj["x-client-id"] || headersObj["client-id"] || process.env.IAMPECKISH_CLIENT_ID;
    const clientId = (rawClientId && uuidRegex.test(rawClientId)) ? rawClientId : DEFAULT_CLIENT_ID;

    if (clientId) {
        config.headers["x-client-id"] = clientId;
        config.headers["client-id"] = clientId;
    }

    const clientSecret = creds.CLIENT_SECRET || creds.clientSecret || headersObj["x-client-secret"] || headersObj["client-secret"] || process.env.IAMPECKISH_CLIENT_SECRET;
    if (clientSecret) {
        config.headers["x-client-secret"] = clientSecret;
        config.headers["client-secret"] = clientSecret;
    }

    const apiKey = creds.API_KEY || creds.apiKey || headersObj["x-api-key"] || headersObj["api-key"] || process.env.IAMPECKISH_API_KEY;
    if (apiKey) {
        config.headers["x-api-key"] = apiKey;
    }

    console.log("🔍 [Dynamic Check] Outbound Query Params ->", JSON.stringify(config.params));
    console.log("🔍 [Dynamic Check] Restaurant-UUID Header ->", config.headers["restaurant-uuid"] || "None");

    return config;
}