# React Google Recaptcha

A clean, modern React library for Google reCAPTCHA integration with both hooks and components supporting v2 and v3.

## 🔒 Security Enhanced

This library now includes comprehensive security features to protect against automated captcha-solving services. See [SECURITY.md](./SECURITY.md) for detailed security guidelines and [examples/](./examples/) for backend verification utilities.

**Quick Links:**
- 📖 [Complete Security Guide](./SECURITY.md) - Comprehensive security implementation guide
- 🛠️ [Backend Utilities](./examples/backend-utils.ts) - Ready-to-use verification functions
- 💡 [Backend Examples](./examples/README.md) - Integration examples for Express, NestJS, etc.

## Install:

```bash
npm i google-recaptcha-v3
```

## Import to React:

### Hook (v3 only):
```tsx
import { useGoogleRecaptcha } from "google-recaptcha-v3";
```

### Component (supports both v2 and v3):
```tsx
import { GoogleRecaptcha } from "google-recaptcha-v3";
```

## Hook Usage (v3 only)

### Basic Hook Usage

```tsx
import React from "react";
import { useGoogleRecaptcha } from "google-recaptcha-v3";

const YourComponent = () => {
  const siteKey = "YOUR_SITE_KEY";
  const action = "submit";
  const { token, error, isLoading } = useGoogleRecaptcha(siteKey, action);

  if (isLoading) {
    return <div>Loading reCAPTCHA...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // You can use token to send request to API
  return (
    <div>
      {token && <p>reCAPTCHA token generated successfully!</p>}
    </div>
  );
};

export default YourComponent;
```

## Component Usage

### reCAPTCHA v2 - Basic Usage

```tsx
import React, { useRef } from "react";
import { GoogleRecaptcha, GoogleRecaptchaRef } from "google-recaptcha-v3";

const YourComponent = () => {
  const recaptchaRef = useRef<GoogleRecaptchaRef>(null);
  const siteKey = "YOUR_SITE_KEY";

  const handleSubmit = async () => {
    if (recaptchaRef.current) {
      const token = await recaptchaRef.current.execute();
      if (token) {
        console.log("reCAPTCHA token:", token);
        // Send request to your API with the token
      }
    }
  };

  const handleChange = (token: string | null) => {
    console.log("reCAPTCHA token changed:", token);
  };

  return (
    <div>
      <GoogleRecaptcha
        ref={recaptchaRef}
        sitekey={siteKey}
        onChange={handleChange}
        onExpired={() => console.log("reCAPTCHA expired")}
        onErrored={(error) => console.error("reCAPTCHA error:", error)}
      />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};

export default YourComponent;
```

### reCAPTCHA v2 - Advanced Configuration

```tsx
import React, { useRef } from "react";
import { GoogleRecaptcha, GoogleRecaptchaRef } from "google-recaptcha-v3";

const YourComponent = () => {
  const recaptchaRef = useRef<GoogleRecaptchaRef>(null);
  const siteKey = "YOUR_SITE_KEY";

  const handleSubmit = async () => {
    const token = recaptchaRef.current?.getResponse();
    if (token) {
      // Send request to your API with the token
      console.log("Submitting with token:", token);
    } else {
      alert("Please complete the reCAPTCHA");
    }
  };

  const handleReset = () => {
    recaptchaRef.current?.reset();
  };

  return (
    <div>
      <GoogleRecaptcha
        ref={recaptchaRef}
        sitekey={siteKey}
        theme="dark"
        size="compact"
        hl="vi" // Vietnamese
        onChange={(token) => console.log("Token:", token)}
        onExpired={() => {
          console.log("reCAPTCHA expired");
          handleReset();
        }}
        onErrored={(error) => console.error("Error:", error)}
        style={{ margin: "20px 0" }}
      />
      <div>
        <button onClick={handleSubmit}>Submit</button>
        <button onClick={handleReset}>Reset</button>
      </div>
    </div>
  );
};

export default YourComponent;
```

### reCAPTCHA v3 - Component Usage

