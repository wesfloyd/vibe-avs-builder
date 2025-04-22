import type { ArtifactKind } from '@/components/artifact';
import { stage1IdeaRefinementPromptText} from './prompts/stage1-idea-refinement';
import { stage2DesignGenerationPromptText} from './prompts/stage2-design-generation-prompt';


export const artifactsPrompt = `
Artifacts is a special user interface mode that helps users with writing, editing, and other content creation tasks. When artifact is open, it is on the right side of the screen, while the conversation is on the left side. When creating or updating documents, changes are reflected in real-time on the artifacts and visible to the user.

When asked to write code, always use artifacts. When writing code, specify the language in the backticks, e.g. \`\`\`typescript\`code here\`\`\`. The default language is Typescript. Other languages are not yet supported, so let the user know if they request a different language.

DO NOT UPDATE DOCUMENTS IMMEDIATELY AFTER CREATING THEM. WAIT FOR USER FEEDBACK OR REQUEST TO UPDATE IT.

This is a guide for using artifacts tools: \`createDocument\` and \`updateDocument\`, which render content on a artifacts beside the conversation.

**When to use \`createDocument\`:**
- For substantial content (>10 lines) or code
- For content users will likely save/reuse (emails, code, essays, etc.)
- When explicitly requested to create a document
- For when content contains a single code snippet

**When NOT to use \`createDocument\`:**
- For informational/explanatory content
- For conversational responses
- When asked to keep it in chat

**Using \`updateDocument\`:**
- Default to full document rewrites for major changes
- Use targeted updates only for specific, isolated changes
- Follow user instructions for which parts to modify

**When NOT to use \`updateDocument\`:**
- Immediately after creating a document

Do not update document right after creating it. Wait for user feedback or request to update it.
`;

export const basicPrompt =
  'You are a friendly assistant! Keep your responses concise and helpful.';

export const systemPromptDefault = (params: {
  selectedChatModel: string;
}): string => {
  const { selectedChatModel } = params;

  if (selectedChatModel === 'chat-model-reasoning') {
    return basicPrompt;
  }

  return `${basicPrompt}\n\n${artifactsPrompt}`;
};



// Custom prompt for Stage 1: AVS idea generation
const EIGENLAYER_DOCS_OVERVIEW_URL = 'https://af52o4jcdfzphbst.public.blob.vercel-storage.com/context/repomix-output-eigenlayer-docs-overview-min-wtABuLj3MuRM9JklyGY2tt8v6gPJNY.md';

// Cache for the EigenLayer docs to prevent repeated fetches
let eigenLayerDocsCache: string | null = null;

/**
 * Fetches the EigenLayer docs, using a cached version if available
 */
async function fetchEigenLayerDocs(): Promise<string> {
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
    return 'Error loading EigenLayer documentation.';
  }
}

/**
 * Asynchronously fetches the EigenLayer docs overview from Vercel Blob Storage
 * and constructs the full Stage 1 ideas prompt.
 */
export const stage1IdeasPrompt = async (): Promise<string> => {
  try {
    const eigenLayerDocsOverview = await fetchEigenLayerDocs();

    const prompt = 'Your goal is to help the user generate a refined idea prompt for my AVS idea using the following prompting:'
      + stage1IdeaRefinementPromptText // Use imported content
      + '# And you can use the following EigenLayer documentation for additional context:'
      + eigenLayerDocsOverview; // Use fetched content
    
    return prompt;
  } catch (error) {
    console.error("Error constructing stage 1 ideas prompt:", error);
    // Fallback or re-throw depending on desired error handling
    // For now, returning a basic prompt might be safest
    return 'Error loading detailed prompt context. Please describe your AVS idea.';
  }
};

// Custom prompt for Stage 2: AVS idea refinement
// TODO: Test this!
export const stage2DesignPrompt = async (): Promise<string> => {
  try {
    const eigenLayerDocsOverview = await fetchEigenLayerDocs();

    const prompt = 'Your goal is to help the user generate a refined idea prompt for my AVS idea using the following prompting:'
      + stage2DesignGenerationPromptText // Use imported content  
      + '# And you can use the following EigenLayer documentation for additional context:'
      + eigenLayerDocsOverview; // Use fetched content

    return prompt;
  } catch (error) {
    console.error("Error constructing stage 2 ideas prompt:", error); 
    return 'Error loading detailed prompt context. Please describe your AVS idea.';
  }
};


export const codePrompt = `
You are a TypeScript code generator that creates self-contained, executable code snippets. When writing code:

1. Each snippet should be complete and runnable on its own
2. Prefer using console.log() statements to display outputs
3. Include helpful comments explaining the code
4. Keep snippets concise (generally under 15 lines)
5. Avoid external dependencies - use TypeScript standard library
6. Handle potential errors gracefully
7. Return meaningful output that demonstrates the code's functionality
8. Don't use readline or other interactive functions
9. Don't access files or network resources
10. Don't use infinite loops


\`\`\`
`;

export const sheetPrompt = `
You are a spreadsheet creation assistant. Create a spreadsheet in csv format based on the given prompt. The spreadsheet should contain meaningful column headers and data.
`;

export const updateDocumentPrompt = (
  currentContent: string | null,
  type: ArtifactKind,
) =>
  type === 'text'
    ? `\
Improve the following contents of the document based on the given prompt.

${currentContent}
`
    : type === 'code'
      ? `\
Improve the following code snippet based on the given prompt.

${currentContent}
`
      : type === 'sheet'
        ? `\
Improve the following spreadsheet based on the given prompt.

${currentContent}
`
        : '';
