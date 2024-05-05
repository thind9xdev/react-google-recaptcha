# React Google Recaptcha V3

## Install:

```bash
npm i google-recaptcha-v3
```

## Import to React:

```tsx
import { useGoogleRecaptcha } from "google-recaptcha-v3";

```

## Use in React

```tsx
import React from "react";
import { useGoogleRecaptcha } from "google-recaptcha-v3"

const YourComponent = () => {
  const siteKey = "YOUR_SITE_KEY";
  const action = "submit";
  const { token } = useGoogleRecaptcha(siteKey, action);
  // You can use token to send request to API
  return (
    <div>
     

    </div>
  );
};

export default YourComponent;


```
# Next :
## Verify  recaptcha token from React with Nestjs Back-End :
### Create RecaptchaMiddleware by CMD : 
```bash
nest generate middleware recaptcha
```
### Add Sample code to RecaptchaMiddleware :
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