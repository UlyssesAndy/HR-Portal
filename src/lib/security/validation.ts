/**
 * Input validation and sanitization utilities
 */

import { z } from "zod";

/**
 * Common validation schemas
 */
export const schemas = {
  // Email validation
  email: z.string().email().toLowerCase().trim(),
  
  // UUID validation
  uuid: z.string().uuid(),
  
  // Safe string (no HTML/script injection)
  safeString: z.string()
    .transform(s => s.trim())
    .transform(s => s.replace(/<[^>]*>/g, '')) // Strip HTML tags
    .transform(s => s.replace(/javascript:/gi, '')) // Remove javascript: protocol
    .transform(s => s.replace(/on\w+=/gi, '')), // Remove event handlers
  
  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  
  // Search query
  searchQuery: z.string()
    .max(200)
    .transform(s => s.trim())
    .transform(s => s.replace(/[<>]/g, '')), // Remove angle brackets
  
  // Phone number (basic)
  phone: z.string()
    .regex(/^[\d\s\-+()]+$/, "Invalid phone format")
    .max(20)
    .optional(),
  
  // URL validation
  url: z.string().url().optional(),
};

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and parse request body with schema
 */
export async function validateBody<T extends z.ZodSchema>(
  request: Request,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error.issues.map((e) => `${String(e.path.join('.'))}: ${e.message}`).join(', '),
      };
    }
    
    return { success: true, data: result.data };
  } catch (e) {
    return { success: false, error: 'Invalid JSON body' };
  }
}

/**
 * Validate query parameters
 */
export function validateQuery<T extends z.ZodSchema>(
  searchParams: URLSearchParams,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  const result = schema.safeParse(params);
  
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues.map((e) => `${String(e.path.join('.'))}: ${e.message}`).join(', '),
    };
  }
  
  return { success: true, data: result.data };
}

/**
 * Check for suspicious patterns in input
 */
export function detectSuspiciousInput(input: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:/i,
    /vbscript:/i,
    /expression\s*\(/i,
    /url\s*\(/i,
    /\beval\s*\(/i,
    /\bdocument\./i,
    /\bwindow\./i,
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
}

/**
 * SQL injection pattern detection (basic)
 */
export function detectSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/i,
    /--/,
    /;.*\b(SELECT|INSERT|UPDATE|DELETE|DROP)\b/i,
    /'\s*OR\s*'1'\s*=\s*'1/i,
    /'\s*OR\s*1\s*=\s*1/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}