```tsx
import React, { useRef } from "react";
import { GoogleRecaptcha, GoogleRecaptchaRef } from "google-recaptcha-v3";

const YourComponent = () => {
  const recaptchaRef = useRef<GoogleRecaptchaRef>(null);
  const siteKey = "YOUR_SITE_KEY";

  const handleSubmit = async () => {
    try {
      const token = await recaptchaRef.current?.executeAsync();
      if (token) {
        console.log("v3 token:", token);
        // Send request to your API with the token
      }
    } catch (error) {
      console.error("Failed to get token:", error);
    }
  };

  return (
    <div>
      <GoogleRecaptcha
        ref={recaptchaRef}
        sitekey={siteKey}
        version="v3"
        action="submit"
        onLoad={() => console.log("reCAPTCHA v3 loaded")}
        onErrored={(error) => console.error("reCAPTCHA error:", error)}
      />
      <button onClick={handleSubmit}>Submit with v3</button>
    </div>
  );
};

export default YourComponent;
```

### Invisible reCAPTCHA

```tsx
import React, { useRef } from "react";
import { GoogleRecaptcha, GoogleRecaptchaRef } from "google-recaptcha-v3";

const YourComponent = () => {
  const recaptchaRef = useRef<GoogleRecaptchaRef>(null);
  const siteKey = "YOUR_SITE_KEY";

  const handleSubmit = async () => {
    try {
      // For invisible reCAPTCHA, execute when user submits
      const token = await recaptchaRef.current?.executeAsync();
      if (token) {
        console.log("Invisible reCAPTCHA token:", token);
        // Send request to your API with the token
      }
    } catch (error) {
      console.error("Failed to execute invisible reCAPTCHA:", error);
    }
  };

  return (
    <div>
      <GoogleRecaptcha
        ref={recaptchaRef}
        sitekey={siteKey}
        size="invisible"
        badge="bottomright"
        onLoad={() => console.log("Invisible reCAPTCHA loaded")}
        onErrored={(error) => console.error("Error:", error)}
      />
      <button onClick={handleSubmit}>Submit (Invisible reCAPTCHA)</button>
    </div>
  );
};

export default YourComponent;
```

### Advanced Hook Usage

```tsx
import React from "react";
import { useGoogleRecaptcha, ReCaptchaOptions } from "google-recaptcha-v3";

const YourComponent = () => {
  const siteKey = "YOUR_SITE_KEY";
  const action = "submit";
  const options: ReCaptchaOptions = { language: "vi" }; // Vietnamese language
  
  const { 
    token, 
    error, 
    isLoading, 
    refreshToken, 
    executeRecaptcha 
  } = useGoogleRecaptcha(siteKey, action, options);

  const handleSubmit = async () => {
    try {
      const newToken = await executeRecaptcha();
      if (newToken) {
        // Send request to your API with the token
        console.log("New token:", newToken);
      }
    } catch (err) {
      console.error("Failed to get reCAPTCHA token:", err);
    }
  };

  return (
    <div>
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? "Loading..." : "Submit"}
      </button>
      <button onClick={refreshToken} disabled={isLoading}>
        Refresh Token
      </button>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {token && <p style={{ color: "green" }}>Token ready!</p>}
    </div>
  );
};

export default YourComponent;
```

## API Reference

### Hook API

#### `useGoogleRecaptcha(siteKey, action, options?)`

##### Parameters:
- `siteKey` (string): Your Google reCAPTCHA v3 site key
- `action` (string): The action name for this reCAPTCHA execution
- `options` (ReCaptchaOptions, optional): Configuration options
  - `language` (string, optional): Language code (default: "en")

##### Returns:
- `token` (string | null): The reCAPTCHA token
- `error` (string | null): Error message if something went wrong
- `isLoading` (boolean): Loading state
- `refreshToken` (function): Function to refresh the token
- `executeRecaptcha` (function): Function to manually execute reCAPTCHA

### Component API

#### `<GoogleRecaptcha />` Props

##### Required Props:
- `sitekey` (string): Your Google reCAPTCHA site key

##### Optional Props:
- `version` ("v2" | "v3"): reCAPTCHA version (default: "v2")
- `theme` ("light" | "dark"): Visual theme (v2 only, default: "light")
- `size` ("compact" | "normal" | "invisible"): Widget size (default: "normal")
- `type` ("image" | "audio"): Challenge type (v2 only, default: "image")
- `action` (string): Action name for v3 (default: "submit")
- `hl` (string): Language code (default: "en")
- `badge` ("bottomright" | "bottomleft" | "inline"): Badge position for invisible (default: "bottomright")
- `tabindex` (number): Tab index for accessibility
- `isolated` (boolean): Isolated mode
- `className` (string): CSS class name
- `style` (React.CSSProperties): Inline styles

