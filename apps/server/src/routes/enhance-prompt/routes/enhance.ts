/**
 * POST /enhance-prompt endpoint - Enhance user input text
 *
 * Uses Claude AI to enhance text based on the specified enhancement mode.
 * Supports modes: improve, technical, simplify, acceptance
 */

import type { Request, Response } from 'express';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createLogger } from '@automaker/utils';
import { resolveModelString } from '@automaker/model-resolver';
import { CLAUDE_MODEL_MAP } from '@automaker/types';
import type { SettingsService } from '../../../services/settings-service.js';
import { getPromptCustomization } from '../../../lib/settings-helpers.js';
import {
  buildUserPrompt,
  isValidEnhancementMode,
  type EnhancementMode,
} from '../../../lib/enhancement-prompts.js';

const logger = createLogger('EnhancePrompt');

/**
 * Request body for the enhance endpoint
 */
interface EnhanceRequestBody {
  /** The original text to enhance */
  originalText: string;
  /** The enhancement mode to apply */
  enhancementMode: string;
  /** Optional model override */
  model?: string;
}

/**
 * Success response from the enhance endpoint
 */
interface EnhanceSuccessResponse {
  success: true;
  enhancedText: string;
}

/**
 * Error response from the enhance endpoint
 */
interface EnhanceErrorResponse {
  success: false;
  error: string;
}

/**
 * Extract text content from Claude SDK response messages
 *
 * @param stream - The async iterable from the query function
 * @returns The extracted text content
 */
async function extractTextFromStream(
  stream: AsyncIterable<{
    type: string;
    subtype?: string;
    result?: string;
    message?: {
      content?: Array<{ type: string; text?: string }>;
    };
  }>
): Promise<string> {
  let responseText = '';

  for await (const msg of stream) {
    if (msg.type === 'assistant' && msg.message?.content) {
      for (const block of msg.message.content) {
        if (block.type === 'text' && block.text) {
          responseText += block.text;
        }
      }
    } else if (msg.type === 'result' && msg.subtype === 'success') {
      responseText = msg.result || responseText;
    }
  }

  return responseText;
}

/**
 * Create the enhance request handler
 *
 * @param settingsService - Optional settings service for loading custom prompts
 * @returns Express request handler for text enhancement
 */
