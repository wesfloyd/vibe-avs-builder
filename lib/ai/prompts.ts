import type { ArtifactKind } from '@/components/artifact';
import { eigenBasicsDoc } from './context/eigenBasics';
import { stage3PrototypePromptLLMGuidanceTaskPlan, stage3PrototypePromptLLMGuidanceFull } from './prompts/stage3-prototype-code-generation';
import { stage12CombinedPromptLLMGuidance } from './prompts/stage12-combined';


export const basicPrompt =
  'You are a friendly EigenLayer Solution Engineer assistant! Keep your responses concise and helpful.'
  + `Help the user with each stage of their AVS development journey. Encourage them to move to the next stage when they are ready.
  - Stage 1: Refine their AVS idea
  - Stage 2: Generate their AVS Design Tech Spec
  - Stage 3: Generate their AVS Prototype code

  For Stage 3: simply respond with a task plan to implement their use case, do not generate any code.
  `;
  // Todo: modify Stage 3

export const systemPromptDefault = (params: {
  selectedChatModel: string;
}): string => {
  const { selectedChatModel } = params;

  /**
  if (selectedChatModel === 'chat-model-reasoning') {
    return basicPrompt;
  }
  */
  
  // Note: this is the core prompt sent to the LLM for the first stage of the chat.
  // todo: separate this prompt to provide smaller, conditional prompts based on the users intent, after integrating LangChain for intent detection. The current overloaded prompt is not ideal for performance and needs to be broken down into smaller, more manageable components.
  return `${basicPrompt}\n\n${stage12CombinedPromptLLMGuidance}\n\n${eigenBasicsDoc}\n\n${stage3PrototypePromptLLMGuidanceTaskPlan}`;

};


/**
  //Asynchronously fetches the EigenLayer docs overview from Vercel Blob Storage and constructs the full Stage 1 ideas prompt.
 
export const stage1IdeasPrompt = async (): Promise<string> => {
  try {
    console.log('Generating stage 1 ideas prompt');
    const eigenLayerDocsOverview = await fetchEigenLayerDocsOverview();

    const prompt = stage1IdeaRefinementPromptLLMGuidance // Use imported content
    + '# And you can use the following EigenLayer documentation for additional context:'
    + eigenBasicsDoc // Eigen Basics text
    
    return prompt;
  } catch (error) {
    console.error("Error constructing stage 1 ideas prompt:", error);
    // Fallback or re-throw depending on desired error handling
    // For now, returning a basic prompt might be safest
    return 'Error loading detailed prompt context. Please describe your AVS idea.';
  }
};

// Custom prompt for Stage 2: AVS idea refinement
export const stage2DesignPrompt = async (): Promise<string> => {
  try {
    console.log('Generating stage 2 design prompt');
    const eigenLayerDocsMiddleware = await fetchEigenLayerDocsMiddleware();

    const prompt = stage2DesignGenerationPromptText // Use imported content  
      + '# And you can use the following EigenLayer documentation for additional context:'
      + eigenBasicsDoc // Eigen Basics text
      + '# And you can use the following EigenLayer middleware overview for additional context:'
      + eigenLayerDocsMiddleware; // Use fetched content

    return prompt;
  } catch (error) {
    console.error("Error constructing stage 2 ideas prompt:", error); 
    return 'Error loading detailed prompt context. Please describe your AVS idea.';
  }
};


// Custom prompt for Stage 3: AVS code generation
export const stage3PrototypePrompt = async (): Promise<string> => {
  try {
    
    console.log('prompts: Generating stage 3 code prompt');
    
    const eigenLayerDocsMiddleware = await fetchEigenLayerDocsMiddleware();
    const helloWorldAVSCodeMin = await fetchHelloWorldAVSCodeMin();

    const prompt = stage3PrototypePromptLLMGuidanceFull // Use imported content
      + '# And you can use the following Hello World AVS code for additional context:'
      + helloWorldAVSCodeMin // Use fetched content 
      + '# And you can use the following EigenLayer documentation for additional context:'
      + eigenBasicsDoc // Eigen Basics text
      + '# And you can use the following EigenLayer middleware overview for additional context:'
      + eigenLayerDocsMiddleware // Use fetched content

    return prompt;
  } catch (error) {
    console.error("Error constructing stage 3 code prompt:", error);
    return 'Error loading detailed prompt context. Please describe your AVS idea.';
  }
};



export const determineFeasibilityPrompt = `
You are a friendly EigenLayer Solution Engineer assistant! Keep your responses concise and helpful.

Your Primary task:  your job is to to first determine a confidence on how likely the user's AVS idea can be implemented with EigenLayer hello-world-avs code.

If you are less than 50% confident that the user's AVS idea can be implemented with EigenLayer hello-world-avs code, then respond with a message to the user explaining that you are not confident that the idea can be implemented with EigenLayer hello-world-avs code, include your confidence score and give specific reasons why.

If you are more than 50% confident that the user's AVS idea can be implemented with EigenLayer hello-world-avs code, then proceed with the following steps.

`;
*/

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



/**
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
DO NOT UPDATE DOCUMENTS IMMEDIATELY AFTER CREATING THEM. WAIT FOR USER FEEDBACK OR REQUEST TO UPDATE IT.

**When NOT to use \`updateDocument\`:**
- Immediately after creating a document

Do not update document right after creating it. Wait for user feedback or request to update it.
`;

 */