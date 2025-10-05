/**
 * Backend Verification Utilities for Google reCAPTCHA
 * 
 * This file provides ready-to-use functions for verifying reCAPTCHA tokens
 * on your backend server with proper security validation.
 * 
 * Security Features:
 * - Token verification with Google API
 * - Score validation for v3
 * - Action name validation
 * - Hostname verification
 * - Single-use token enforcement
 * - Comprehensive error handling
 * 
 * @package google-recaptcha-v3
 * @author thind9xdev
 */

/**
 * Configuration interface for reCAPTCHA verification
 */
export interface RecaptchaConfig {
  secretKey: string;
  minScore?: number; // Minimum score for v3 (0.0 - 1.0), default: 0.5
  expectedAction?: string; // Expected action name for v3
  allowedHostnames?: string[]; // Allowed hostnames
  remoteIp?: string; // Client IP address (optional)
}

/**
 * Result of reCAPTCHA verification
 */
export interface RecaptchaVerificationResult {
  success: boolean;
  score?: number; // Only present for v3
  action?: string; // Only present for v3
  challenge_ts?: string; // Timestamp of the challenge
  hostname?: string; // Hostname where challenge was solved
  'error-codes'?: string[]; // Error codes if verification failed
}

/**
 * Validation result with detailed information
 */
export interface ValidationResult {
  valid: boolean;
  score?: number;
  reason?: string;
  details?: any;
}

/**
 * Verify reCAPTCHA token with Google's siteverify API
 * 
 * @param token - The reCAPTCHA token from the client
 * @param secretKey - Your reCAPTCHA secret key
 * @param remoteIp - Optional client IP address
 * @returns Promise<RecaptchaVerificationResult>
 * 
 * @example
 * ```typescript
 * const result = await verifyRecaptchaToken(
 *   token, 
 *   process.env.RECAPTCHA_SECRET_KEY,
 *   req.ip
 * );
 * if (result.success) {
 *   console.log('Token verified successfully');
 * }
 * ```
 */
export async function verifyRecaptchaToken(
  token: string,
  secretKey: string,
  remoteIp?: string
): Promise<RecaptchaVerificationResult> {
  const url = new URL('https://www.google.com/recaptcha/api/siteverify');
  
  const params = new URLSearchParams({
    secret: secretKey,
    response: token,
  });

  if (remoteIp) {
    params.append('remoteip', remoteIp);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    throw error;
  }
}

/**
 * Validate reCAPTCHA token with comprehensive security checks
 * 
 * This function performs multiple validation steps:
 * 1. Verifies token with Google API
 * 2. Validates score threshold (v3)
 * 3. Checks action name (v3)
 * 4. Verifies hostname
 * 5. Checks token age
 * 
 * @param token - The reCAPTCHA token from the client
 * @param config - Configuration object with validation parameters
 * @returns Promise<ValidationResult>
 * 
 * @example
 * ```typescript
 * const result = await validateRecaptchaToken(token, {
 *   secretKey: process.env.RECAPTCHA_SECRET_KEY,
 *   minScore: 0.5,
 *   expectedAction: 'submit_form',
 *   allowedHostnames: ['yourdomain.com'],
 *   remoteIp: req.ip
 * });
 * 
 * if (!result.valid) {
 *   return res.status(403).json({ 
 *     error: 'Verification failed', 
 *     reason: result.reason 
 *   });
 * }
 * ```
 */