export function createEnhanceHandler(
  settingsService?: SettingsService
): (req: Request, res: Response) => Promise<void> {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const { originalText, enhancementMode, model } = req.body as EnhanceRequestBody;

      // Validate required fields
      if (!originalText || typeof originalText !== 'string') {
        const response: EnhanceErrorResponse = {
          success: false,
          error: 'originalText is required and must be a string',
        };
        res.status(400).json(response);
        return;
      }

      if (!enhancementMode || typeof enhancementMode !== 'string') {
        const response: EnhanceErrorResponse = {
          success: false,
          error: 'enhancementMode is required and must be a string',
        };
        res.status(400).json(response);
        return;
      }

      // Validate text is not empty
      const trimmedText = originalText.trim();
      if (trimmedText.length === 0) {
        const response: EnhanceErrorResponse = {
          success: false,
          error: 'originalText cannot be empty',
        };
        res.status(400).json(response);
        return;
      }

      // Validate and normalize enhancement mode
      const normalizedMode = enhancementMode.toLowerCase();
      const validMode: EnhancementMode = isValidEnhancementMode(normalizedMode)
        ? normalizedMode
        : 'improve';

      logger.info(`Enhancing text with mode: ${validMode}, length: ${trimmedText.length} chars`);

      // Load enhancement prompts from settings (merges custom + defaults)
      const prompts = await getPromptCustomization(settingsService, '[EnhancePrompt]');

      // Get the system prompt for this mode from merged prompts
      const systemPromptMap: Record<EnhancementMode, string> = {
        improve: prompts.enhancement.improveSystemPrompt,
        technical: prompts.enhancement.technicalSystemPrompt,
        simplify: prompts.enhancement.simplifySystemPrompt,
        acceptance: prompts.enhancement.acceptanceSystemPrompt,
      };
      const systemPrompt = systemPromptMap[validMode];

      logger.debug(`Using ${validMode} system prompt (length: ${systemPrompt.length} chars)`);

      // Build the user prompt with few-shot examples
      // This helps the model understand this is text transformation, not a coding task
      const userPrompt = buildUserPrompt(validMode, trimmedText, true);

      // Resolve the model - use the passed model, default to sonnet for quality
      const resolvedModel = resolveModelString(model, CLAUDE_MODEL_MAP.sonnet);

      logger.debug(`Using model: ${resolvedModel}`);

      // Mock mode for CI testing - return deterministic response without calling Claude
      if (process.env.AUTOMAKER_MOCK_AGENT === 'true') {
        logger.info('Mock mode enabled - returning deterministic enhancement');

        const mockResponses: Record<EnhancementMode, string> = {
          improve: `[ENHANCED - Improved Clarity]\n\n${trimmedText}\n\n**Key improvements:**\n- Clearer structure\n- More specific language\n- Better actionability`,
          technical: `[ENHANCED - Technical Details]\n\n${trimmedText}\n\n**Technical considerations:**\n- Implementation approach defined\n- Edge cases identified\n- Performance considerations noted`,
          simplify: `[ENHANCED - Simplified]\n\n${trimmedText}\n\n**Simplified version:**\n- Core requirement distilled\n- Unnecessary complexity removed`,
          acceptance: `[ENHANCED - Acceptance Criteria]\n\n${trimmedText}\n\n**Acceptance Criteria:**\n- [ ] Feature works as described\n- [ ] Edge cases handled\n- [ ] Tests pass`,
        };

        const response: EnhanceSuccessResponse = {
          success: true,
          enhancedText: mockResponses[validMode],
        };
        res.json(response);
        return;
      }

      // Call Claude SDK with minimal configuration for text transformation
      // Key: no tools, just text completion
      const stream = query({
        prompt: userPrompt,
        options: {
          model: resolvedModel,
          systemPrompt,
          maxTurns: 1,
          allowedTools: [],
          permissionMode: 'acceptEdits',
        },
      });

      // Extract the enhanced text from the response
      const enhancedText = await extractTextFromStream(stream);

      if (!enhancedText || enhancedText.trim().length === 0) {
        logger.warn('Received empty response from Claude');
        const response: EnhanceErrorResponse = {
          success: false,
          error: 'Failed to generate enhanced text - empty response',
        };
        res.status(500).json(response);
        return;
      }

      logger.info(`Enhancement complete, output length: ${enhancedText.length} chars`);

      const response: EnhanceSuccessResponse = {
        success: true,
        enhancedText: enhancedText.trim(),
      };
      res.json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Enhancement failed:', errorMessage);

      // Detect common error patterns and provide actionable guidance
      let userFriendlyError = errorMessage;
      const lowerError = errorMessage.toLowerCase();

      if (
        lowerError.includes('api key') ||
        lowerError.includes('authentication') ||
        lowerError.includes('unauthorized') ||
        lowerError.includes('401')
      ) {
        userFriendlyError =
          'Claude not configured. Add an API key in Settings → API Keys, or ensure ANTHROPIC_API_KEY is set.';
      } else if (
        lowerError.includes('credit') ||
        lowerError.includes('billing') ||
        lowerError.includes('payment') ||
        lowerError.includes('402')
      ) {
        userFriendlyError =
          'Insufficient credits or billing issue. Please check your Anthropic account billing status.';
      } else if (
        lowerError.includes('rate limit') ||
        lowerError.includes('too many requests') ||
        lowerError.includes('429')
      ) {
        userFriendlyError = 'Rate limit reached. Please wait a moment and try again.';
      } else if (
        lowerError.includes('overloaded') ||
        lowerError.includes('503') ||
        lowerError.includes('service unavailable')
      ) {
        userFriendlyError = 'Claude is temporarily overloaded. Please try again in a few moments.';
      }

      const response: EnhanceErrorResponse = {
        success: false,
        error: userFriendlyError,
      };
      res.status(500).json(response);
    }
  };
}
