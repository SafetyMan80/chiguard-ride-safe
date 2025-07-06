import DOMPurify from 'dompurify';

/**
 * Sanitizes user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Configure DOMPurify to be more restrictive
  const config = {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content
  };
  
  return DOMPurify.sanitize(input, config).trim();
};

/**
 * Sanitizes HTML content (for cases where some HTML is needed)
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  
  const config = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  };
  
  return DOMPurify.sanitize(html, config);
};

/**
 * Rate limiting for critical operations
 */
class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();

  canProceed(key: string, maxAttempts: number = 5, windowMs: number = 300000): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || now > record.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= maxAttempts) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingTime(key: string): number {
    const record = this.attempts.get(key);
    if (!record) return 0;
    
    return Math.max(0, record.resetTime - Date.now());
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Validates file uploads for security
 */
export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }
  
  // Check file extension matches MIME type
  const extension = file.name.toLowerCase().split('.').pop();
  const expectedExtensions: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp']
  };
  
  const validExtensions = expectedExtensions[file.type];
  if (!validExtensions || !extension || !validExtensions.includes(extension)) {
    return { valid: false, error: 'File extension does not match file type' };
  }
  
  return { valid: true };
};

/**
 * Validates location data
 */
export const validateLocation = (lat?: number, lng?: number): boolean => {
  if (lat === undefined || lng === undefined) return true; // Optional
  
  // Validate latitude and longitude ranges
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return false;
  }
  
  // Basic check for Chicago area (rough bounds)
  const chicagoBounds = {
    north: 42.5,
    south: 41.5,
    east: -87.0,
    west: -88.5
  };
  
  if (lat < chicagoBounds.south || lat > chicagoBounds.north || 
      lng < chicagoBounds.west || lng > chicagoBounds.east) {
    console.warn('Location appears to be outside Chicago area');
  }
  
  return true;
};