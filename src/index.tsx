export { default as useGoogleRecaptcha } from "./hooks/useGoogleRecaptcha";

// Re-export types for better developer experience
export interface ReCaptchaResponse {
  success: boolean;
  challenge_ts: string;
  hostname: string;
  error_codes?: string[];
}

export interface ReCaptchaOptions {
  language?: string;
}