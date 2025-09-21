# React Google Recaptcha

A clean, modern React library for Google reCAPTCHA integration with both hooks and components supporting v2 and v3.

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