import status from "http-status";
import { Prisma } from "../../../generated/prisma/client";
import z from "zod";
import AppError from "../../helpers/errorHelpers/AppError";
import prisma from "../../lib/prisma";
import { generateAIText } from "../../lib/aiProvider";

interface IChatPayload {
  query: string;
  maxPrice?: number;
  top?: number;
}

interface IReviewDescriptionPayload {
  title?: string;
  rating: number;
  tags?: string[];
  dishName: string;
  restaurantName: string;
  restaurantRatingAvg: number;
  dishRating: number;
}

interface ISearchSuggestionsPayload {
  query: string;
  limit?: number;
}

interface IChatRecommendation {
  dishName: string;
  restaurantName: string;
  price: number | null;
  rating: number;
  reason: string;
}

interface IChatResponse {
  allowed: boolean;
  answer: string;
  recommendations: IChatRecommendation[];
  confidence: "high" | "medium" | "low";
  source?: "live" | "cache" | "fallback";
}

interface ISearchSuggestionsResponse {
  suggestions: string[];
  source: "database" | "hybrid" | "cache";
}

const FOOD_QUERY_KEYWORDS = [
  "dish",
  "food",
  "restaurant",
  "meal",
  "review",
  "rating",
  "price",
  "affordable",
  "cheap",
  "best",
  "top",
  "recommend",
  "recommendation",
  "spicy",
  "burger",
  "chicken",
  "pizza",
  "fry",
  "pasta",
  "rice",
  "drink",
  "dessert",
  "healthy",
  "vegan",
  "vegetarian",
  "protein",
  "low calorie",
  "salad",
];

const QUERY_STOPWORDS = new Set([
  "top",
  "best",
  "food",
  "dish",
  "dishes",
  "restaurant",
  "restaurants",
  "meal",
  "meals",
  "review",
  "reviews",
  "rating",
  "ratings",
  "price",
  "prices",
  "affordable",
  "cheap",
  "budget",
  "popular",
  "recommend",
  "recommendations",
  "suggest",
  "suggestions",
  "me",
  "the",
  "a",
  "an",
  "in",
  "for",
  "of",
  "with",
  "and",
  "to",
  "3",
  "5",
  "10",
]);

const CHAT_CACHE_TTL_MS = 90 * 1000;
const SUGGESTION_CACHE_TTL_MS = 2 * 60 * 1000;

type TCacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const chatCache = new Map<string, TCacheEntry<IChatResponse>>();
const suggestionCache = new Map<string, TCacheEntry<ISearchSuggestionsResponse>>();

