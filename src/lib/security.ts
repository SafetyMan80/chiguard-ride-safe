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
 * Enhanced server-side rate limiting
 */
import { supabase } from '@/integrations/supabase/client';

export const checkRateLimit = async (
  endpoint: string, 
  maxAttempts: number = 5, 
  windowMs: number = 300000
): Promise<{ allowed: boolean; remainingTime?: number }> => {
  try {
    const userIP = await getUserIP();
    const windowStart = new Date(Date.now() - windowMs);
    
    // Check current attempts in the time window
    const { data: rateLimitData, error } = await supabase
      .from('rate_limits')
      .select('request_count, blocked_until, window_start')
      .eq('endpoint', endpoint)
      .eq('ip_address', userIP)
      .gte('window_start', windowStart.toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Rate limit check error:', error);
      return { allowed: true }; // Fail open for availability
    }

    // Check if currently blocked
    if (rateLimitData?.blocked_until && new Date(rateLimitData.blocked_until) > new Date()) {
      const remainingTime = new Date(rateLimitData.blocked_until).getTime() - Date.now();
      return { allowed: false, remainingTime };
    }

    const currentCount = rateLimitData?.request_count || 0;
    
    if (currentCount >= maxAttempts) {
      // Block for the window duration
      const blockedUntil = new Date(Date.now() + windowMs);
      await supabase
        .from('rate_limits')
        .upsert({
          endpoint,
          ip_address: userIP,
          request_count: currentCount + 1,
          window_start: new Date().toISOString(),
          blocked_until: blockedUntil.toISOString()
        });
      
      return { allowed: false, remainingTime: windowMs };
    }

    // Increment counter
    await supabase
      .from('rate_limits')
      .upsert({
        endpoint,
        ip_address: userIP,
        request_count: currentCount + 1,
        window_start: rateLimitData?.window_start ? rateLimitData.window_start : new Date().toISOString(),
        blocked_until: null
      });

    return { allowed: true };
  } catch (error) {
    console.error('Rate limit error:', error);
    return { allowed: true }; // Fail open
  }
};

const getUserIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return '127.0.0.1'; // Fallback
  }
};

/**
 * Legacy client-side rate limiter for backward compatibility
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
 * Enhanced file upload validation with security checks
 */
export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  const suspiciousPatterns = [
    /\.php$/i, /\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.com$/i, /\.scr$/i, /\.pif$/i,
    /\.vbs$/i, /\.js$/i, /\.jar$/i, /\.html$/i, /\.htm$/i, /\.svg$/i
  ];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }
  
  if (file.size === 0) {
    return { valid: false, error: 'File cannot be empty' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, WebP images and PDF files are allowed' };
  }
  
  // Check for suspicious file patterns
  const fileName = file.name.toLowerCase();
  if (suspiciousPatterns.some(pattern => pattern.test(fileName))) {
    return { valid: false, error: 'File type not allowed for security reasons' };
  }
  
  // Check file extension matches MIME type
  const extension = fileName.split('.').pop();
  const expectedExtensions: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'application/pdf': ['pdf']
  };
  
  const validExtensions = expectedExtensions[file.type];
  if (!validExtensions || !extension || !validExtensions.includes(extension)) {
    return { valid: false, error: 'File extension does not match file type' };
  }
  
  // Check for double extensions (e.g., file.jpg.exe)
  const parts = fileName.split('.');
  if (parts.length > 2) {
    const penultimateExt = parts[parts.length - 2];
    if (suspiciousPatterns.some(pattern => pattern.test(`.${penultimateExt}`))) {
      return { valid: false, error: 'Suspicious file name detected' };
    }
  }
  
  // Basic magic number validation for images
  if (file.type.startsWith('image/')) {
    return validateImageMagicNumbers(file);
  }
  
  return { valid: true };
};

/**
 * Validates image files by checking magic numbers
 */
const validateImageMagicNumbers = (file: File): { valid: boolean; error?: string } => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) {
        resolve({ valid: false, error: 'Could not read file' });
        return;
      }
      
      const bytes = new Uint8Array(buffer.slice(0, 8));
      const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const validMagicNumbers: Record<string, string[]> = {
        'image/jpeg': ['ffd8ff'],
        'image/png': ['89504e47'],
        'image/webp': ['52494646'] // RIFF header
      };
      
      const expectedMagic = validMagicNumbers[file.type];
      if (expectedMagic && !expectedMagic.some(magic => hex.startsWith(magic))) {
        resolve({ valid: false, error: 'File content does not match file type' });
        return;
      }
      
      resolve({ valid: true });
    };
    reader.onerror = () => resolve({ valid: false, error: 'Could not read file' });
    reader.readAsArrayBuffer(file.slice(0, 8));
  }) as any; // Type assertion for synchronous return
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

