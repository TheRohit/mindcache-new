import { groq, type GroqLanguageModelOptions } from "@ai-sdk/groq";

const titleModel = process.env.AI_TITLE_MODEL ?? "openai/gpt-oss-20b";
const extractionModel = process.env.AI_EXTRACTION_MODEL ?? "openai/gpt-oss-20b";

export const aiModels = {
  title: groq(titleModel),
  extraction: groq(extractionModel),
};

export const groqProviderOptions = {
  structuredOutputs: true,
  strictJsonSchema: true,
  serviceTier: "on_demand",
} satisfies GroqLanguageModelOptions;

