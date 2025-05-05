export const stage3PrototypePromptOverviewOnly = `
# ** BEGIN INSTRUCTIONS FOR LLM **


Respond with a high level summary of the changes to be made to the codebase to implement the user's AVS idea or design. Respond in text format, not in markdown.

**END OF INSTRUCTIONS FOR LLM**
`;

export const stage3PrototypePromptDetailedCodeGeneration = `
# ** BEGIN INSTRUCTIONS FOR LLM **

Your Primary task:  your job is to generate the the code needed to  implement their use case using the Hello World AVS codebase in Typescript. You can implement any of the following components as needed:
- Modified ServiceManager contract and deploy code.
- Modified Operator code.
- Modified README.md file.

**END OF INSTRUCTIONS FOR LLM**
`;

/**
If you are less than 50% confident that the user's AVS idea can be implemented with EigenLayer hello-world-avs code, then respond with a message to the user explaining that you are not confident that the idea can be implemented with EigenLayer hello-world-avs code, include your confidence score and give specific reasons why.

If you are more than 50% confident that the user's AVS idea can be implemented with EigenLayer hello-world-avs code, then proceed with the following steps.
*/


/**
export const stage3PrototypePromptLLMGuidanceFull = `
# Instructions for llm:

Dear LLM - use the following prompts to guide you in implementing the the prototype Autonomous Verifiable Service (AVS) on EigenLayer.

Your Primary task:  your job is to to first determine a confidence on how likely the user's AVS idea can be implemented with EigenLayer hello-world-avs code.

If you are less than 50% confident that the user's AVS idea can be implemented with EigenLayer hello-world-avs code, then respond with a message to the user explaining that you are not confident that the idea can be implemented with EigenLayer hello-world-avs code, include your confidence score and give specific reasons why.

If you are more than 50% confident that the user's AVS idea can be implemented with EigenLayer hello-world-avs code, then proceed with the following steps.

## Last Step:Generate Code
Generate only the code for hello-world-avs needed to implement the user's AVS idea or design.
Important: each file generated should be returned as child elements in a JSON object. Each child element should have the following format:
{
  "fileName": "filename.ts",
  "fileContent": "file content"
}

Do not generate your own Recommendations, Limitations or Next Steps.

The full codebase for hello-world-avs will be provided next in these instructions.


### 1. ServiceManager Smart Contracts

contracts/HelloWorldServiceManager.sol and contracts/IHelloWorldServiceManager.sol.
  - Modify the primary AVS Service Manager contract to fit the logic of the new AVS. 
  - Rename the contract to match the name of the user's AVS idea or design.
  - Include the logic to track registered operators, assign tasks if necessary, and verify results.
  - If needed: define relevant data structures, events, and helper functions.  
  - If needed: add modifiers/functions that implement your custom validation approach. 
  - Do not generate code for Slashing.

### 2. Operator Typescript Code

All Operator code should be written in TypeScript.
- Use the  folder. 
- Modify the /operator/index.ts file to represent the offchain Operator logic.
- Include any necessary libraries or frameworks for your computation.
- Operator Workflow:  
  1. Initialization: Connect to the smart contract and register.  
  2. Task Subscription: Subscribe to events (e.g., new tasks available).  
  3. Compute: Perform the required computation or verification.  
  4. Result Submission: Post results on-chain (or via a designated off-chain aggregator that eventually writes on-chain).  
- You may also create additional files to represent the Verification logic.

### 3. README

Modify the README.md file at the root of your repository to include:
1. Project Overview: Brief explanation of what the AVS does.  
2. Installation Instructions: Prerequisites, environment variables, and libraries.  
3. How to Run the Operator Binaries:  
   - Steps to compile or install any dependencies.  
   - How to start the binary and configure it.




`; 
 */