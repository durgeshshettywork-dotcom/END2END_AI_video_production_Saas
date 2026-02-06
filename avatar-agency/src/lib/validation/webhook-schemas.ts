/**
 * Webhook Payload Validation Schemas
 *
 * These schemas validate incoming webhook callback payloads to ensure
 * data integrity and prevent injection attacks.
 *
 * Security Considerations:
 * - Max string lengths prevent memory exhaustion
 * - Strict typing prevents type confusion attacks
 * - Required fields ensure complete data
 */

import { z } from "zod";

// Maximum lengths for text fields (prevents memory exhaustion)
const MAX_OUTPUT_LENGTH = 100000; // 100KB for research/script output
const MAX_URL_LENGTH = 2048;
const MAX_ERROR_LENGTH = 5000;
const MAX_MESSAGE_LENGTH = 1000;

// Base schema that all callbacks must have
const baseCallbackSchema = z.object({
  type: z.string().min(1).max(50),
  projectId: z.string().cuid(),
  timestamp: z.string().datetime().optional(),
});

// Research complete callback
export const researchCompleteSchema = baseCallbackSchema.extend({
  type: z.literal("research_complete"),
  researchOutput: z.string().max(MAX_OUTPUT_LENGTH).optional(),
  output: z.string().max(MAX_OUTPUT_LENGTH).optional(),
  result: z.string().max(MAX_OUTPUT_LENGTH).optional(),
}).refine(
  (data) => data.researchOutput || data.output || data.result,
  { message: "At least one of researchOutput, output, or result is required" }
);

// Script complete callback
export const scriptCompleteSchema = baseCallbackSchema.extend({
  type: z.literal("script_complete"),
  script: z.string().max(MAX_OUTPUT_LENGTH).optional(),
  output: z.string().max(MAX_OUTPUT_LENGTH).optional(),
  result: z.string().max(MAX_OUTPUT_LENGTH).optional(),
}).refine(
  (data) => data.script || data.output || data.result,
  { message: "At least one of script, output, or result is required" }
);

// Script optimized callback
export const scriptOptimizedSchema = baseCallbackSchema.extend({
  type: z.literal("script_optimized"),
  script: z.string().max(MAX_OUTPUT_LENGTH).optional(),
  output: z.string().max(MAX_OUTPUT_LENGTH).optional(),
  result: z.string().max(MAX_OUTPUT_LENGTH).optional(),
}).refine(
  (data) => data.script || data.output || data.result,
  { message: "At least one of script, output, or result is required" }
);

// Video complete callback
export const videoCompleteSchema = baseCallbackSchema.extend({
  type: z.literal("video_complete"),
  videoUrl: z.string().url().max(MAX_URL_LENGTH).optional(),
  rawVideoUrl: z.string().url().max(MAX_URL_LENGTH).optional(),
  url: z.string().url().max(MAX_URL_LENGTH).optional(),
}).refine(
  (data) => data.videoUrl || data.rawVideoUrl || data.url,
  { message: "At least one of videoUrl, rawVideoUrl, or url is required" }
);

// Error callback
export const errorCallbackSchema = baseCallbackSchema.extend({
  type: z.literal("error"),
  error: z.string().max(MAX_ERROR_LENGTH).optional(),
  message: z.string().max(MAX_MESSAGE_LENGTH).optional(),
  source: z.string().max(100).optional(),
});

// Union of all valid callback types
export const webhookCallbackSchema = z.discriminatedUnion("type", [
  researchCompleteSchema,
  scriptCompleteSchema,
  scriptOptimizedSchema,
  videoCompleteSchema,
  errorCallbackSchema,
]);

// Type exports
export type WebhookCallback = z.infer<typeof webhookCallbackSchema>;
export type ResearchCompleteCallback = z.infer<typeof researchCompleteSchema>;
export type ScriptCompleteCallback = z.infer<typeof scriptCompleteSchema>;
export type ScriptOptimizedCallback = z.infer<typeof scriptOptimizedSchema>;
export type VideoCompleteCallback = z.infer<typeof videoCompleteSchema>;
export type ErrorCallback = z.infer<typeof errorCallbackSchema>;

/**
 * Validates a webhook callback payload and returns typed data
 */
export function validateWebhookPayload(payload: unknown): {
  success: true;
  data: WebhookCallback;
} | {
  success: false;
  error: string;
} {
  const result = webhookCallbackSchema.safeParse(payload);

  if (!result.success) {
    // Format Zod issues into a readable message
    const issues = result.error.issues.map(e => `${e.path.join(".")}: ${e.message}`);
    return {
      success: false,
      error: `Invalid payload: ${issues.join("; ")}`,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
