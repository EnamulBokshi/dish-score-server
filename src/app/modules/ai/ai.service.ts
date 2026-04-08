import status from "http-status";
import { Prisma } from "../../../generated/prisma/client";
import z from "zod";
import AppError from "../../helpers/errorHelpers/AppError";
import prisma from "../../lib/prisma";
import { geminiModel } from "../../lib/gemini";

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
];

const isFoodRelatedQuery = (query: string) => {
  const normalized = query.toLowerCase();
  return FOOD_QUERY_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ");

const toWordTokens = (query: string) => {
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 3),
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
  const response = await geminiModel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  });

  const rawText = response.response.text();
  const jsonText = extractJsonFromText(rawText);

  try {
    const parsed = JSON.parse(jsonText);
    return schema.parse(parsed);
  } catch {
    throw new AppError(status.BAD_GATEWAY, "AI generated an invalid response format");
  }
};

const getDishContextForChat = async (query: string, maxPrice: number | undefined, limit: number) => {
  const tokens = toWordTokens(query);
  const tokenFilters: Prisma.DishWhereInput[] = tokens.flatMap((token) => [
    { name: { contains: token, mode: "insensitive" } },
    { description: { contains: token, mode: "insensitive" } },
    { restaurant: { name: { contains: token, mode: "insensitive" } } },
    { tags: { has: token } },
    { ingredients: { has: token } },
  ]);

  const where: Prisma.DishWhereInput = {
    restaurant: {
      isDeleted: false,
    },
    ...(maxPrice ? { price: { lte: maxPrice } } : {}),
    ...(tokenFilters.length > 0 ? { OR: tokenFilters } : {}),
  };

  return prisma.dish.findMany({
    where,
    take: Math.max(limit * 3, 10),
    orderBy: [{ ratingAvg: "desc" }, { totalReviews: "desc" }, { createdAt: "desc" }],
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
  const tokens = toWordTokens(query);
  const tokenFilters: Prisma.RestaurantWhereInput[] = tokens.flatMap((token) => [
    { name: { contains: token, mode: "insensitive" } },
    { description: { contains: token, mode: "insensitive" } },
    { city: { contains: token, mode: "insensitive" } },
    { tags: { has: token } },
  ]);

  const where: Prisma.RestaurantWhereInput = {
    isDeleted: false,
    ...(tokenFilters.length > 0 ? { OR: tokenFilters } : {}),
  };

  return prisma.restaurant.findMany({
    where,
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

const chat = async (payload: IChatPayload) => {
  const query = normalizeText(payload.query);
  const top = payload.top ?? 3;

  if (!isFoodRelatedQuery(query)) {
    return {
      allowed: false,
      answer:
        "I can only help with food platform queries like dishes, restaurants, prices, ratings, and reviews.",
      recommendations: [],
      confidence: "low",
    };
  }

  const [dishContext, restaurantContext] = await Promise.all([
    getDishContextForChat(query, payload.maxPrice, top),
    getRestaurantContextForChat(query, top),
  ]);

  if (dishContext.length === 0 && restaurantContext.length === 0) {
    return {
      allowed: true,
      answer: "I could not find enough matching data right now. Try a more specific food query.",
      recommendations: [],
      confidence: "low",
    };
  }

  const prompt = `You are a food recommendation assistant for this platform.
Only answer from the provided JSON context. If context is insufficient, clearly say so.
Do not invent dishes, restaurants, prices, or ratings.

User query: ${query}
Top requested: ${top}

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

  const aiResult = await generateStructuredOutput(prompt, chatOutputSchema);

  return {
    allowed: true,
    ...aiResult,
  };
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

const searchSuggestions = async (payload: ISearchSuggestionsPayload) => {
  const query = normalizeText(payload.query);
  const normalizedQuery = query.toLowerCase();
  const limit = payload.limit ?? 8;

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
    return {
      suggestions: deterministicSuggestions.slice(0, limit),
      source: "database",
    };
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

  return {
    suggestions: mergedSuggestions,
    source: "hybrid",
  };
};

export const AIService = {
  chat,
  generateReviewDescription,
  searchSuggestions,
};