##### Callback Props:
- `onChange` ((token: string | null) => void): Called when token changes
- `onExpired` (() => void): Called when token expires
- `onErrored` ((error: Error) => void): Called when error occurs
- `onLoad` (() => void): Called when reCAPTCHA loads

#### Component Ref Methods

When using `useRef<GoogleRecaptchaRef>()`:

- `execute()`: Promise<string | null> - Execute reCAPTCHA and get token
- `executeAsync()`: Promise<string> - Execute reCAPTCHA and get token (throws on failure)
- `reset()`: void - Reset the reCAPTCHA widget (v2 only)
- `getResponse()`: string | null - Get current response token (v2 only)

## TypeScript Support

This package includes full TypeScript support with exported interfaces:

```tsx
import { useGoogleRecaptcha, ReCaptchaResponse, ReCaptchaOptions } from "google-recaptcha-v3";
```

## Security Features

### 🔒 Built-in Security Protection

This library integrates with Google reCAPTCHA to provide robust protection against:
- ✅ **Automated bot attacks** - reCAPTCHA v3 uses advanced risk analysis
- ✅ **Captcha solving services** - When properly configured on backend
- ✅ **Brute force attacks** - Combined with rate limiting
- ✅ **Token reuse attacks** - Single-use token validation
- ✅ **Man-in-the-middle attacks** - HTTPS encryption required

### Security Recommendations:

1. **Use reCAPTCHA v3 for best security** - No user interaction, AI-powered bot detection
2. **Always verify tokens server-side** - Never trust client-side validation
3. **Implement score thresholds** - Reject requests with score < 0.5 (v3)
4. **Validate action names** - Ensure action matches expected value
5. **Check hostname** - Verify requests come from your domain
6. **Enable rate limiting** - Prevent abuse and brute force
7. **Use HTTPS only** - Protect tokens in transit
8. **Monitor and log** - Track suspicious activity and low scores
9. **Implement CSRF protection** - Use anti-CSRF tokens alongside reCAPTCHA
10. **Keep secrets secure** - Store secret keys in environment variables

### Defense Against Automated Solvers:

While services like 2captcha exist, proper implementation makes automated solving:
- **Expensive**: Each solve costs money, making mass attacks costly
- **Slow**: Solving takes time, reducing attack effectiveness
- **Detectable**: v3 scoring detects automated patterns
- **Preventable**: Server-side validation with strict thresholds blocks most attempts

**Key Protection Strategies:**
```typescript
// Frontend: Generate token with meaningful action
const token = await recaptchaRef.current?.execute();

// Backend: Validate with strict requirements
if (score < 0.5) reject(); // Block low scores
if (action !== 'submit') reject(); // Validate action
if (hostname !== 'yourdomain.com') reject(); // Check origin
if (tokenUsedBefore(token)) reject(); // Prevent reuse
```

## Features

### Hook Features (v3 only)
- ✅ Clean and modern React hook
- ✅ Full TypeScript support
- ✅ Automatic script loading and cleanup
- ✅ Error handling
- ✅ Loading states
- ✅ Manual token refresh
- ✅ Language support
- ✅ Zero dependencies (peer dependency: React >=16.8.0)

### Component Features (v2 & v3)
- ✅ Supports both reCAPTCHA v2 and v3
- ✅ Full component-based implementation with ref support
- ✅ All reCAPTCHA v2 props (theme, size, type, etc.)
- ✅ Invisible reCAPTCHA support
- ✅ Comprehensive callback handling (onChange, onExpired, onErrored, onLoad)
- ✅ Imperative API through refs (execute, reset, getResponse)
- ✅ Flexible styling and positioning options
- ✅ Language and localization support
- ✅ Full TypeScript interfaces and type safety

# Backend Integration

## Security Best Practices

### ⚠️ CRITICAL SECURITY REQUIREMENTS

**ALWAYS verify reCAPTCHA tokens on your backend server. Never trust client-side validation alone.**

To protect against automated captcha-solving services, you MUST:
1. ✅ **Verify every token server-side** using Google's siteverify API
2. ✅ **Check the score threshold** for v3 (recommended: >= 0.5)
3. ✅ **Validate the action name** matches your expected action
4. ✅ **Check the hostname** matches your domain
5. ✅ **Implement rate limiting** to prevent abuse
6. ✅ **Use HTTPS only** to prevent token interception
7. ✅ **Set short token expiration** (tokens expire after ~2 minutes)
8. ✅ **Never reuse tokens** - validate each token only once

