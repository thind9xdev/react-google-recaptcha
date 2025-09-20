# React Google Recaptcha V3

A clean, modern React hook for Google reCAPTCHA v3 integration.

## Install:

```bash
npm i google-recaptcha-v3
```

## Import to React:

```tsx
import { useGoogleRecaptcha } from "google-recaptcha-v3";
```

## Basic Usage

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

## Advanced Usage

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

### `useGoogleRecaptcha(siteKey, action, options?)`

#### Parameters:
- `siteKey` (string): Your Google reCAPTCHA v3 site key
- `action` (string): The action name for this reCAPTCHA execution
- `options` (ReCaptchaOptions, optional): Configuration options
  - `language` (string, optional): Language code (default: "en")

#### Returns:
- `token` (string | null): The reCAPTCHA token
- `error` (string | null): Error message if something went wrong
- `isLoading` (boolean): Loading state
- `refreshToken` (function): Function to refresh the token
- `executeRecaptcha` (function): Function to manually execute reCAPTCHA

## TypeScript Support

This package includes full TypeScript support with exported interfaces:

```tsx
import { useGoogleRecaptcha, ReCaptchaResponse, ReCaptchaOptions } from "google-recaptcha-v3";
```

## Features

- ✅ Clean and modern React hook
- ✅ Full TypeScript support
- ✅ Automatic script loading and cleanup
- ✅ Error handling
- ✅ Loading states
- ✅ Manual token refresh
- ✅ Language support
- ✅ Zero dependencies (peer dependency: React >=16.8.0)

# Backend Integration

## Verify reCAPTCHA token from React with NestJS Back-End:

### Create RecaptchaMiddleware by CMD:
```bash
nest generate middleware recaptcha
```

### Add Sample code to RecaptchaMiddleware:
```ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

@Injectable()
export class RecaptchaMiddleware implements NestMiddleware {
  private key = 'YOUR_SITE_SECRET_KEY';
  async use(req: Request, res: Response, next: NextFunction) {
    const recaptchaToken = req.body.recaptchaToken;
    if (!recaptchaToken) {
      return res.status(400).json({ message: 'Missing recaptchaToken' });
    }

    try {
      const response = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${this.key}&response=${recaptchaToken}`,
        {},
      );

      const { success } = response.data;

      if (!success) {
        return res.status(401).json({ message: 'Invalid recaptchaToken' });
      }

      next();
    } catch (error) {
      console.error('Recaptcha verification error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}
```

### Author
Copyright 2024 mia nguyen x thind9xdev

Licensed under the MIT License