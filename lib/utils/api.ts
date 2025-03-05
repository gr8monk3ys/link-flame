/**
 * API utilities for making fetch requests with enhanced features like retry logic
 */

/**
 * Options for fetch with retry
 */
export interface FetchWithRetryOptions extends RequestInit {
  /** Number of retry attempts (default: 3) */
  retries?: number;
  /** Base delay between retries in ms (default: 300) */
  backoff?: number;
  /** Whether to use exponential backoff (default: true) */
  exponential?: boolean;
  /** Custom retry condition (default: status >= 500) */
  retryCondition?: (response: Response) => boolean;
  /** Timeout in ms (default: 10000) */
  timeout?: number;
}

/**
 * Default retry condition - retry on server errors and network failures
 */
const defaultRetryCondition = (response: Response) => {
  return response.status >= 500;
};

/**
 * Fetch with retry logic for resilient API calls
 * 
 * @param url URL to fetch
 * @param options Fetch options with retry configuration
 * @returns Promise with the fetch response
 * 
 * @example
 * ```typescript
 * try {
 *   const response = await fetchWithRetry('/api/products', {
 *     method: 'GET',
 *     retries: 3,
 *     backoff: 500
 *   });
 *   
 *   if (response.ok) {
 *     const data = await response.json();
 *     // Handle success
 *   } else {
 *     // Handle error
 *   }
 * } catch (error) {
 *   // Handle exception
 * }
 * ```
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    backoff = 300,
    exponential = true,
    retryCondition = defaultRetryCondition,
    timeout = 10000,
    ...fetchOptions
  } = options;

  // Add timeout to fetch
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    // If the response is successful or we shouldn't retry, return it
    if (response.ok || !retryCondition(response) || retries <= 0) {
      return response;
    }

    // Otherwise, retry after a delay
    const delay = exponential ? backoff * Math.pow(2, 3 - retries) : backoff;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Recursive call with one less retry
    return fetchWithRetry(url, {
      ...options,
      retries: retries - 1,
    });
  } catch (error) {
    // If we have retries left and it's a network error, retry
    if (retries > 0 && error instanceof TypeError) {
      const delay = exponential ? backoff * Math.pow(2, 3 - retries) : backoff;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return fetchWithRetry(url, {
        ...options,
        retries: retries - 1,
      });
    }
    
    // Otherwise, rethrow the error
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch JSON data with retry logic
 * 
 * @param url URL to fetch
 * @param options Fetch options with retry configuration
 * @returns Promise with the parsed JSON data
 * 
 * @example
 * ```typescript
 * try {
 *   const data = await fetchJsonWithRetry('/api/products');
 *   // Handle data
 * } catch (error) {
 *   // Handle error
 * }
 * ```
 */
export async function fetchJsonWithRetry<T = any>(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(
      errorData.message || `API error: ${response.status} ${response.statusText}`
    );
    Object.assign(error, { status: response.status, data: errorData });
    throw error;
  }
  
  return response.json();
}