### Protection Against Automated Solvers

This library integrates with Google reCAPTCHA, which provides built-in protection against automated solving services. However, you must implement proper backend verification to ensure security:

**reCAPTCHA v3 (Recommended):**
- Returns a score (0.0 - 1.0) indicating the likelihood of being a bot
- No user interaction required
- Harder for automated solvers to bypass
- **Recommended minimum score: 0.5** (adjust based on your needs)

**reCAPTCHA v2:**
- Requires user interaction (checkbox or image challenges)
- More difficult for bots but can impact user experience
- Use invisible reCAPTCHA for better UX

## Verify reCAPTCHA token from React with NestJS Back-End:

### Create RecaptchaMiddleware by CMD:
```bash
nest generate middleware recaptcha
```

### Enhanced RecaptchaMiddleware with Security Best Practices:

#### For reCAPTCHA v3 (with score validation):
```ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

@Injectable()
export class RecaptchaMiddleware implements NestMiddleware {
  private secretKey = process.env.RECAPTCHA_SECRET_KEY || 'YOUR_SITE_SECRET_KEY';
  private minScore = 0.5; // Minimum acceptable score for v3
  private expectedAction = 'submit'; // Expected action name
  private allowedHostnames = ['yourdomain.com', 'www.yourdomain.com']; // Your domains

  async use(req: Request, res: Response, next: NextFunction) {
    const recaptchaToken = req.body.recaptchaToken;
    
    if (!recaptchaToken) {
      return res.status(400).json({ 
        message: 'Missing recaptchaToken',
        error: 'MISSING_TOKEN'
      });
    }

    try {
      const response = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: this.secretKey,
            response: recaptchaToken,
            remoteip: req.ip || req.connection.remoteAddress
          }
        }
      );

      const { success, score, action, hostname, 'error-codes': errorCodes } = response.data;

      // Basic validation
      if (!success) {
        console.error('reCAPTCHA validation failed:', errorCodes);
        return res.status(401).json({ 
          message: 'Invalid recaptchaToken',
          error: 'VALIDATION_FAILED'
        });
      }

      // Validate score for v3 (score is only present in v3 responses)
      if (score !== undefined && score < this.minScore) {
        console.warn(`Low reCAPTCHA score: ${score} from IP: ${req.ip}`);
        return res.status(403).json({ 
          message: 'reCAPTCHA score too low',
          error: 'LOW_SCORE'
        });
      }

      // Validate action name for v3
      if (action && action !== this.expectedAction) {
        console.error(`Action mismatch: expected ${this.expectedAction}, got ${action}`);
        return res.status(401).json({ 
          message: 'Invalid action',
          error: 'ACTION_MISMATCH'
        });
      }

      // Validate hostname
      if (hostname && !this.allowedHostnames.includes(hostname)) {
        console.error(`Hostname not allowed: ${hostname}`);
        return res.status(401).json({ 
          message: 'Invalid hostname',
          error: 'HOSTNAME_MISMATCH'
        });
      }

      // Attach score and hostname to request for further processing
      req['recaptchaScore'] = score;
      req['recaptchaHostname'] = hostname;

      next();
    } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      return res.status(500).json({ 
        message: 'Internal Server Error',
        error: 'VERIFICATION_ERROR'
      });
    }
  }
}
```

#### For reCAPTCHA v2:
```ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

@Injectable()
export class RecaptchaV2Middleware implements NestMiddleware {
  private secretKey = process.env.RECAPTCHA_SECRET_KEY || 'YOUR_SITE_SECRET_KEY';
  private allowedHostnames = ['yourdomain.com', 'www.yourdomain.com'];

  async use(req: Request, res: Response, next: NextFunction) {
    const recaptchaToken = req.body.recaptchaToken;
    
    if (!recaptchaToken) {
      return res.status(400).json({ 
        message: 'Missing recaptchaToken',
        error: 'MISSING_TOKEN'
      });
    }

    try {
      const response = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: this.secretKey,
            response: recaptchaToken,
            remoteip: req.ip || req.connection.remoteAddress
          }
        }
      );

      const { success, hostname, 'error-codes': errorCodes } = response.data;

      if (!success) {
        console.error('reCAPTCHA v2 validation failed:', errorCodes);
        return res.status(401).json({ 
          message: 'Invalid recaptchaToken',
          error: 'VALIDATION_FAILED'
        });
      }

      // Validate hostname
      if (hostname && !this.allowedHostnames.includes(hostname)) {
        console.error(`Hostname not allowed: ${hostname}`);
        return res.status(401).json({ 
          message: 'Invalid hostname',
          error: 'HOSTNAME_MISMATCH'
        });
      }

      next();
    } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      return res.status(500).json({ 
        message: 'Internal Server Error',
        error: 'VERIFICATION_ERROR'
      });
    }
  }
}
```