const isFoodRelatedQuery = (query: string) => {
  const normalized = query.toLowerCase();
  return FOOD_QUERY_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ");

const extractRequestedTop = (query: string, fallback: number) => {
  const match = query.match(/\b([1-9]|10)\b/);
  if (!match) return fallback;

  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const isAffordableIntent = (query: string) => {
  const normalized = query.toLowerCase();
  return /(affordable|cheap|budget|low\s*price|under\s*\d+)/i.test(normalized);
};

const parseBudgetFromQuery = (query: string): number | undefined => {
  const normalized = query.toLowerCase();

  const relationalPatterns = [
    /(?:under|below|less than|within)\s*(?:tk\.?|bdt\.?|taka)?\s*(\d{2,5})/i,
    /(?:tk\.?|bdt\.?|taka)\s*(\d{2,5})\s*(?:or less|max|maximum)?/i,
  ];

  for (const pattern of relationalPatterns) {
    const match = normalized.match(pattern);
    if (!match) continue;

    const parsed = Number(match[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return undefined;
};

const detectQueryIntents = (query: string) => {
  const normalized = query.toLowerCase();
  return {
    affordable: isAffordableIntent(query),
    healthy: /(healthy|low\s*calorie|protein|nutritious|diet)/i.test(normalized),
    spicy: /(spicy|hot|chili|chilli)/i.test(normalized),
    vegan: /(vegan|vegetarian|plant\s*based)/i.test(normalized),
  };
};

const buildDietarySignalTokens = (query: string) => {
  const intents = detectQueryIntents(query);
  const tokens: string[] = [];

  if (intents.healthy) {
    tokens.push("healthy", "protein", "salad", "grill", "boiled");
  }
  if (intents.spicy) {
    tokens.push("spicy", "chili", "chilli", "hot");
  }
  if (intents.vegan) {
    tokens.push("vegan", "vegetarian", "plant-based");
  }

  return Array.from(new Set(tokens));
};

const buildCacheKey = (parts: unknown[]) => JSON.stringify(parts);

const getCached = <T>(cache: Map<string, TCacheEntry<T>>, key: string): T | null => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

const setCached = <T>(
  cache: Map<string, TCacheEntry<T>>,
  key: string,
  value: T,
  ttlMs: number,
) => {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
};

const getMeaningfulTokens = (query: string) => {
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 3)
        .filter((token) => !QUERY_STOPWORDS.has(token)),
    ),
  ).slice(0, 6);
};

const extractJsonFromText = (raw: string) => {
  const trimmed = raw.trim();

  if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  }

  return trimmed;
};

const generateStructuredOutput = async <T>(prompt: string, schema: z.ZodSchema<T>) => {
  const rawText = await generateAIText({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  });

  const jsonText = extractJsonFromText(rawText);

  try {
    const parsed = JSON.parse(jsonText);
    return schema.parse(parsed);
  } catch {
    throw new AppError(status.BAD_GATEWAY, "AI generated an invalid response format");
  }
};

const buildChatFallbackResponse = (
  query: string,
  top: number,
  dishes: Array<{
    name: string;
    price: number | null;
    ratingAvg: number;
    totalReviews: number;
    restaurant: { name: string };
  }>,
): IChatResponse => {
  const recommendations = dishes.slice(0, top).map((dish) => ({
    dishName: dish.name,
    restaurantName: dish.restaurant.name,
    price: dish.price,
    rating: dish.ratingAvg,
    reason:
      dish.totalReviews > 0
        ? `Good rating (${dish.ratingAvg.toFixed(1)}) from ${dish.totalReviews} reviews`
        : `Available on the platform${dish.price === null ? "" : ` with price ${dish.price}`}`,
  }));

  const answer =
    recommendations.length > 0
      ? `Live AI is temporarily unavailable, but here are top data-based picks for "${query}".`
      : "Live AI is temporarily unavailable right now. Please try again shortly.";

  return {
    allowed: true,
    answer,
    recommendations,
    confidence: recommendations.length > 0 ? "medium" : "low",
    source: "fallback",
  };
};

const getDishContextForChat = async (query: string, maxPrice: number | undefined, limit: number) => {
  const intents = detectQueryIntents(query);
  const affordableIntent = intents.affordable;
  const tokens = getMeaningfulTokens(query);
  const dietarySignalTokens = buildDietarySignalTokens(query);
  const allTokens = Array.from(new Set([...tokens, ...dietarySignalTokens]));
  const tokenFilters: Prisma.DishWhereInput[] = tokens.flatMap((token) => [
    { name: { contains: token, mode: "insensitive" } },
    { description: { contains: token, mode: "insensitive" } },
    { restaurant: { name: { contains: token, mode: "insensitive" } } },
    { tags: { has: token } },
    { ingredients: { has: token } },
  ]);

  for (const token of dietarySignalTokens) {
    tokenFilters.push(
      { tags: { has: token } },
      { ingredients: { has: token } },
      { description: { contains: token, mode: "insensitive" } },
    );
  }

  const where: Prisma.DishWhereInput = {
    restaurant: {
      isDeleted: false,
    },
    ...(maxPrice ? { price: { lte: maxPrice } } : {}),
    ...(tokenFilters.length > 0 ? { OR: tokenFilters } : {}),
  };

  const hasSpecificSearchTerms = allTokens.length > 0;
  const orderBy: Prisma.DishOrderByWithRelationInput | Prisma.DishOrderByWithRelationInput[] =
    affordableIntent && !hasSpecificSearchTerms
      ? [{ price: "asc" }, { ratingAvg: "desc" }, { totalReviews: "desc" }, { createdAt: "desc" }]
      : [{ ratingAvg: "desc" }, { totalReviews: "desc" }, { createdAt: "desc" }];

  const dishContext = await prisma.dish.findMany({
    where,
    take: Math.max(limit * 3, 10),
    orderBy,
    select: {
      id: true,
      name: true,
      price: true,
      tags: true,
      ingredients: true,
      ratingAvg: true,
      totalReviews: true,
      restaurant: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },
    },
  });

  if (dishContext.length > 0 || hasSpecificSearchTerms) {
    return dishContext;
  }

  return prisma.dish.findMany({
    where: {
      restaurant: {
        isDeleted: false,
      },
      ...(maxPrice ? { price: { lte: maxPrice } } : {}),
    },
    take: Math.max(limit * 3, 10),
    orderBy: affordableIntent
      ? [{ price: "asc" }, { ratingAvg: "desc" }, { totalReviews: "desc" }, { createdAt: "desc" }]
      : [{ ratingAvg: "desc" }, { totalReviews: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      price: true,
      tags: true,
      ingredients: true,
      ratingAvg: true,
      totalReviews: true,
      restaurant: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },
    },
  });
};

