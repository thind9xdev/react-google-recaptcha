# Backend Verification Examples

This directory contains utility functions and examples for implementing secure backend verification of Google reCAPTCHA tokens.

## Files

### `backend-utils.ts`

A comprehensive TypeScript utility file providing:

- **Token verification functions** - Verify tokens with Google's API
- **Validation functions** - Comprehensive security checks (score, action, hostname)
- **Express.js middleware** - Ready-to-use middleware for Express applications
- **NestJS guard example** - Example implementation for NestJS
- **Token caching** - Single-use token enforcement
- **Logging utilities** - Track and monitor verification attempts

## Quick Start

### Installation

```bash
# Copy the backend-utils.ts file to your project
cp examples/backend-utils.ts src/utils/

# Install required dependencies
npm install express axios
# or for TypeScript projects
npm install --save-dev @types/node @types/express
```

### Basic Usage

```typescript
import { validateRecaptchaToken } from './utils/backend-utils';

// In your API endpoint
app.post('/api/submit', async (req, res) => {
  const { recaptchaToken } = req.body;

  const result = await validateRecaptchaToken(recaptchaToken, {
    secretKey: process.env.RECAPTCHA_SECRET_KEY!,
    minScore: 0.5,
    expectedAction: 'submit_form',
    allowedHostnames: ['yourdomain.com'],
    remoteIp: req.ip
  });

  if (!result.valid) {
    return res.status(403).json({
      error: result.reason,
      message: 'Security verification failed'
    });
  }

  // Process the request
  res.json({ success: true });
});
```

### Using with Express Middleware

```typescript
import express from 'express';
import { recaptchaMiddleware } from './utils/backend-utils';

const app = express();
app.use(express.json());

// Apply middleware to specific routes
app.post('/api/submit', 
  recaptchaMiddleware({
    secretKey: process.env.RECAPTCHA_SECRET_KEY!,
    minScore: 0.5,
    expectedAction: 'submit_form',
    allowedHostnames: ['yourdomain.com']
  }),
  (req, res) => {
    // Token is already validated at this point
    res.json({ success: true });
  }
);

app.listen(3000);
```

### Using with Single-Use Token Enforcement

```typescript
import { 
  validateRecaptchaTokenWithCache, 
  TokenCache 
} from './utils/backend-utils';

// Create token cache instance
const tokenCache = new TokenCache();

app.post('/api/submit', async (req, res) => {
  const { recaptchaToken } = req.body;

  const result = await validateRecaptchaTokenWithCache(
    recaptchaToken,
    {
      secretKey: process.env.RECAPTCHA_SECRET_KEY!,
      minScore: 0.5,
      expectedAction: 'submit_form',
      remoteIp: req.ip
    },
    tokenCache
  );

  if (!result.valid) {
    return res.status(403).json({
      error: result.reason,
      message: 'Security verification failed'
    });
  }

  res.json({ success: true });
});
```

## Environment Variables

Create a `.env` file in your project root:

```bash
# reCAPTCHA Configuration
RECAPTCHA_SECRET_KEY=your_secret_key_here
RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_MIN_SCORE=0.5

# Allowed Hostnames (comma-separated)
ALLOWED_HOSTNAMES=yourdomain.com,www.yourdomain.com

# Server Configuration
PORT=3000
NODE_ENV=production
```

## Security Checklist

Before deploying to production:

- [ ] Environment variables are properly configured
- [ ] Secret key is never exposed in client-side code
- [ ] Minimum score threshold is set (recommended: 0.5 or higher)
- [ ] Action names are validated
- [ ] Hostname verification is enabled
- [ ] HTTPS is enforced
- [ ] Rate limiting is implemented
- [ ] Logging and monitoring are configured
- [ ] Single-use token enforcement is enabled (optional but recommended)

## NestJS Example