### Express.js Backend Example:

```js
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// reCAPTCHA v3 verification endpoint
app.post('/api/verify-recaptcha', async (req, res) => {
  const { token, action } = req.body;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const minScore = 0.5;

  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: secretKey,
          response: token,
          remoteip: req.ip
        }
      }
    );

    const { success, score, action: responseAction, hostname } = response.data;

    if (!success) {
      return res.status(401).json({ 
        success: false, 
        message: 'reCAPTCHA validation failed' 
      });
    }

    if (score < minScore) {
      return res.status(403).json({ 
        success: false, 
        message: 'Score too low',
        score 
      });
    }

    if (responseAction !== action) {
      return res.status(401).json({ 
        success: false, 
        message: 'Action mismatch' 
      });
    }

    // Verification successful
    res.json({ 
      success: true, 
      score,
      message: 'Verification successful' 
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

### Additional Security Measures:

#### 1. Rate Limiting:
```ts
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

// Install: npm install @nestjs/throttler

// In your module:
ThrottlerModule.forRoot({
  ttl: 60,
  limit: 10, // 10 requests per minute
}),

// Apply to specific routes or globally
@UseGuards(ThrottlerGuard)
```

#### 2. Token Expiration Tracking:
```ts
// Store used tokens in Redis or memory cache
import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RecaptchaService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async validateToken(token: string): Promise<boolean> {
    // Check if token was already used
    const used = await this.cacheManager.get(`recaptcha:${token}`);
    if (used) {
      return false; // Token already used
    }

    // Mark token as used (expires after 5 minutes)
    await this.cacheManager.set(`recaptcha:${token}`, true, 300);
    return true;
  }
}
```

#### 3. Environment Variables:
```bash
# .env file
RECAPTCHA_SECRET_KEY=your_secret_key_here
RECAPTCHA_MIN_SCORE=0.5
ALLOWED_HOSTNAMES=yourdomain.com,www.yourdomain.com
```

## Complete Security Implementation Guide

### Step-by-Step Security Setup:

#### Step 1: Frontend Implementation (React)

```tsx
import React, { useRef, useState } from "react";
import { GoogleRecaptcha, GoogleRecaptchaRef } from "google-recaptcha-v3";
import axios from "axios";

const SecureForm = () => {
  const recaptchaRef = useRef<GoogleRecaptchaRef>(null);
  const [loading, setLoading] = useState(false);

  const handleSecureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get reCAPTCHA token
      const token = await recaptchaRef.current?.executeAsync();
      
      if (!token) {
        alert('reCAPTCHA verification failed');
        return;
      }

      // Send to your backend for verification
      const response = await axios.post('/api/secure-endpoint', {
        recaptchaToken: token,
        // ... other form data
      });

      if (response.data.success) {
        alert('Form submitted successfully!');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSecureSubmit}>
      <GoogleRecaptcha
        ref={recaptchaRef}
        sitekey="YOUR_SITE_KEY"
        version="v3"
        action="submit_form"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};
```

#### Step 2: Backend Verification (Node.js/Express)

```javascript
const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);

// Verification function
async function verifyRecaptcha(token, expectedAction, ip) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: secretKey,
          response: token,
          remoteip: ip
        }
      }
    );

    const { success, score, action, hostname, challenge_ts } = response.data;

    // Check all security criteria
    return {
      valid: success && 
             score >= 0.5 && 
             action === expectedAction &&
             hostname === 'yourdomain.com',
      score,
      action,
      hostname,
      timestamp: challenge_ts
    };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { valid: false, error: error.message };
  }
}