const getRestaurantContextForChat = async (query: string, limit: number) => {
  const intents = detectQueryIntents(query);
  const affordableIntent = intents.affordable;
  const tokens = getMeaningfulTokens(query);
  const dietarySignalTokens = buildDietarySignalTokens(query);
  const tokenFilters: Prisma.RestaurantWhereInput[] = tokens.flatMap((token) => [
    { name: { contains: token, mode: "insensitive" } },
    { description: { contains: token, mode: "insensitive" } },
    { city: { contains: token, mode: "insensitive" } },
    { tags: { has: token } },
  ]);

  for (const token of dietarySignalTokens) {
    tokenFilters.push(
      { tags: { has: token } },
      { description: { contains: token, mode: "insensitive" } },
    );
  }

  const where: Prisma.RestaurantWhereInput = {
    isDeleted: false,
    ...(tokenFilters.length > 0 ? { OR: tokenFilters } : {}),
  };

  const hasSpecificSearchTerms = tokens.length > 0;
  const orderBy: Prisma.RestaurantOrderByWithRelationInput | Prisma.RestaurantOrderByWithRelationInput[] =
    affordableIntent && !hasSpecificSearchTerms
      ? [{ ratingAvg: "desc" }, { totalReviews: "desc" }, { createdAt: "desc" }]
      : [{ ratingAvg: "desc" }, { totalReviews: "desc" }, { createdAt: "desc" }];

  const restaurantContext = await prisma.restaurant.findMany({
    where,
    take: Math.max(limit * 2, 6),
    orderBy,
    select: {
      id: true,
      name: true,
      city: true,
      tags: true,
      ratingAvg: true,
      totalReviews: true,
    },
  });

  if (restaurantContext.length > 0 || tokens.length > 0 || dietarySignalTokens.length > 0) {
    return restaurantContext;
  }

  return prisma.restaurant.findMany({
    where: {
      isDeleted: false,
    },
    take: Math.max(limit * 2, 6),
    orderBy: [{ ratingAvg: "desc" }, { totalReviews: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      city: true,
      tags: true,
      ratingAvg: true,
      totalReviews: true,
    },
  });
};

const chatOutputSchema = z.object({
  answer: z.string().min(1),
  recommendations: z
    .array(
      z.object({
        dishName: z.string(),
        restaurantName: z.string(),
        price: z.number().nullable(),
        rating: z.number(),
        reason: z.string(),
      }),
    )
    .max(5),
  confidence: z.enum(["high", "medium", "low"]),
});

const chat = async (payload: IChatPayload): Promise<IChatResponse> => {
  const query = normalizeText(payload.query);
  const top = extractRequestedTop(query, payload.top ?? 3);
  const budgetFromText = parseBudgetFromQuery(query);
  const effectiveMaxPrice =
    typeof payload.maxPrice === "number" && payload.maxPrice > 0
      ? payload.maxPrice
      : budgetFromText;

  const chatCacheKey = buildCacheKey(["chat", query.toLowerCase(), top, effectiveMaxPrice ?? null]);
  const cachedResponse = getCached(chatCache, chatCacheKey);
  if (cachedResponse) {
    return {
      ...cachedResponse,
      source: "cache",
    };
  }

  if (!isFoodRelatedQuery(query)) {
    const blockedResponse: IChatResponse = {
      allowed: false,
      answer:
        "I can only help with food platform queries like dishes, restaurants, prices, ratings, and reviews.",
      recommendations: [],
      confidence: "low",
    };
    setCached(chatCache, chatCacheKey, blockedResponse, CHAT_CACHE_TTL_MS);
    return blockedResponse;
  }

  const [dishContext, restaurantContext] = await Promise.all([
    getDishContextForChat(query, effectiveMaxPrice, top),
    getRestaurantContextForChat(query, top),
  ]);

  if (dishContext.length === 0 && restaurantContext.length === 0) {
    const noContextResponse: IChatResponse = {
      allowed: true,
      answer: "I could not find enough matching data right now. Try a more specific food query.",
      recommendations: [],
      confidence: "low",
    };
    setCached(chatCache, chatCacheKey, noContextResponse, CHAT_CACHE_TTL_MS);
    return noContextResponse;
  }

  const prompt = `You are a food recommendation assistant for this platform.
Only answer from the provided JSON context. If context is insufficient, clearly say so.
Do not invent dishes, restaurants, prices, or ratings.

User query: ${query}
Top requested: ${top}
Budget limit: ${effectiveMaxPrice ?? "not specified"}

Context JSON:
${JSON.stringify({
  dishes: dishContext,
  restaurants: restaurantContext,
})}

Return ONLY valid JSON with this shape:
{
  "answer": "string",
  "recommendations": [
    {
      "dishName": "string",
      "restaurantName": "string",
      "price": 0,
      "rating": 0,
      "reason": "string"
    }
  ],
  "confidence": "high|medium|low"
}

Rules:
- recommendations max ${top}
- keep answer concise and relevant to this platform only
- if affordable/cheap is asked, prioritize lower price dishes
`;

  let response: IChatResponse;

  try {
    const aiResult = await generateStructuredOutput(prompt, chatOutputSchema);
    response = {
      allowed: true,
      ...aiResult,
      source: "live",
    };
  } catch {
    response = buildChatFallbackResponse(query, top, dishContext);
  }

  setCached(chatCache, chatCacheKey, response, CHAT_CACHE_TTL_MS);

  return response;
};

const reviewDescriptionOutputSchema = z.object({
  description: z.string().min(20).max(500),
  tone: z.enum(["positive", "balanced", "critical"]),
  highlights: z.array(z.string().min(2)).max(5),
});

const generateReviewDescription = async (payload: IReviewDescriptionPayload) => {
  const prompt = `You are helping a user write a review description.
Keep it natural, honest, and aligned with the rating.

Input JSON:
${JSON.stringify(payload)}

Output must be ONLY valid JSON:
{
  "description": "string",
  "tone": "positive|balanced|critical",
  "highlights": ["string"]
}

Rules:
- description length: 40-110 words
- mention dish name naturally
- align sentiment with rating (${payload.rating}/5)
- avoid fake claims or unrelated information
`;

  return generateStructuredOutput(prompt, reviewDescriptionOutputSchema);
};

const suggestionsOutputSchema = z.object({
  suggestions: z.array(z.string().min(2)).max(10),
});

const uniqueLowercase = (values: string[]) => {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const normalized = value.toLowerCase().trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(value.trim());
  }

  return output;
};

