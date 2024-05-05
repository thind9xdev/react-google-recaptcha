import React, { useState, useEffect, useCallback } from "react";

interface ReCaptchaResponse {
  success: boolean;
  challenge_ts: string;
  hostname: string;
  error_codes?: string[];
}

interface ReCaptchaWindow extends Window {
  grecaptcha: {
    ready: (callback: () => void) => void;
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
  };
}

declare const window: ReCaptchaWindow;

const useGoogleRecaptcha = (
  siteKey: string,
  action: string,
  options: { language?: string } = {}

) => {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { language = 'en' } = options; 

  useEffect(() => {
    const loadReCaptcha = () => {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(siteKey, { action })
          .then((token) => setToken(token))
          .catch((err) => setError(err));
      });
    };

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}&hl=${language}`;
    script.async = true;
    script.defer = true;
    script.onload = loadReCaptcha;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [siteKey, action, language]);

  const fetchCaptcha = useCallback(() => {
    const loadReCaptcha = () => {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(siteKey, { action })
          .then((token) => setToken(token))
          .catch((err) => setError(err));
      });
    };

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}&hl=${language}`;
    script.async = true;
    script.defer = true;
    script.onload = loadReCaptcha;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [siteKey, action, language]);

  return { token, error, fetchCaptcha };
};

export default useGoogleRecaptcha;