export async function validateRecaptchaToken(
  token: string,
  config: RecaptchaConfig
): Promise<ValidationResult> {
  const {
    secretKey,
    minScore = 0.5,
    expectedAction,
    allowedHostnames = [],
    remoteIp
  } = config;

  // Basic input validation
  if (!token || typeof token !== 'string') {
    return {
      valid: false,
      reason: 'INVALID_TOKEN_FORMAT',
      details: 'Token must be a non-empty string'
    };
  }

  if (!secretKey) {
    return {
      valid: false,
      reason: 'MISSING_SECRET_KEY',
      details: 'Secret key is required for verification'
    };
  }

  try {
    // Step 1: Verify token with Google API
    const verificationResult = await verifyRecaptchaToken(
      token,
      secretKey,
      remoteIp
    );

    // Step 2: Check if verification was successful
    if (!verificationResult.success) {
      return {
        valid: false,
        reason: 'VERIFICATION_FAILED',
        details: {
          errorCodes: verificationResult['error-codes'],
          message: 'Google reCAPTCHA verification failed'
        }
      };
    }

    // Step 3: Validate score for v3 (if score is present)
    if (verificationResult.score !== undefined) {
      if (verificationResult.score < minScore) {
        return {
          valid: false,
          score: verificationResult.score,
          reason: 'SCORE_TOO_LOW',
          details: {
            score: verificationResult.score,
            minScore: minScore,
            message: `Score ${verificationResult.score} is below minimum threshold ${minScore}`
          }
        };
      }
    }

    // Step 4: Validate action name for v3 (if provided)
    if (expectedAction && verificationResult.action) {
      if (verificationResult.action !== expectedAction) {
        return {
          valid: false,
          reason: 'ACTION_MISMATCH',
          details: {
            expected: expectedAction,
            received: verificationResult.action,
            message: 'Action name does not match expected value'
          }
        };
      }
    }

    // Step 5: Validate hostname (if provided)
    if (allowedHostnames.length > 0 && verificationResult.hostname) {
      if (!allowedHostnames.includes(verificationResult.hostname)) {
        return {
          valid: false,
          reason: 'HOSTNAME_NOT_ALLOWED',
          details: {
            hostname: verificationResult.hostname,
            allowedHostnames: allowedHostnames,
            message: 'Request hostname is not in the allowed list'
          }
        };
      }
    }

    // Step 6: Check token age (tokens should be used within 2 minutes)
    if (verificationResult.challenge_ts) {
      const challengeTime = new Date(verificationResult.challenge_ts).getTime();
      const currentTime = Date.now();
      const tokenAge = currentTime - challengeTime;
      const maxAge = 2 * 60 * 1000; // 2 minutes in milliseconds

      if (tokenAge > maxAge) {
        return {
          valid: false,
          reason: 'TOKEN_EXPIRED',
          details: {
            tokenAge: Math.floor(tokenAge / 1000),
            maxAge: Math.floor(maxAge / 1000),
            message: 'Token has expired and should not be used'
          }
        };
      }
    }

    // All validations passed
    return {
      valid: true,
      score: verificationResult.score,
      details: {
        action: verificationResult.action,
        hostname: verificationResult.hostname,
        challenge_ts: verificationResult.challenge_ts
      }
    };

  } catch (error) {
    console.error('Validation error:', error);
    return {
      valid: false,
      reason: 'VALIDATION_ERROR',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'An error occurred during validation'
      }
    };
  }
}

/**
 * Express.js middleware for reCAPTCHA verification
 * 
 * @param config - Configuration object
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * import express from 'express';
 * import { recaptchaMiddleware } from './backend-utils';
 * 
 * const app = express();
 * app.use(express.json());
 * 
 * app.post('/api/submit', recaptchaMiddleware({
 *   secretKey: process.env.RECAPTCHA_SECRET_KEY,
 *   minScore: 0.5,
 *   expectedAction: 'submit_form',
 *   allowedHostnames: ['yourdomain.com']
 * }), (req, res) => {
 *   // Request is validated, process normally
 *   res.json({ success: true });
 * });
 * ```
 */
export function recaptchaMiddleware(config: RecaptchaConfig) {
  return async (req: any, res: any, next: any) => {
    const token = req.body.recaptchaToken || req.body.token;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_TOKEN',
        message: 'reCAPTCHA token is required'
      });
    }

    const validation = await validateRecaptchaToken(token, {
      ...config,
      remoteIp: req.ip || req.connection?.remoteAddress
    });

    if (!validation.valid) {
      return res.status(403).json({
        success: false,
        error: validation.reason,
        message: 'reCAPTCHA verification failed',
        details: validation.details
      });
    }

    // Attach validation result to request for further use
    req.recaptchaValidation = validation;

    next();
  };
}

