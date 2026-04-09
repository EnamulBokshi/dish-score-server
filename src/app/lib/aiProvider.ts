import status from "http-status";
import AppError from "../helpers/errorHelpers/AppError";
import { env } from "../../config/env";

type TPromptPart = {
  text?: string;
};

type TPromptContent = {
  role?: string;
  parts?: TPromptPart[];
};

type TAIRequest =
  | string
  | Array<string | TPromptPart>
  | {
      contents?: TPromptContent[];
      generationConfig?: {
        temperature?: number;
        responseMimeType?: string;
      };
    };

const getErrorMessage = (error: unknown) => {
  if (!error || typeof error !== "object") return "Unknown error";
  const maybeError = error as { message?: string };
  return maybeError.message ?? "Unknown error";
};

const getStatusCode = (error: unknown) => {
  if (error instanceof AppError) {
    return error.statusCode;
  }

  if (error && typeof error === "object") {
    const maybeError = error as { status?: number; statusCode?: number };
    return maybeError.statusCode ?? maybeError.status;
  }

  return undefined;
};

const isRetryableProviderError = (error: unknown) => {
  const statusCode = getStatusCode(error);
  const message = getErrorMessage(error).toLowerCase();

  return (
    statusCode === 404 ||
    statusCode === 408 ||
    statusCode === 409 ||
    statusCode === 425 ||
    statusCode === 429 ||
    statusCode === 500 ||
    statusCode === 502 ||
    statusCode === 503 ||
    statusCode === 504 ||
    message.includes("rate") ||
    message.includes("quota") ||
    message.includes("temporar") ||
    message.includes("endpoint")
  );
};

const extractPromptText = (request: TAIRequest): string => {
  if (typeof request === "string") return request;

  if (Array.isArray(request)) {
    return request
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item.text === "string") return item.text;
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  const contents = request.contents ?? [];

  return contents
    .flatMap((content) => content.parts ?? [])
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .filter(Boolean)
    .join("\n");
};

const extractTemperature = (request: TAIRequest): number => {
  if (typeof request === "string" || Array.isArray(request)) {
    return 0.3;
  }

  return request.generationConfig?.temperature ?? 0.3;
};

const getOpenRouterModelCandidates = () => {
  if (env.AI.OPENROUTER_STRICT_MODEL) {
    return [env.AI.OPENROUTER_MODEL];
  }

  return Array.from(
    new Set([
      env.AI.OPENROUTER_MODEL,
      "meta-llama/llama-3.1-8b-instruct:free",
      "mistralai/mistral-7b-instruct:free",
      "google/gemma-2-9b-it:free",
    ]),
  );
};

const OPENROUTER_MAX_RETRIES = 2;
const OPENROUTER_BASE_BACKOFF_MS = 1200;

const wait = async (ms: number) => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

const getRetryAfterMs = (headers: Headers) => {
  const rawRetryAfter = headers.get("retry-after");
  if (!rawRetryAfter) return undefined;

  const seconds = Number(rawRetryAfter);
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.round(seconds * 1000);
  }

  return undefined;
};

const callOpenRouter = async (prompt: string, temperature: number): Promise<string> => {
  if (!env.AI.OPENROUTER_API_KEY) {
    throw new AppError(status.BAD_GATEWAY, "OPENROUTER_API_KEY is not configured.");
  }

  let lastError: unknown;
  const attemptedModels: string[] = [];

  for (const model of getOpenRouterModelCandidates()) {
    attemptedModels.push(model);

    try {
      for (let attempt = 0; attempt <= OPENROUTER_MAX_RETRIES; attempt += 1) {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.AI.OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            temperature,
          }),
        });

        if (!response.ok) {
          const body = await response.text();

          if (response.status === 429 && attempt < OPENROUTER_MAX_RETRIES) {
            const retryAfterMs = getRetryAfterMs(response.headers);
            const backoffMs = retryAfterMs ?? OPENROUTER_BASE_BACKOFF_MS * 2 ** attempt;
            await wait(backoffMs);
            continue;
          }

          throw new AppError(
            response.status,
            `OpenRouter model ${model} failed with status ${response.status}: ${body}`,
          );
        }

        const parsed = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };

        const content = parsed.choices?.[0]?.message?.content?.trim();
        if (!content) {
          throw new AppError(status.BAD_GATEWAY, `OpenRouter model ${model} returned empty content.`);
        }

        return content;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw new AppError(
    status.BAD_GATEWAY,
    `OpenRouter request failed. Tried models: ${attemptedModels.join(", ")}. Last error: ${getErrorMessage(lastError)}`,
  );
};

const callOpenAI = async (prompt: string, temperature: number): Promise<string> => {
  if (!env.AI.OPENAI_API_KEY) {
    throw new AppError(status.BAD_GATEWAY, "OPENAI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.AI.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.AI.OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new AppError(
      response.status,
      `OpenAI model ${env.AI.OPENAI_MODEL} failed with status ${response.status}: ${body}`,
    );
  }

  const parsed = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = parsed.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new AppError(status.BAD_GATEWAY, `OpenAI model ${env.AI.OPENAI_MODEL} returned empty content.`);
  }

  return content;
};

export const generateAIText = async (request: TAIRequest): Promise<string> => {
  const provider = env.AI.PROVIDER;
  const prompt = extractPromptText(request);
  const temperature = extractTemperature(request);

  if (!prompt.trim()) {
    throw new AppError(status.BAD_REQUEST, "Prompt cannot be empty");
  }

  if (provider === "openrouter") {
    return callOpenRouter(prompt, temperature);
  }

  if (provider === "openai") {
    return callOpenAI(prompt, temperature);
  }

  const hasOpenRouter = Boolean(env.AI.OPENROUTER_API_KEY);
  const hasOpenAI = Boolean(env.AI.OPENAI_API_KEY);

  if (!hasOpenRouter && !hasOpenAI) {
    throw new AppError(
      status.BAD_GATEWAY,
      "No AI provider credentials found. Configure OPENROUTER_API_KEY or OPENAI_API_KEY.",
    );
  }

  if (hasOpenRouter) {
    try {
      return await callOpenRouter(prompt, temperature);
    } catch (error) {
      if (!hasOpenAI || !isRetryableProviderError(error)) {
        throw error;
      }
    }
  }

  return callOpenAI(prompt, temperature);
};
