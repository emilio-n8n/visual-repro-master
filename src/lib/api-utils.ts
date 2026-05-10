// API Error handling utilities

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export class ApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message.includes("network") || error.message.includes("fetch")) {
      return new ApiError("Erreur de connexion. Vérifiez votre connexion internet.", 0, "NETWORK_ERROR");
    }

    // Timeout errors
    if (error.message.includes("timeout")) {
      return new ApiError("La requête a pris trop de temps. Réessayez.", 0, "TIMEOUT");
    }

    return new ApiError(error.message, 0, "UNKNOWN");
  }

  return new ApiError("Une erreur inattendue s'est produite", 0, "UNKNOWN");
};

export const isOnline = (): boolean => {
  return navigator.onLine;
};

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

// Log errors to console in development
export const logError = (context: string, error: unknown) => {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  }
};

// Error reporting hook (can be connected to analytics)
export const reportError = (error: unknown, context?: string) => {
  const errorInfo = handleApiError(error);
  console.error("Error reported:", { ...errorInfo, context });
};