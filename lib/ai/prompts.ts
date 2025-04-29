import type { ArtifactKind } from '@/components/artifact';
import { eigenBasicsDoc } from './context/eigenBasics';
import { stage3PrototypePromptLLMGuidanceTaskPlan, stage3PrototypePromptLLMGuidanceFull } from './prompts/stage3-prototype-code-generation';
import { stage12CombinedPromptLLMGuidance } from './prompts/stage12-combined';
import { fetchEigenLayerDocsMiddleware, fetchHelloWorldAVSCodeMin } from './context/loadContext';
import { fetchEigenLayerDocsOverview } from './context/loadContext';
import { stage1IdeaRefinementPromptLLMGuidance } from './prompts/stage1-idea-refinement';
import { stage2DesignGenerationPromptText } from './prompts/stage2-design-generation';


export const basicPrompt =
  'You are a friendly EigenLayer Solution Engineer assistant! Keep your responses concise and helpful.'
  + `Help the user with each stage of their AVS development journey. Encourage them to move to the next stage when they are ready.
  - Stage 1: Refine their AVS idea
  - Stage 2: Generate their AVS Design Tech Spec
  - Stage 3: Generate their AVS Prototype code
  `;
  

// Cache for the generated prompts
let stage1IdeasPromptCache: string | null = null;
let stage2DesignPromptCache: string | null = null;
let stage3PrototypePromptCache: string | null = null;

// Synchronous function that returns the cached prompt or initiates a fetch
export const stage1IdeasPrompt = (): string => {
  // If we have a cached prompt, return it immediately
  if (stage1IdeasPromptCache) {
    return stage1IdeasPromptCache;
  }

  // If no cache exists, generate a basic prompt immediately
  const basicPromptText = stage1IdeaRefinementPromptLLMGuidance 
    + '# And you can use the following EigenLayer documentation for additional context:'
    + eigenBasicsDoc;
  
  // Start background fetch to update the cache for next time
  (async () => {
    try {
      console.log('prompts: generating stage 1 ideas prompt in background');
      const eigenLayerDocsOverview = await fetchEigenLayerDocsOverview();
      
      // Create the full prompt with fetched data
      const fullPrompt = stage1IdeaRefinementPromptLLMGuidance 
        + '# And you can use the following EigenLayer documentation for additional context:'
        + eigenBasicsDoc
        + '# And you can use the following EigenLayer docs overview for additional context:'
        + eigenLayerDocsOverview;
      
      // Update the cache
      stage1IdeasPromptCache = fullPrompt;
    } catch (error) {
      console.error("Error constructing stage 1 ideas prompt in background:", error);
      // On error, we still have the basic prompt cached, so no need to update
    }
  })();
  
  // Return the basic prompt immediately
  return basicPromptText;
};

// Custom prompt for Stage 2: AVS idea refinement
export const stage2DesignPrompt = (): string => {
  // If we have a cached prompt, return it immediately
  if (stage2DesignPromptCache) {
    return stage2DesignPromptCache;
  }

  // If no cache exists, generate a basic prompt immediately
  const basicPromptText = stage2DesignGenerationPromptText 
    + '# And you can use the following EigenLayer documentation for additional context:'
    + eigenBasicsDoc;
  
  // Start background fetch to update the cache for next time
  (async () => {
    try {
      console.log('prompts: generating stage 2 design prompt in background');
      const eigenLayerDocsMiddleware = await fetchEigenLayerDocsMiddleware();
      
      // Create the full prompt with fetched data
      const fullPrompt = stage2DesignGenerationPromptText
        + '# And you can use the following EigenLayer documentation for additional context:'
        + eigenBasicsDoc
        + '# And you can use the following EigenLayer middleware overview for additional context:'
        + eigenLayerDocsMiddleware;
      
      // Update the cache
      stage2DesignPromptCache = fullPrompt;
    } catch (error) {
      console.error("Error constructing stage 2 design prompt in background:", error);
      // On error, we still have the basic prompt cached, so no need to update
    }
  })();
  
  // Return the basic prompt immediately
  return basicPromptText;
};


// Custom prompt for Stage 3: AVS code generation
export const stage3PrototypePrompt = (): string => {
  // If we have a cached prompt, return it immediately
  if (stage3PrototypePromptCache) {
    return stage3PrototypePromptCache;
  }

  // If no cache exists, generate a basic prompt immediately
  const basicPromptText = stage3PrototypePromptLLMGuidanceFull
    + '# And you can use the following EigenLayer documentation for additional context:'
    + eigenBasicsDoc;
  
  // Start background fetch to update the cache for next time
  (async () => {
    try {
      console.log('prompts: generating stage 3 code prompt in background');
      
      const eigenLayerDocsMiddleware = await fetchEigenLayerDocsMiddleware();
      const helloWorldAVSCodeMin = await fetchHelloWorldAVSCodeMin();

      // Create the full prompt with fetched data
      const fullPrompt = stage3PrototypePromptLLMGuidanceFull
        + '# And you can use the following Hello World AVS code for additional context:'
        + helloWorldAVSCodeMin 
        + '# And you can use the following EigenLayer documentation for additional context:'
        + eigenBasicsDoc
        + '# And you can use the following EigenLayer middleware overview for additional context:'
        + eigenLayerDocsMiddleware;
      
      // Update the cache
      stage3PrototypePromptCache = fullPrompt;
    } catch (error) {
      console.error("Error constructing stage 3 code prompt in background:", error);
      // On error, we still have the basic prompt cached, so no need to update
    }
  })();
  
  // Return the basic prompt immediately
  return basicPromptText;
};



export const determineFeasibilityPrompt = `
You are a friendly EigenLayer Solution Engineer assistant! Keep your responses concise and helpful.

Your Primary task:  your job is to to first determine a confidence on how likely the user's AVS idea can be implemented with EigenLayer hello-world-avs code.

If you are less than 50% confident that the user's AVS idea can be implemented with EigenLayer hello-world-avs code, then respond with a message to the user explaining that you are not confident that the idea can be implemented with EigenLayer hello-world-avs code, include your confidence score and give specific reasons why.

If you are more than 50% confident that the user's AVS idea can be implemented with EigenLayer hello-world-avs code, then proceed with the following steps.
`;


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



