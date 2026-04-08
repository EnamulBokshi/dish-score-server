import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";

const geminiClient = new GoogleGenerativeAI(env.GEMINI.API_KEY);

export const geminiModel = geminiClient.getGenerativeModel({
  model: env.GEMINI.MODEL,
});
