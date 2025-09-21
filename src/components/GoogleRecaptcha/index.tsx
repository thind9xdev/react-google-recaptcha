import React, { useEffect, useRef, useImperativeHandle, forwardRef, useCallback, useState } from "react";

export type ReCaptchaTheme = "light" | "dark";
export type ReCaptchaType = "image" | "audio";
export type ReCaptchaSize = "compact" | "normal" | "invisible";
export type ReCaptchaVersion = "v2" | "v3";

export interface GoogleRecaptchaProps {
  sitekey: string;
  // v2 specific props
  theme?: ReCaptchaTheme;
  type?: ReCaptchaType;
  size?: ReCaptchaSize;
  tabindex?: number;
  onChange?: (token: string | null) => void;
  onExpired?: () => void;
  onErrored?: (error: Error) => void;
  onLoad?: () => void;
  // v3 specific props
  action?: string;
  version?: ReCaptchaVersion;
  // Common props
  hl?: string; // language
  badge?: "bottomright" | "bottomleft" | "inline";
  isolated?: boolean;
  // Style props
  className?: string;
  style?: React.CSSProperties;
}

export interface GoogleRecaptchaRef {
  execute: () => Promise<string | null>;
  executeAsync: () => Promise<string>;
  reset: () => void;
  getResponse: () => string | null;
}

interface ReCaptchaWindow extends Window {
  grecaptcha: {
    ready: (callback: () => void) => void;
    render: (container: string | HTMLElement, options: any) => string;
    execute: (siteKeyOrWidgetId?: string | number, options?: { action?: string }) => Promise<string>;
    reset: (widgetId?: string | number) => void;
    getResponse: (widgetId?: string | number) => string;
  };
}

declare const window: ReCaptchaWindow;

const GoogleRecaptcha = forwardRef<GoogleRecaptchaRef, GoogleRecaptchaProps>(
  (
    {
      sitekey,
      theme = "light",
      type = "image",
      size = "normal",
      tabindex,
      onChange,
      onExpired,
      onErrored,
      onLoad,
      action = "submit",
      version = "v2",
      hl = "en",
      badge = "bottomright",
      isolated = false,
      className,
      style,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | number | null>(null);
    const scriptLoadedRef = useRef<boolean>(false);
    const [isReady, setIsReady] = useState<boolean>(false);

    const isV3 = version === "v3";

    const loadScript = useCallback(() => {
      if (scriptLoadedRef.current) return Promise.resolve();

      return new Promise<void>((resolve, reject) => {
        const scriptId = `recaptcha-script-${version}`;
        
        // Check if script already exists
        const existingScript = document.getElementById(scriptId);
        if (existingScript) {
          scriptLoadedRef.current = true;
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.id = scriptId;
        
        if (isV3) {
          script.src = `https://www.google.com/recaptcha/api.js?render=${sitekey}&hl=${hl}`;
        } else {
          script.src = `https://www.google.com/recaptcha/api.js?hl=${hl}`;
        }
        
        script.async = true;
        script.defer = true;

        script.onload = () => {
          scriptLoadedRef.current = true;
          resolve();
        };

        script.onerror = () => {
          reject(new Error("Failed to load reCAPTCHA script"));
        };

        document.head.appendChild(script);
      });
    }, [sitekey, version, hl, isV3]);

    const renderRecaptcha = useCallback(() => {
      if (!window.grecaptcha || !containerRef.current) return;

      try {
        if (isV3) {
          // For v3, we don't render anything visible, just set ready state
          window.grecaptcha.ready(() => {
            setIsReady(true);
            onLoad?.();
          });
        } else {
          // For v2, render the widget
          window.grecaptcha.ready(() => {
            if (containerRef.current && !widgetIdRef.current) {
              widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
                sitekey,
                theme,
                type,
                size,
                tabindex,
                callback: onChange,
                "expired-callback": onExpired,
                "error-callback": (error: any) => {
                  onErrored?.(new Error(error || "reCAPTCHA error"));
                },
                badge,
                isolated,
              });
              setIsReady(true);
              onLoad?.();
            }
          });
        }
      } catch (error) {
        onErrored?.(error instanceof Error ? error : new Error("Failed to render reCAPTCHA"));
      }
    }, [
      sitekey,
      theme,
      type,
      size,
      tabindex,
      onChange,
      onExpired,
      onErrored,
      onLoad,
      badge,
      isolated,
      isV3,
    ]);

    const execute = useCallback(async (): Promise<string | null> => {
      if (!window.grecaptcha || !isReady) {
        return null;
      }

      try {
        if (isV3) {
          return await window.grecaptcha.execute(sitekey, { action });
        } else {
          return window.grecaptcha.getResponse(widgetIdRef.current || 0);
        }
      } catch (error) {
        onErrored?.(error instanceof Error ? error : new Error("Failed to execute reCAPTCHA"));
        return null;
      }
    }, [sitekey, action, isReady, onErrored, isV3]);

    const executeAsync = useCallback(async (): Promise<string> => {
      const token = await execute();
      if (!token) {
        throw new Error("Failed to get reCAPTCHA token");
      }
      return token;
    }, [execute]);

    const reset = useCallback(() => {
      if (!window.grecaptcha || !isReady) return;

      try {
        if (!isV3 && widgetIdRef.current !== null) {
          window.grecaptcha.reset(widgetIdRef.current);
        }
        onChange?.(null);
      } catch (error) {
        onErrored?.(error instanceof Error ? error : new Error("Failed to reset reCAPTCHA"));
      }
    }, [isReady, onChange, onErrored, isV3]);

    const getResponse = useCallback((): string | null => {
      if (!window.grecaptcha || !isReady || isV3) return null;

      try {
        return window.grecaptcha.getResponse(widgetIdRef.current || 0);
      } catch (error) {
        onErrored?.(error instanceof Error ? error : new Error("Failed to get reCAPTCHA response"));
        return null;
      }
    }, [isReady, onErrored, isV3]);

    useImperativeHandle(ref, () => ({
      execute,
      executeAsync,
      reset,
      getResponse,
    }));

    useEffect(() => {
      const initRecaptcha = async () => {
        try {
          await loadScript();
          renderRecaptcha();
        } catch (error) {
          onErrored?.(error instanceof Error ? error : new Error("Failed to initialize reCAPTCHA"));
        }
      };

      initRecaptcha();
    }, [loadScript, renderRecaptcha, onErrored]);

    // For v3 or invisible, don't render any visible element
    if (isV3 || size === "invisible") {
      return null;
    }

    // For v2 visible, render container
    return (
      <div
        ref={containerRef}
        className={className}
        style={style}
        data-testid="google-recaptcha"
      />
    );
  }
);

GoogleRecaptcha.displayName = "GoogleRecaptcha";

export default GoogleRecaptcha;