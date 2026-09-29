import Groq from "groq-sdk";

let groqClient = null;

const PRIMARY_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || "llama-3.1-8b-instant";
let modelCache = { models: null, expiresAt: 0 };

const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("AI service is not configured. Add GROQ_API_KEY to backend/.env and restart the backend.");
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  return groqClient;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getStatus = (error) => error?.status || error?.response?.status || error?.code;

const getErrorCode = (error) =>
  error?.error?.code || error?.code || error?.error?.error?.code;

const getErrorMessage = (error) =>
  String(error?.error?.message || error?.message || "");

const isRetryable = (error) => {
  const status = getStatus(error);
  const code = String(getErrorCode(error) || "").toLowerCase();
  const message = getErrorMessage(error).toLowerCase();

  return status === 429 || status === 500 || status === 502 || status === 503 ||
    status === "UNAVAILABLE" || status === "RESOURCE_EXHAUSTED" ||
    code === "json_validate_failed" ||
    message.includes("failed to validate json") ||
    message.includes("json_validate_failed");
};

const isJsonValidateFailed = (error) => {
  const code = String(getErrorCode(error) || "").toLowerCase();
  const message = getErrorMessage(error).toLowerCase();
  return code === "json_validate_failed" || message.includes("failed to validate json");
};

const isModelUnavailable = (error) => {
  const status = getStatus(error);
  const message = getErrorMessage(error).toLowerCase();
  return status === 404 || message.includes("model_not_found") || message.includes("does not exist") || message.includes("do not have access");
};

const getAvailableModels = async () => {
  const now = Date.now();
  if (modelCache.models && modelCache.expiresAt > now) return modelCache.models;

  const client = getGroqClient();
  const result = await client.models.list();
  const models = (result?.data || [])
    .map((item) => item?.id)
    .filter(Boolean);

  if (!models.length) throw new Error("Groq did not return any models for this API key.");
  modelCache = { models, expiresAt: now + 5 * 60 * 1000 };
  return models;
};

const chooseModel = async (requestedModel) => {
  try {
    const models = await getAvailableModels();
    // Prefer Llama instruct models — gpt-oss variants are flaky with json_object mode.
    const preferred = [requestedModel, PRIMARY_MODEL, FALLBACK_MODEL,
      "llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama-3.1-70b-versatile"];
    return preferred.find((model) => model && models.includes(model)) || models[0];
  } catch {
    return requestedModel || PRIMARY_MODEL;
  }
};

const normalizeGroqError = (error) => {
  const status = getStatus(error);
  if (status === 401) return new Error("Groq API key is invalid or expired. Create a new key and update backend/.env.");
  if (status === 403) return new Error("Groq rejected this request. Check your API key and model permissions.");
  if (status === 429) return new Error("Groq rate limit reached. Please wait a moment and try again.");
  if (isJsonValidateFailed(error)) {
    return new Error("The AI returned invalid quiz JSON. Please try generating again.");
  }

  const message = error?.error?.message || error?.message;
  return new Error(message || "The AI service could not complete the request.");
};

const callGroq = async (model, messages, config) => {
  const client = getGroqClient();
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await client.chat.completions.create({ model, messages, ...config });
    } catch (error) {
      lastError = error;
      // JSON mode sometimes returns empty failed_generation — retry, then drop json_object.
      if (isJsonValidateFailed(error) && config.response_format && attempt < 3) {
        await sleep(attempt * 500);
        try {
          const { response_format: _ignored, ...withoutJsonMode } = config;
          return await client.chat.completions.create({ model, messages, ...withoutJsonMode });
        } catch (retryError) {
          lastError = retryError;
          if (!isRetryable(retryError) || attempt === 3) throw retryError;
          await sleep(attempt * 700);
          continue;
        }
      }
      if (!isRetryable(error) || attempt === 3) throw error;
      await sleep(attempt * 700);
    }
  }

  throw lastError;
};

export const getChatCompletion = async (messages, options = {}) => {
  const {
    model = PRIMARY_MODEL,
    temperature = 0.7,
    max_tokens = 1200,
    response_format,
  } = options;

  const config = {
    temperature,
    max_tokens,
    ...(response_format ? { response_format } : {}),
  };

  const selectedModel = await chooseModel(model);

  try {
    const response = await callGroq(selectedModel, messages, config);
    return response.choices?.[0]?.message?.content || "";
  } catch (error) {
    if ((isRetryable(error) || isModelUnavailable(error) || isJsonValidateFailed(error)) &&
      selectedModel !== FALLBACK_MODEL) {
      try {
        const fallbackModel = await chooseModel(FALLBACK_MODEL);
        // Fallback: lower temperature and skip strict JSON mode if that was the failure.
        const fallbackConfig = isJsonValidateFailed(error)
          ? { temperature: Math.min(temperature, 0.3), max_tokens, }
          : config;
        const response = await callGroq(fallbackModel, messages, fallbackConfig);
        return response.choices?.[0]?.message?.content || "";
      } catch (fallbackError) {
        throw normalizeGroqError(fallbackError);
      }
    }
    throw normalizeGroqError(error);
  }
};

// AI JSON responses can occasionally arrive wrapped in markdown despite the prompt.
export const parseAIJson = (raw) => {
  if (!raw || typeof raw !== "string") {
    throw new Error("The AI returned an empty response.");
  }

  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        // Fall through to a useful error below.
      }
    }
    throw new Error("The AI returned an invalid JSON response. Please try again.");
  }
};

export default getGroqClient;