// Secure endpoint
app.post('/api/secure-endpoint', async (req, res) => {
  const { recaptchaToken } = req.body;
  
  if (!recaptchaToken) {
    return res.status(400).json({ 
      success: false, 
      message: 'reCAPTCHA token required' 
    });
  }

  const verification = await verifyRecaptcha(
    recaptchaToken, 
    'submit_form', 
    req.ip
  );

  if (!verification.valid) {
    return res.status(403).json({ 
      success: false, 
      message: 'reCAPTCHA verification failed',
      details: verification
    });
  }

  // Process the request
  // ... your business logic here

  res.json({ 
    success: true, 
    message: 'Request processed successfully',
    score: verification.score
  });
});

app.listen(3000);
```

### Common Security Mistakes to Avoid:

❌ **DON'T:**
- Skip backend verification (critical vulnerability!)
- Accept any score value without checking
- Ignore action name validation
- Reuse tokens across requests
- Store secret keys in frontend code
- Use HTTP instead of HTTPS
- Skip rate limiting
- Trust client-side validation only

✅ **DO:**
- Always verify tokens on your backend server
- Set minimum score threshold (0.5 recommended)
- Validate action names match expected values
- Implement single-use token validation
- Store secrets in environment variables
- Use HTTPS for all communications
- Implement rate limiting
- Log suspicious activity
- Monitor reCAPTCHA scores over time
- Use different site keys for development/production

### Monitoring and Logging:

```typescript
// Backend logging example
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'recaptcha.log' })
  ]
});

async function verifyAndLog(token, action, ip) {
  const result = await verifyRecaptcha(token, action, ip);
  
  logger.info('reCAPTCHA verification', {
    success: result.valid,
    score: result.score,
    action: result.action,
    ip: ip,
    timestamp: new Date().toISOString()
  });

  // Alert on suspicious activity
  if (result.score < 0.3) {
    logger.warn('Low reCAPTCHA score detected', {
      score: result.score,
      ip: ip,
      timestamp: new Date().toISOString()
    });
  }

  return result;
}
```

### Testing Security:

```typescript
// Test your implementation
describe('reCAPTCHA Security Tests', () => {
  it('should reject requests without token', async () => {
    const response = await request(app)
      .post('/api/secure-endpoint')
      .send({});
    
    expect(response.status).toBe(400);
  });

  it('should reject low score tokens', async () => {
    // Mock verification with low score
    const response = await request(app)
      .post('/api/secure-endpoint')
      .send({ recaptchaToken: 'low_score_token' });
    
    expect(response.status).toBe(403);
  });

  it('should reject mismatched action', async () => {
    // Mock verification with wrong action
    const response = await request(app)
      .post('/api/secure-endpoint')
      .send({ recaptchaToken: 'wrong_action_token' });
    
    expect(response.status).toBe(403);
  });
});
```

### Response to Automated Solving Services:

This library properly implements Google reCAPTCHA v2 and v3, which provides strong protection against automated solving when configured correctly:

**How reCAPTCHA v3 Protects:**
1. Analyzes user behavior patterns across your site
2. Uses machine learning to detect bots
3. Returns a score (0.0-1.0) instead of binary pass/fail
4. Works invisibly without user interaction
5. Detects automated solving patterns

**Protection Layers:**
```
┌─────────────────────────────────────────┐
│  1. Client: Generate unique token       │
│  2. Network: HTTPS encryption           │
│  3. Server: Token verification          │
│  4. Server: Score validation (≥ 0.5)    │
│  5. Server: Action name check           │
│  6. Server: Hostname validation         │
│  7. Server: Single-use enforcement      │
│  8. Server: Rate limiting               │
│  9. Server: IP monitoring               │
│ 10. Database: Audit logging             │
└─────────────────────────────────────────┘
```

### Cost Analysis of Automated Attacks:

When properly implemented with v3 and score validation:
- Automated solving: $2.99 per 1000 solves (2captcha pricing)
- Detection rate: ~80-90% with score < 0.5
- Time per solve: 10-30 seconds
- Success rate: Low due to score validation

**Making attacks impractical:**
- 1000 attempts = $3-$5 cost + 3-8 hours time
- 90% rejection rate = 100 successful attacks from 1000 attempts
- Effective cost: $30-$50 per 100 successful attempts
- Rate limiting further reduces effectiveness

### Author
Copyright 2024 mia nguyen x thind9xdev

Licensed under the MIT License