/**
 * Enhanced security logging with threat detection
 */
export const logSecurityEvent = async (
  eventType: string,
  eventData?: any,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) => {
  try {
    const userIP = await getUserIP();
    
    await supabase.rpc('log_security_event', {
      _event_type: eventType,
      _event_data: eventData,
      _ip_address: userIP,
      _user_agent: navigator.userAgent
    });
    
    // Log to analytics for pattern analysis
    await supabase.rpc('track_event', {
      _event_type: 'security_event',
      _event_data: {
        security_event_type: eventType,
        severity,
        ip_address: userIP,
        ...eventData
      }
    });
    
    // Alert on critical events
    if (severity === 'critical') {
      console.warn(`🚨 Critical security event: ${eventType}`, eventData);
    }
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

/**
 * Monitor failed login attempts and detect suspicious patterns
 */
export const monitorFailedLogin = async (email?: string) => {
  try {
    const userIP = await getUserIP();
    const recentFailures = await supabase
      .from('security_logs')
      .select('created_at')
      .eq('event_type', 'FAILED_LOGIN')
      .eq('ip_address', userIP)
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
      .order('created_at', { ascending: false });

    const failureCount = recentFailures.data?.length || 0;
    
    await logSecurityEvent('FAILED_LOGIN', {
      email,
      ip_address: userIP,
      failure_count: failureCount + 1,
      user_agent: navigator.userAgent
    }, failureCount >= 3 ? 'high' : 'medium');
    
    // Block IP after multiple failures
    if (failureCount >= 5) {
      await logSecurityEvent('SUSPICIOUS_LOGIN_PATTERN', {
        email,
        ip_address: userIP,
        failure_count: failureCount + 1,
        action: 'ip_blocked'
      }, 'critical');
      
      // Update rate limit to block this IP
      await supabase
        .from('rate_limits')
        .upsert({
          endpoint: 'auth_login',
          ip_address: userIP,
          request_count: 100, // High count to trigger block
          window_start: new Date().toISOString(),
          blocked_until: new Date(Date.now() + 3600000).toISOString() // Block for 1 hour
        });
    }
    
    return { blocked: failureCount >= 5, failureCount: failureCount + 1 };
  } catch (error) {
    console.error('Failed to monitor login:', error);
    return { blocked: false, failureCount: 0 };
  }
};

/**
 * Detect and prevent credential stuffing attacks
 */
export const detectCredentialStuffing = async (email: string): Promise<boolean> => {
  try {
    const userIP = await getUserIP();
    const recentAttempts = await supabase
      .from('security_logs')
      .select('event_data')
      .eq('event_type', 'FAILED_LOGIN')
      .eq('ip_address', userIP)
      .gte('created_at', new Date(Date.now() - 1800000).toISOString()) // Last 30 minutes
      .order('created_at', { ascending: false })
      .limit(10);

    if (!recentAttempts.data) return false;
    
    // Count unique emails attempted from this IP
    const uniqueEmails = new Set(
      recentAttempts.data
        .map(log => {
          const eventData = log.event_data as any;
          return eventData?.email;
        })
        .filter(email => email)
    );
    
    // If trying many different emails from same IP, likely credential stuffing
    if (uniqueEmails.size >= 5) {
      await logSecurityEvent('CREDENTIAL_STUFFING_DETECTED', {
        ip_address: userIP,
        unique_emails_attempted: uniqueEmails.size,
        current_email: email
      }, 'critical');
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to detect credential stuffing:', error);
    return false;
  }
};

/**
 * Enhanced password strength validation
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) score += 1;
  else feedback.push('Password must be at least 8 characters long');
  
  if (password.length >= 12) score += 1;
  
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Include lowercase letters');
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Include uppercase letters');
  
  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Include numbers');
  
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push('Include special characters');
  
  // Check for common patterns
  const commonPatterns = [
    /(.)\1{2,}/, // Repeated characters
    /123456|abcdef|qwerty/i, // Common sequences
    /password|admin|login|welcome/i // Common words
  ];
  
  if (commonPatterns.some(pattern => pattern.test(password))) {
    score -= 2;
    feedback.push('Avoid common patterns and words');
  }
  
  return {
    isValid: score >= 4,
    score: Math.max(0, score),
    feedback
  };
};