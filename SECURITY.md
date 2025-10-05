# Security Guide for React Google reCAPTCHA

## Overview

This document provides comprehensive security guidelines for implementing Google reCAPTCHA to protect against automated captcha-solving services and bot attacks.

## Table of Contents

1. [Threat Model](#threat-model)
2. [Security Architecture](#security-architecture)
3. [Implementation Guidelines](#implementation-guidelines)
4. [Backend Verification](#backend-verification)
5. [Protection Against Automated Solvers](#protection-against-automated-solvers)
6. [Monitoring and Detection](#monitoring-and-detection)
7. [Best Practices](#best-practices)

## Threat Model

### Common Attack Vectors:

1. **Automated Solving Services**
   - Services like 2captcha, Anti-Captcha
   - Cost: $0.50-$3 per 1000 solves
   - Time: 10-30 seconds per solve
   - Success rate: High for v2, Lower for v3 with proper validation

2. **Direct API Manipulation**
   - Bypassing frontend validation
   - Token replay attacks
   - Token generation without user interaction

3. **Brute Force Attacks**
   - Repeated submission attempts
   - Distributed attacks from multiple IPs
   - Low-and-slow attacks to avoid detection

## Security Architecture

### Defense in Depth Strategy:

```
┌──────────────────────────────────────────────────────────┐
│                    Client Side (React)                    │
│  • Generate unique tokens                                 │
│  • Use meaningful action names                            │
│  • Implement proper error handling                        │
└───────────────────────┬──────────────────────────────────┘
                        │ HTTPS Only
                        ▼
┌──────────────────────────────────────────────────────────┐
│                   Network Layer                           │
│  • TLS 1.2+ encryption                                    │
│  • Certificate validation                                 │
│  • No token exposure in URLs                              │
└───────────────────────┬──────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│                   Server Side (Backend)                   │
│  • Token verification with Google API                     │
│  • Score validation (v3)                                  │
│  • Action name validation                                 │
│  • Hostname verification                                  │
│  • Single-use token enforcement                           │
│  • Rate limiting                                          │
│  • IP monitoring                                          │
│  • Audit logging                                          │
└──────────────────────────────────────────────────────────┘
```

## Implementation Guidelines

### Frontend Security (React)

#### ✅ Correct Implementation:

```tsx
import React, { useRef } from "react";
import { GoogleRecaptcha, GoogleRecaptchaRef } from "google-recaptcha-v3";

const SecureComponent = () => {
  const recaptchaRef = useRef<GoogleRecaptchaRef>(null);

  const handleSubmit = async () => {
    try {
      // Generate token immediately before submission
      const token = await recaptchaRef.current?.executeAsync();
      
      // Send to backend immediately
      await fetch('/api/endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recaptchaToken: token,
          data: formData
        })
      });
    } catch (error) {
      console.error('Security validation failed:', error);
    }
  };

  return (
    <GoogleRecaptcha
      ref={recaptchaRef}
      sitekey="YOUR_SITE_KEY"
      version="v3"
      action="submit_form" // Use meaningful action names
    />
  );
};
```

#### ❌ Insecure Implementation:

```tsx
// DON'T DO THIS!
const [token, setToken] = useState(null);

// DON'T: Generate token on component mount
useEffect(() => {
  recaptchaRef.current?.execute().then(setToken);
}, []);

// DON'T: Reuse old tokens
const handleSubmit = () => {
  api.post('/endpoint', { token }); // Token might be expired!
};

// DON'T: Skip backend verification
const handleSubmit = () => {
  if (token) {
    // Trusting client-side token is INSECURE
    processForm();
  }
};
```

## Backend Verification

### Essential Verification Steps:

```typescript
interface RecaptchaVerificationResult {
  success: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  challenge_ts?: string;
  error_codes?: string[];
}

async function verifyRecaptchaToken(
  token: string,
  remoteIp: string
): Promise<RecaptchaVerificationResult> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  const response = await fetch(
    'https://www.google.com/recaptcha/api/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: remoteIp
      })
    }
  );

  return await response.json();
}
```

### Comprehensive Validation:

```typescript
interface ValidationConfig {
  minScore: number;
  expectedAction: string;
  allowedHostnames: string[];
  tokenCacheKey?: string;
}

async function validateRecaptcha(
  token: string,
  remoteIp: string,
  config: ValidationConfig
): Promise<{ valid: boolean; reason?: string; score?: number }> {
  
  // 1. Check if token was already used
  if (config.tokenCacheKey) {
    const used = await redis.get(`recaptcha:used:${token}`);
    if (used) {
      return { valid: false, reason: 'TOKEN_REUSED' };
    }
  }

  // 2. Verify with Google
  const result = await verifyRecaptchaToken(token, remoteIp);

  // 3. Check success
  if (!result.success) {
    return { 
      valid: false, 
      reason: 'VERIFICATION_FAILED',
      details: result.error_codes 
    };
  }

  // 4. Validate score (v3)
  if (result.score !== undefined) {
    if (result.score < config.minScore) {
      await logSuspiciousActivity(remoteIp, result.score);
      return { 
        valid: false, 
        reason: 'LOW_SCORE', 
        score: result.score 
      };
    }
  }

  // 5. Validate action name
  if (result.action && result.action !== config.expectedAction) {
    return { 
      valid: false, 
      reason: 'ACTION_MISMATCH',
      expected: config.expectedAction,
      received: result.action
    };
  }

  // 6. Validate hostname
  if (result.hostname && !config.allowedHostnames.includes(result.hostname)) {
    return { 
      valid: false, 
      reason: 'HOSTNAME_MISMATCH',
      received: result.hostname
    };
  }

  // 7. Check token age
  if (result.challenge_ts) {
    const tokenAge = Date.now() - new Date(result.challenge_ts).getTime();
    if (tokenAge > 120000) { // 2 minutes
      return { valid: false, reason: 'TOKEN_EXPIRED' };
    }
  }

  // 8. Mark token as used
  if (config.tokenCacheKey) {
    await redis.setex(`recaptcha:used:${token}`, 300, '1');
  }

  return { valid: true, score: result.score };
}
```

## Protection Against Automated Solvers

### Understanding the Threat:

Automated solving services work by:
1. Intercepting reCAPTCHA challenges
2. Sending them to human workers or AI
3. Returning the solution to the automation

### Defense Strategies:

#### 1. Use reCAPTCHA v3 (Recommended)

```tsx
<GoogleRecaptcha
  version="v3"
  sitekey="YOUR_V3_SITEKEY"
  action="critical_action"
/>
```

**Benefits:**
- No user interaction needed
- Returns risk score (0.0-1.0)
- Analyzes behavior patterns
- Harder to game than v2

**Backend validation:**
```typescript
if (score < 0.5) {
  // Likely a bot - reject or require additional verification
  return response.status(403).json({ error: 'Security check failed' });
}
```

#### 2. Dynamic Action Names

```tsx
// Generate unique action names per form/context
const action = `submit_${formType}_${Date.now()}`;

<GoogleRecaptcha
  action={action}
  version="v3"
  sitekey="YOUR_SITEKEY"
/>
```

#### 3. Multiple Verification Layers

```typescript
async function multiLayerValidation(req, res) {
  // Layer 1: reCAPTCHA
  const recaptchaValid = await validateRecaptcha(req.body.token);
  if (!recaptchaValid) {
    return res.status(403).json({ error: 'reCAPTCHA failed' });
  }

  // Layer 2: Rate limiting (IP-based)
  const rateLimitOk = await checkRateLimit(req.ip);
  if (!rateLimitOk) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // Layer 3: Behavioral analysis
  const behaviorScore = await analyzeBehavior(req);
  if (behaviorScore < threshold) {
    return res.status(403).json({ error: 'Suspicious behavior' });
  }

  // Proceed with request
  processRequest(req, res);
}
```

#### 4. Cost-Based Defense

Making attacks economically unfeasible:

```typescript
const SOLVER_COST_PER_1000 = 2.99; // USD
const YOUR_TRANSACTION_VALUE = 0.10; // USD

// If transaction value < solving cost, attacks become unprofitable
if (YOUR_TRANSACTION_VALUE < (SOLVER_COST_PER_1000 / 1000)) {
  // Attacks are economically unfeasible
}

// Additional measures:
// - Implement rate limiting: Max 5 attempts per hour per IP
// - Require email verification for high-value actions
// - Add manual review for suspicious patterns
```

## Monitoring and Detection

### Key Metrics to Track:

```typescript
interface RecaptchaMetrics {
  timestamp: Date;
  ip: string;
  score: number;
  action: string;
  success: boolean;
  responseTime: number;
}

// Log all verifications
async function logVerification(metrics: RecaptchaMetrics) {
  await db.insert('recaptcha_logs', metrics);
  
  // Real-time alerting
  if (metrics.score < 0.3) {
    await sendAlert('Low reCAPTCHA score detected', metrics);
  }
}

// Aggregate analytics
async function getSecurityMetrics(timeRange: string) {
  return {
    averageScore: await db.avg('recaptcha_logs.score'),
    lowScoreCount: await db.count('recaptcha_logs', 'score < 0.3'),
    topSuspiciousIPs: await db.query(`
      SELECT ip, COUNT(*) as attempts, AVG(score) as avg_score
      FROM recaptcha_logs
      WHERE score < 0.5
      GROUP BY ip
      ORDER BY attempts DESC
      LIMIT 10
    `),
    failureRate: await db.query(`
      SELECT COUNT(CASE WHEN success = false THEN 1 END) * 100.0 / COUNT(*) 
      FROM recaptcha_logs
    `)
  };
}
```

### Anomaly Detection:

```typescript
async function detectAnomalies(ip: string): Promise<boolean> {
  const recentAttempts = await db.query(`
    SELECT * FROM recaptcha_logs
    WHERE ip = ? AND timestamp > NOW() - INTERVAL 1 HOUR
    ORDER BY timestamp DESC
  `, [ip]);

  // Check for suspicious patterns
  const suspiciousPatterns = [
    // Too many attempts
    recentAttempts.length > 50,
    
    // Consistently low scores
    recentAttempts.filter(a => a.score < 0.3).length > 10,
    
    // Rapid succession (< 1 second between attempts)
    recentAttempts.some((attempt, i) => {
      if (i === 0) return false;
      const timeDiff = attempt.timestamp - recentAttempts[i-1].timestamp;
      return timeDiff < 1000;
    }),
    
    // Multiple different action names
    new Set(recentAttempts.map(a => a.action)).size > 10
  ];

  return suspiciousPatterns.some(pattern => pattern);
}
```

## Best Practices

### ✅ DO:

1. **Always verify tokens server-side**
   ```typescript
   app.post('/api/action', async (req, res) => {
     const { recaptchaToken } = req.body;
     const verification = await verifyRecaptcha(recaptchaToken);
     if (!verification.valid) {
       return res.status(403).json({ error: 'Verification failed' });
     }
     // Process request
   });
   ```

2. **Use environment variables for secrets**
   ```bash
   # .env
   RECAPTCHA_SECRET_KEY=6Lc...your-secret-key
   RECAPTCHA_SITE_KEY=6Lc...your-site-key
   ```

3. **Implement rate limiting**
   ```typescript
   import rateLimit from 'express-rate-limit';
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
     message: 'Too many requests from this IP'
   });
   
   app.use('/api/', limiter);
   ```

4. **Use HTTPS everywhere**
   ```typescript
   if (process.env.NODE_ENV === 'production') {
     app.use((req, res, next) => {
       if (req.header('x-forwarded-proto') !== 'https') {
         res.redirect(`https://${req.header('host')}${req.url}`);
       } else {
         next();
       }
     });
   }
   ```

5. **Monitor and log everything**
   ```typescript
   import winston from 'winston';
   
   const logger = winston.createLogger({
     level: 'info',
     format: winston.format.json(),
     transports: [
       new winston.transports.File({ filename: 'security.log' })
     ]
   });
   
   logger.info('reCAPTCHA verification', {
     ip: req.ip,
     score: result.score,
     action: result.action,
     success: result.valid
   });
   ```

### ❌ DON'T:

1. **Never skip backend verification**
2. **Don't store secret keys in frontend code**
3. **Don't accept any score without validation**
4. **Don't ignore action name validation**
5. **Don't reuse tokens**
6. **Don't use HTTP in production**
7. **Don't ignore low scores (< 0.5)**
8. **Don't forget to implement rate limiting**

## Configuration Examples

### Production Configuration:

```typescript
// config/recaptcha.config.ts
export const recaptchaConfig = {
  v3: {
    siteKey: process.env.RECAPTCHA_V3_SITE_KEY,
    secretKey: process.env.RECAPTCHA_V3_SECRET_KEY,
    minScore: 0.5,
    actions: {
      login: 'user_login',
      register: 'user_register',
      purchase: 'make_purchase',
      submit: 'form_submit'
    }
  },
  v2: {
    siteKey: process.env.RECAPTCHA_V2_SITE_KEY,
    secretKey: process.env.RECAPTCHA_V2_SECRET_KEY
  },
  security: {
    allowedHostnames: [
      'yourdomain.com',
      'www.yourdomain.com'
    ],
    tokenCacheTTL: 300, // 5 minutes
    maxAttemptsPerHour: 50,
    alertScoreThreshold: 0.3
  }
};
```

### Development Configuration:

```typescript
// For development, you may want to use test keys
// Google provides test keys that always return success
export const devRecaptchaConfig = {
  v3: {
    siteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', // Test key
    secretKey: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe', // Test key
    minScore: 0.0 // Accept all scores in development
  }
};
```

## Security Checklist

Before going to production, ensure you have:

- [ ] Implemented server-side token verification
- [ ] Set appropriate score threshold (≥ 0.5 recommended)
- [ ] Validated action names match expected values
- [ ] Verified hostname matches your domain
- [ ] Implemented single-use token validation
- [ ] Configured rate limiting
- [ ] Enabled HTTPS for all endpoints
- [ ] Stored secrets in environment variables
- [ ] Implemented logging and monitoring
- [ ] Set up alerting for suspicious activity
- [ ] Tested with various score scenarios
- [ ] Reviewed error handling
- [ ] Documented your security implementation
- [ ] Trained team on security best practices
- [ ] Set up automated security testing

## Support and Resources

- [Google reCAPTCHA Documentation](https://developers.google.com/recaptcha/docs/v3)
- [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
- [Security Best Practices](https://developers.google.com/recaptcha/docs/faq#security)

## License

This security guide is part of the google-recaptcha-v3 package.
Copyright 2024 mia nguyen x thind9xdev - Licensed under MIT License
