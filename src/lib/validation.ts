import { z } from "zod";

// Common validation schemas
export const emailSchema = z.string().email("Email invalide");

export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .regex(/[A-Z]/, "Le mot de passe doit contenir une majuscule")
  .regex(/[0-9]/, "Le mot de passe doit contenir un chiffre");

export const projectNameSchema = z
  .string()
  .min(1, "Le nom est requis")
  .max(100, "Le nom ne peut pas dépasser 100 caractères");

export const promptSchema = z
  .string()
  .min(1, "Le prompt est requis")
  .max(2000, "Le prompt ne peut pas dépasser 2000 caractères");

// Form validation helper
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.reduce((acc, err) => {
      const path = err.path.join(".");
      acc[path] = err.message;
      return acc;
    }, {} as Record<string, string>);
    return { success: false as const, errors };
  }
  return { success: true as const, data: result.data };
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

// Validate and sanitize URL
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
  } catch {
    return null;
  }
  return null;
}

// Rate limiting helper
const rateLimits = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimits.get(key);

  if (!record || now > record.resetTime) {
    rateLimits.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export function clearRateLimit(key: string) {
  rateLimits.delete(key);
}