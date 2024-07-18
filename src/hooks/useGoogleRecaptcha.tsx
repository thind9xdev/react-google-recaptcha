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
  const { language = "en" } = options;

  useEffect(() => {
    const scriptId = "recaptcha-script";

    const loadReCaptcha = () => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          window.grecaptcha
            .execute(siteKey, { action })
            .then((token) => setToken(token))
            .catch((err) => setError(err));
        });
      }
    };

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}&hl=${language}`;
      script.async = true;
      script.defer = true;
      script.onload = loadReCaptcha;
      document.body.appendChild(script);
    } else {
      loadReCaptcha();
    }
  }, [siteKey, action, language]);

  const fetchCaptcha = useCallback(() => {
    if (window.grecaptcha) {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(siteKey, { action })
          .then((token) => setToken(token))
          .catch((err) => setError(err));
      });
    }
  }, [siteKey, action]);

  return { token, error, fetchCaptcha };
};

export default useGoogleRecaptcha;
