// URL constants for fetching context data
const EIGENLAYER_DOCS_OVERVIEW_URL = 'https://af52o4jcdfzphbst.public.blob.vercel-storage.com/context/repomix-output-eigenlayer-docs-overview-min-wtABuLj3MuRM9JklyGY2tt8v6gPJNY.md';
const EIGENLAYER_MIDDLEWARE_DOCS_URL = 'https://af52o4jcdfzphbst.public.blob.vercel-storage.com/context/repomix-output-eigenlayer-middleware-docs-Hz9TpntXTCiddC0ilxAJq2ztglt8DI.md';

// Cache variables to store fetched data
let eigenLayerDocsCache: string | null = null;
let eigenLayerDocsMiddlewareCache: string | null = null;

/**
 * Fetches the EigenLayer docs overview, using a cached version if available.
 */
export async function fetchEigenLayerDocsOverview(): Promise<string> {
  // Return cached docs if available
  if (eigenLayerDocsCache) {
    return eigenLayerDocsCache;
  }

  try {
    const response = await fetch(EIGENLAYER_DOCS_OVERVIEW_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch EigenLayer docs: ${response.statusText}`);
    }
    const eigenLayerDocsOverview = await response.text();
      
    // Cache the docs for future use
    eigenLayerDocsCache = eigenLayerDocsOverview;
    
    return eigenLayerDocsOverview;
  } catch (error) {
    console.error("Error fetching EigenLayer docs:", error);
    // Return a descriptive error message or rethrow, depending on desired error handling
    return 'Error loading EigenLayer documentation.'; 
  }
}

/**
 * Fetches the EigenLayer middleware docs, using a cached version if available.
 */
export async function fetchEigenLayerDocsMiddleware(): Promise<string> {
  // Return cached docs if available
  if (eigenLayerDocsMiddlewareCache) {
    return eigenLayerDocsMiddlewareCache;
  }

  try {
    const response = await fetch(EIGENLAYER_MIDDLEWARE_DOCS_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch EigenLayer middleware docs: ${response.statusText}`);
    }
    const eigenLayerDocsMiddleware = await response.text();

    // Cache the docs for future use
    eigenLayerDocsMiddlewareCache = eigenLayerDocsMiddleware;

    return eigenLayerDocsMiddleware;
  } catch (error) {
    console.error("Error fetching EigenLayer middleware docs:", error);
    // Return a descriptive error message or rethrow
    return 'Error loading EigenLayer middleware documentation.'; 
  }
} 