/**
 * NestJS guard for reCAPTCHA verification
 * 
 * @example
 * ```typescript
 * import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
 * import { validateRecaptchaToken } from './backend-utils';
 * 
 * @Injectable()
 * export class RecaptchaGuard implements CanActivate {
 *   async canActivate(context: ExecutionContext): Promise<boolean> {
 *     const request = context.switchToHttp().getRequest();
 *     const token = request.body.recaptchaToken;
 *     
 *     const result = await validateRecaptchaToken(token, {
 *       secretKey: process.env.RECAPTCHA_SECRET_KEY,
 *       minScore: 0.5,
 *       expectedAction: 'submit_form',
 *       allowedHostnames: ['yourdomain.com'],
 *       remoteIp: request.ip
 *     });
 *     
 *     return result.valid;
 *   }
 * }
 * ```
 */

/**
 * Simple in-memory cache for single-use token enforcement
 * For production, use Redis or similar
 */
export class TokenCache {
  private cache: Map<string, number>;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cache = new Map();
    
    // Clean up expired tokens every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Check if token was already used
   */
  isUsed(token: string): boolean {
    return this.cache.has(token);
  }

  /**
   * Mark token as used
   */
  markAsUsed(token: string, expiryMs: number = 300000): void {
    const expiry = Date.now() + expiryMs;
    this.cache.set(token, expiry);
  }

  /**
   * Remove expired tokens
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [token, expiry] of this.cache.entries()) {
      if (expiry < now) {
        this.cache.delete(token);
      }
    }
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

/**
 * Enhanced validation with single-use token enforcement
 * 
 * @param token - The reCAPTCHA token
 * @param config - Configuration object
 * @param tokenCache - TokenCache instance for tracking used tokens
 * @returns Promise<ValidationResult>
 * 
 * @example
 * ```typescript
 * const tokenCache = new TokenCache();
 * 
 * const result = await validateRecaptchaTokenWithCache(
 *   token,
 *   { secretKey: process.env.RECAPTCHA_SECRET_KEY },
 *   tokenCache
 * );
 * ```
 */
export async function validateRecaptchaTokenWithCache(
  token: string,
  config: RecaptchaConfig,
  tokenCache: TokenCache
): Promise<ValidationResult> {
  // Check if token was already used
  if (tokenCache.isUsed(token)) {
    return {
      valid: false,
      reason: 'TOKEN_ALREADY_USED',
      details: {
        message: 'This token has already been used and cannot be reused'
      }
    };
  }

  // Validate token
  const result = await validateRecaptchaToken(token, config);

  // If valid, mark as used
  if (result.valid) {
    tokenCache.markAsUsed(token);
  }

  return result;
}

/**
 * Helper function to log reCAPTCHA verification attempts
 * 
 * @param result - Validation result
 * @param metadata - Additional metadata to log
 */
export function logRecaptchaAttempt(
  result: ValidationResult,
  metadata?: Record<string, any>
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    valid: result.valid,
    score: result.score,
    reason: result.reason,
    ...metadata
  };

  // Log based on result
  if (result.valid) {
    console.log('[reCAPTCHA] Verification successful:', logData);
  } else {
    console.warn('[reCAPTCHA] Verification failed:', logData);
    
    // Alert on very low scores
    if (result.score !== undefined && result.score < 0.3) {
      console.error('[reCAPTCHA] ALERT: Very low score detected:', logData);
    }
  }
}

/**
 * Example: Complete implementation with all security features
 */
export async function secureEndpointExample(
  token: string,
  remoteIp: string,
  tokenCache: TokenCache
): Promise<{ success: boolean; message: string; details?: any }> {
  // Validate with cache
  const result = await validateRecaptchaTokenWithCache(
    token,
    {
      secretKey: process.env.RECAPTCHA_SECRET_KEY || '',
      minScore: 0.5,
      expectedAction: 'submit_form',
      allowedHostnames: ['yourdomain.com', 'www.yourdomain.com'],
      remoteIp
    },
    tokenCache
  );

  // Log attempt
  logRecaptchaAttempt(result, { ip: remoteIp });

  if (!result.valid) {
    return {
      success: false,
      message: 'Security verification failed',
      details: {
        reason: result.reason,
        details: result.details
      }
    };
  }

  return {
    success: true,
    message: 'Verification successful',
    details: {
      score: result.score
    }
  };
}
