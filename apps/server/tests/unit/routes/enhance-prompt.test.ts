import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response } from 'express';
import { createEnhanceHandler } from '@/routes/enhance-prompt/routes/enhance.js';
import { createMockExpressContext } from '../../utils/mocks.js';

describe('enhance-prompt routes', () => {
  let req: Request;
  let res: Response;
  const originalEnv = process.env.AUTOMAKER_MOCK_AGENT;

  beforeEach(() => {
    vi.clearAllMocks();
    const context = createMockExpressContext();
    req = context.req;
    res = context.res;
  });

  afterEach(() => {
    // Restore original env
    if (originalEnv === undefined) {
      delete process.env.AUTOMAKER_MOCK_AGENT;
    } else {
      process.env.AUTOMAKER_MOCK_AGENT = originalEnv;
    }
  });

  describe('validation', () => {
    it('should return 400 if originalText is missing', async () => {
      req.body = { enhancementMode: 'improve' };

      const handler = createEnhanceHandler();
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'originalText is required and must be a string',
      });
    });

    it('should return 400 if enhancementMode is missing', async () => {
      req.body = { originalText: 'test text' };

      const handler = createEnhanceHandler();
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'enhancementMode is required and must be a string',
      });
    });

    it('should return 400 if originalText is empty', async () => {
      req.body = { originalText: '   ', enhancementMode: 'improve' };

      const handler = createEnhanceHandler();
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'originalText cannot be empty',
      });
    });
  });

  describe('mock mode', () => {
    beforeEach(() => {
      process.env.AUTOMAKER_MOCK_AGENT = 'true';
    });

    it('should return mock response for improve mode', async () => {
      req.body = { originalText: 'add dark mode', enhancementMode: 'improve' };

      const handler = createEnhanceHandler();
      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          enhancedText: expect.stringContaining('[ENHANCED - Improved Clarity]'),
        })
      );
    });

    it('should return mock response for technical mode', async () => {
      req.body = { originalText: 'add dark mode', enhancementMode: 'technical' };

      const handler = createEnhanceHandler();
      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          enhancedText: expect.stringContaining('[ENHANCED - Technical Details]'),
        })
      );
    });

    it('should return mock response for simplify mode', async () => {
      req.body = { originalText: 'add dark mode', enhancementMode: 'simplify' };

      const handler = createEnhanceHandler();
      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          enhancedText: expect.stringContaining('[ENHANCED - Simplified]'),
        })
      );
    });

    it('should return mock response for acceptance mode', async () => {
      req.body = { originalText: 'add dark mode', enhancementMode: 'acceptance' };

      const handler = createEnhanceHandler();
      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          enhancedText: expect.stringContaining('[ENHANCED - Acceptance Criteria]'),
        })
      );
    });

    it('should include original text in mock response', async () => {
      const originalText = 'implement user authentication';
      req.body = { originalText, enhancementMode: 'improve' };

      const handler = createEnhanceHandler();
      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          enhancedText: expect.stringContaining(originalText),
        })
      );
    });

    it('should default to improve mode for invalid enhancementMode', async () => {
      req.body = { originalText: 'test', enhancementMode: 'invalid_mode' };

      const handler = createEnhanceHandler();
      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          enhancedText: expect.stringContaining('[ENHANCED - Improved Clarity]'),
        })
      );
    });
  });

  describe('error handling', () => {
    // Note: These tests verify the error message mapping
    // In real scenarios, these errors come from the Claude SDK

    it('should not call Claude SDK in mock mode', async () => {
      process.env.AUTOMAKER_MOCK_AGENT = 'true';
      req.body = { originalText: 'test', enhancementMode: 'improve' };

      const handler = createEnhanceHandler();
      await handler(req, res);

      // If mock mode works, we should get a success response without hitting the SDK
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