const buildDeterministicSuggestions = (
  query: string,
  limit: number,
  items: Array<{ name: string; tags: string[]; ingredients: string[] }>,
) => {
  const normalizedQuery = query.toLowerCase();
  const suggestions: string[] = [];

  for (const item of items) {
    const dishName = item.name.toLowerCase();
    if (dishName.startsWith(normalizedQuery)) {
      suggestions.push(item.name);
    }

    const words = dishName.split(/\s+/);
    const qWords = normalizedQuery.split(/\s+/);
    const lastQueryWord = qWords[qWords.length - 1];

    for (let i = 0; i < words.length; i += 1) {
      if (words[i] === lastQueryWord && i + 1 < words.length) {
        suggestions.push(`${query} ${words[i + 1]}`);
      }
    }

    for (const tag of item.tags) {
      if (tag.toLowerCase().startsWith(normalizedQuery)) {
        suggestions.push(tag);
      }
    }

    for (const ingredient of item.ingredients) {
      if (ingredient.toLowerCase().startsWith(normalizedQuery)) {
        suggestions.push(ingredient);
      }
    }
  }

  return uniqueLowercase(suggestions).slice(0, limit);
};

const searchSuggestions = async (
  payload: ISearchSuggestionsPayload,
): Promise<ISearchSuggestionsResponse> => {
  const query = normalizeText(payload.query);
  const normalizedQuery = query.toLowerCase();
  const limit = payload.limit ?? 8;

  const suggestionCacheKey = buildCacheKey(["suggest", normalizedQuery, limit]);
  const cachedResponse = getCached(suggestionCache, suggestionCacheKey);
  if (cachedResponse) {
    return {
      ...cachedResponse,
      source: "cache",
    };
  }

  const dishCandidates = await prisma.dish.findMany({
    where: {
      restaurant: {
        isDeleted: false,
      },
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { tags: { has: normalizedQuery } },
        { ingredients: { has: normalizedQuery } },
      ],
    },
    take: 30,
    orderBy: [{ totalReviews: "desc" }, { ratingAvg: "desc" }],
    select: {
      name: true,
      tags: true,
      ingredients: true,
    },
  });

  const deterministicSuggestions = buildDeterministicSuggestions(query, limit, dishCandidates);

  if (deterministicSuggestions.length >= limit) {
    const response: ISearchSuggestionsResponse = {
      suggestions: deterministicSuggestions.slice(0, limit),
      source: "database",
    };
    setCached(suggestionCache, suggestionCacheKey, response, SUGGESTION_CACHE_TTL_MS);
    return response;
  }

  const prompt = `You generate search auto-complete suggestions for a food platform.

Current user input: "${query}"
Existing related dish/tag/ingredient context:
${JSON.stringify(dishCandidates)}

Return ONLY valid JSON:
{
  "suggestions": ["string"]
}

Rules:
- max ${limit} suggestions
- all suggestions must be food related and relevant to the current query
- keep suggestions short (1-3 words)
- avoid duplicates
`;

  const aiResult = await generateStructuredOutput(prompt, suggestionsOutputSchema);

  const mergedSuggestions = uniqueLowercase([
    ...deterministicSuggestions,
    ...aiResult.suggestions,
  ]).slice(0, limit);

  const response: ISearchSuggestionsResponse = {
    suggestions: mergedSuggestions,
    source: "hybrid",
  };

  setCached(suggestionCache, suggestionCacheKey, response, SUGGESTION_CACHE_TTL_MS);

  return response;
};

export const AIService = {
  chat,
  generateReviewDescription,
  searchSuggestions,
};
