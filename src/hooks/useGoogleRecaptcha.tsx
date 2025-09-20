import { useState, useEffect, useCallback, useRef } from "react";

export interface ReCaptchaResponse {
  success: boolean;
  challenge_ts: string;
  hostname: string;
  error_codes?: string[];
}

export interface ReCaptchaOptions {
  language?: string;
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
  options: ReCaptchaOptions = {}
) => {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const { language = "en" } = options;

  const executeRecaptcha = useCallback(async (): Promise<string | null> => {
    if (!window.grecaptcha) {
      setError("reCAPTCHA not loaded");
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      return new Promise((resolve, reject) => {
        window.grecaptcha.ready(() => {
          window.grecaptcha
            .execute(siteKey, { action })
            .then((token) => {
              setToken(token);
              setIsLoading(false);
              resolve(token);
            })
            .catch((err) => {
              const errorMessage = err instanceof Error ? err.message : "reCAPTCHA execution failed";
              setError(errorMessage);
              setIsLoading(false);
              reject(err);
            });
        });
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "reCAPTCHA execution failed";
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  }, [siteKey, action]);

  useEffect(() => {
    const scriptId = "recaptcha-script";

    // Check if script already exists
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement;
    if (existingScript) {
      // Script exists, execute reCAPTCHA
      executeRecaptcha();
      return;
    }

    // Create and load reCAPTCHA script
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}&hl=${language}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      executeRecaptcha();
    };

    script.onerror = () => {
      setError("Failed to load reCAPTCHA script");
      setIsLoading(false);
    };

    document.head.appendChild(script);
    scriptRef.current = script;

    // Cleanup function
    return () => {
      if (scriptRef.current && document.head.contains(scriptRef.current)) {
        document.head.removeChild(scriptRef.current);
      }
    };
  }, [siteKey, language, executeRecaptcha]);

  const refreshToken = useCallback(() => {
    setToken(null);
    setError(null);
    executeRecaptcha();
  }, [executeRecaptcha]);

  return { 
    token, 
    error, 
    isLoading,
    refreshToken,
    executeRecaptcha
  };
};

export default useGoogleRecaptcha;