```typescript
// recaptcha.guard.ts
import { Injectable, CanActivate, ExecutionContext, BadRequestException, ForbiddenException } from '@nestjs/common';
import { validateRecaptchaToken } from './backend-utils';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RecaptchaGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.body.recaptchaToken;

    if (!token) {
      throw new BadRequestException('reCAPTCHA token is required');
    }

    const result = await validateRecaptchaToken(token, {
      secretKey: this.configService.get('RECAPTCHA_SECRET_KEY')!,
      minScore: 0.5,
      expectedAction: 'submit_form',
      allowedHostnames: this.configService.get('ALLOWED_HOSTNAMES')?.split(',') || [],
      remoteIp: request.ip
    });

    if (!result.valid) {
      throw new ForbiddenException(`Security verification failed: ${result.reason}`);
    }

    // Attach result to request
    request.recaptchaValidation = result;

    return true;
  }
}

// Usage in controller
@Controller('api')
export class ApiController {
  @Post('submit')
  @UseGuards(RecaptchaGuard)
  async submit(@Body() body: any, @Req() req: any) {
    // Token is validated, access score if needed
    const score = req.recaptchaValidation?.score;
    return { success: true, score };
  }
}
```

## Advanced Features

### Rate Limiting

Combine with express-rate-limit:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

### Redis-based Token Cache

For production environments with multiple servers:

```typescript
import Redis from 'ioredis';

const redis = new Redis();

async function isTokenUsed(token: string): Promise<boolean> {
  const used = await redis.get(`recaptcha:${token}`);
  return used !== null;
}

async function markTokenAsUsed(token: string): Promise<void> {
  // Expire after 5 minutes
  await redis.setex(`recaptcha:${token}`, 300, '1');
}
```

### Monitoring Dashboard

Track metrics over time:

```typescript
interface RecaptchaMetrics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  averageScore: number;
  lowScoreAlerts: number;
  suspiciousIPs: string[];
}

async function getMetrics(timeRange: string): Promise<RecaptchaMetrics> {
  // Query your database or logging service
  // Return aggregated metrics
}

app.get('/admin/recaptcha/metrics', async (req, res) => {
  const metrics = await getMetrics('24h');
  res.json(metrics);
});
```

## Testing

```typescript
// test/recaptcha.test.ts
import { validateRecaptchaToken } from '../utils/backend-utils';

describe('reCAPTCHA Validation', () => {
  it('should reject invalid token', async () => {
    const result = await validateRecaptchaToken('invalid_token', {
      secretKey: process.env.RECAPTCHA_SECRET_KEY!
    });
    
    expect(result.valid).toBe(false);
  });

  it('should reject low score', async () => {
    // Use a token with low score (for testing)
    const result = await validateRecaptchaToken('low_score_token', {
      secretKey: process.env.RECAPTCHA_SECRET_KEY!,
      minScore: 0.5
    });
    
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('SCORE_TOO_LOW');
  });

  it('should validate action name', async () => {
    const result = await validateRecaptchaToken('token', {
      secretKey: process.env.RECAPTCHA_SECRET_KEY!,
      expectedAction: 'submit_form'
    });
    
    if (!result.valid && result.reason === 'ACTION_MISMATCH') {
      expect(result.details.expected).toBe('submit_form');
    }
  });
});
```

## Troubleshooting

### Common Issues

1. **"VERIFICATION_FAILED" error**
   - Check that your secret key is correct
   - Ensure the token hasn't expired (2 minute lifetime)
   - Verify you're using the correct secret key for your environment

2. **"SCORE_TOO_LOW" error**
   - User might be exhibiting bot-like behavior
   - Consider lowering minScore for testing (not recommended for production)
   - Implement additional verification steps for low scores

3. **"ACTION_MISMATCH" error**
   - Frontend action name doesn't match backend expected action
   - Ensure action names are consistent between frontend and backend

4. **"HOSTNAME_NOT_ALLOWED" error**
   - Request is coming from an unexpected domain
   - Update allowedHostnames list to include your domain
   - Check for www vs non-www domain issues

## Resources

- [Google reCAPTCHA Documentation](https://developers.google.com/recaptcha)
- [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
- [Security Best Practices](../SECURITY.md)
- [Main README](../README.md)

## Support

For issues or questions:
- Open an issue on GitHub
- Check the Security Guide (SECURITY.md)
- Review the main README documentation

## License

MIT License - see LICENSE file for details
