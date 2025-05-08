import type { UIMessage } from 'ai';
import type { Session } from 'next-auth';

// External libraries
import { ChatAnthropic } from "@langchain/anthropic";
import { AIMessage, AIMessageChunk, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";

// Internal absolute imports
import { logContentForDebug, logStreamForDebug } from '@/lib/utils/debugUtils';

// Internal relative imports
import { classifyUserIntent } from './intentManager';
import { UserIntent } from './types';
import { basicPrompt, stage1IdeasPrompt, stage2DesignPrompt, stage3PrototypePromptTaskList, stage3PrototypePromptCodeGeneration } from './prompts';
import { generateZipFromJSON, validateCodeProjectJSON } from '../code/generate-zip';


interface ExecuteChatStreamParams {
  dataStream: any; // Using 'any' for now as CoreDataStream seems incorrect
  session: Session;
  messages: UIMessage[];
  selectedChatModel: string;
  systemPrompt: string;
  userMessage: UIMessage;
  id: string; // chat id
  isProductionEnvironment: boolean;
}

// Convert UI messages to LangChain message format
function convertUIMessagesToLangChainMessages(messages: UIMessage[]) {
  return messages.map(message => {
    const content = typeof message.content === 'string' 
      ? message.content 
      : JSON.stringify(message.content);
      
    if (message.role === 'user') {
      return new HumanMessage(content);
    } else if (message.role === 'assistant') {
      return new AIMessage(content);
    }
    // Skip system messages as we'll add a separate system message
    return null;
  }).filter((message): message is HumanMessage | AIMessage => message !== null); // Type guard to remove null values
}


// Get the appropriate LLM model based on selected chat model
function getModelProvider(selectedChatModel?: string) {
  console.log('chat-stream-executor: Using model:', selectedChatModel);
  
  if (!selectedChatModel) {
    selectedChatModel = 'gemini';
  }

  switch(selectedChatModel) {
    case 'claude':
      return new ChatAnthropic({
        streaming: true,
        model: "claude-3-7-sonnet-latest",
      });
    case 'chatgpt':
      return new ChatOpenAI({
        streaming: true,
        model: "gpt-4o-mini",
      });
    case 'gemini':
      return new ChatGoogleGenerativeAI({
        streaming: true,
        model: "gemini-2.5-pro-preview-03-25",
      });
    default:
      console.log('Unknown model, defaulting to ChatGPT');
      return new ChatOpenAI({
        streaming: true,
        model: "gpt-4o-mini",
      });
  }
}

function concatStreams<T>(stream1: ReadableStream<T>, stream2: ReadableStream<T>): ReadableStream<T> {
  return new ReadableStream<T>({
    async start(controller) {
      // Helper to pipe a stream into the controller
      async function pipeStream(stream: ReadableStream<T>) {
        const reader = stream.getReader();
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } finally {
          reader.releaseLock();
        }
      }
      // Pipe first stream, then second stream
      await pipeStream(stream1);
      await pipeStream(stream2);
      controller.close();
    }
  });
}

export async function generateStreamingLLMResponse(
  messages: UIMessage[], 
  selectedChatModel?: string,
  initialIntent?: UserIntent
) {

  console.log('chat-stream-executor: initialIntent provided:', initialIntent ?? 'no initial intent provided');
  // Determine intent: Use initialIntent if provided, otherwise classify
  let intent: UserIntent;
  if (initialIntent) {
    intent = initialIntent;
  } else {
    intent = await classifyUserIntent(messages);
  }
  console.log('chat-stream-executor: intent used:', intent);
  

  // Set the system prompt based on the user intent using explicit if-else
  let systemPrompt = basicPrompt;
  if (intent === UserIntent.RefineIdea) {
    systemPrompt = await stage1IdeasPrompt();
  } else if (intent === UserIntent.GenerateDesign) {
    systemPrompt = await stage2DesignPrompt();
  } else if (intent === UserIntent.GenerateTaskList) {
    systemPrompt = await stage3PrototypePromptTaskList();
  } else if (intent === UserIntent.GenerateCode) {
    systemPrompt = await stage3PrototypePromptCodeGeneration();
  } // else, keep the basicPrompt

  logContentForDebug(systemPrompt, `chat-stream-executor-system-prompt.txt`, 'Chat Stream Executor - System Prompt');

  try {
    
    // Prepend system prompt to the message history
    // Convert UI messages to LangChain format

    const messageHistory = [
      new SystemMessage(systemPrompt),
      ...convertUIMessagesToLangChainMessages(messages)
    ];
    
    // Get the current model to use
    const selectedModelProvider = getModelProvider(selectedChatModel);

    // Get the raw stream from the model
    let llmResponseStream: ReadableStream<any>;
    if (intent === UserIntent.GenerateCode) {
      
      // TODO invoke model to generate the code project json
      const codeProjectJSON = tempCodeProjectJSON;
      
      // Generate the zip file from the JSON
      let responseText;
      try {
        await validateCodeProjectJSON(codeProjectJSON);
        responseText = 'Please download your project code here:\n [AVS Project Download Link]('
        + await generateZipFromJSON(codeProjectJSON)
        + ')';
      } catch (err) {
        responseText = "Unable to generate downloadable project code due to llm response json formatting error";
      }
      
      llmResponseStream = new ReadableStream({
        start(controller) {
          controller.enqueue(responseText);
          controller.close();
        }
      });
    } else {
      llmResponseStream = await selectedModelProvider.stream(messageHistory);
    }
    
    const [llmResponseStreamCopy1, llmResponseStreamCopy2] = llmResponseStream.tee();
    // log the stream copy without holding up your response
    logStreamForDebug(
      llmResponseStreamCopy1, 
      `llm-stream-${Date.now()}.txt`,
      'Raw LLM response'
    );


    return llmResponseStreamCopy2;

    // const stringStream = new ReadableStream({
    //   start(controller) {
    //     controller.enqueue("Starting to generate your response now");
    //     controller.close();
    //   }
    // });
    //const combinedStream = concatStreams(stringStream, llmResponseStream);
    //const combinedStream = concatStreams(streamA, streamB);
    //return combinedStream;
    
    
    
    // const appendedStream = new ReadableStream({
    //   async start(controller) {
    //     let llmResponseText:string = '';
    //     const reader = llmResponseStream.getReader();
    //     try {
    //       while (true) {
    //         const { value, done } = await reader.read();
    //         if (done) break;
    //         llmResponseText += value.content;
    //         controller.enqueue(value);
    //       }
          
    //       logContentForDebug(llmResponseText, `llm-stream-${Date.now()}.txt`, 'LLM response text');
    //       const customSystemPrompt = await stage3PrototypePromptCodeGeneration();
    //       const invokeMessages = [new SystemMessage(customSystemPrompt), new AIMessage(llmResponseText)];
    //       const response = await modelToUse.invoke(invokeMessages);
    //       controller.enqueue(response);
          
    //       controller.close();
    //     } catch (err) {
    //       controller.error(err);
    //     }
    //   }
    // });
    //return appendedStream;

  } catch (error) {
    console.error("LLM response generation failed:", error);
    throw error; // Rethrow to be handled by the POST handler
  }
}






const tempCodeProjectJSON = `
[
  {
    "path": "contracts/src/CatImageServiceManager.sol",
    "summary": "Implements the Cat Image Service Manager contract where tasks for generating and verifying cat images are managed.",
    "content": "// SPDX-License-Identifier: UNLICENSED\\npragma solidity ^0.8.9;\\n\\nimport {ECDSAServiceManagerBase} from \\\"@eigenlayer-middleware/src/unaudited/ECDSAServiceManagerBase.sol\\\";\\nimport {IServiceManager} from \\\"@eigenlayer-middleware/src/interfaces/IServiceManager.sol\\\";\\nimport {IImageServiceManager} from \\\"./IImageServiceManager.sol\\\";\\n\\ncontract CatImageServiceManager is ECDSAServiceManagerBase, IImageServiceManager {\\n    uint32 public latestTaskNum;\\n    mapping(uint32 => Task) public allTasks;\\n    mapping(uint32 => address[]) public taskVerifiers;\\n\\n    struct Task {\\n        string catImageUrl;\\n        uint32 createdBlock;\\n        uint32 verificationThreshold;\\n        uint32 verifiedCount;\\n    }\\n\\n    constructor(\\n        address _avsDirectory,\\n        address _stakeRegistry,\\n        address _rewardsCoordinator,\\n        address _delegationManager,\\n        address _allocationManager\\n    )\\n        ECDSAServiceManagerBase(\\n            _avsDirectory,\\n            _stakeRegistry,\\n            _rewardsCoordinator,\\n            _delegationManager,\\n            _allocationManager\\n        ) {}\\n\\n    function createCatImageTask(string memory imageUrl) external returns (Task memory) {\\n        Task memory newTask = Task(imageUrl, uint32(block.number), 90, 0);\\n        allTasks[latestTaskNum] = newTask;\\n        emit NewTaskCreated(latestTaskNum, newTask);\\n        latestTaskNum++;\\n        return newTask;\\n    }\\n\\n    function verifyCatImage(uint32 taskIndex, bool isCatImage) external {\\n        require(taskIndex < latestTaskNum, \\\"Task does not exist\\\");\\n        Task storage task = allTasks[taskIndex];\\n        taskVerifiers[taskIndex].push(msg.sender);\\n\\n        if (isCatImage) {\\n            task.verifiedCount++;\\n        }\\n\\n        if (task.verifiedCount >= task.verificationThreshold) {\\n            emit TaskVerified(taskIndex, task);\\n        }\\n    }\\n\\n    // Event emitted when a new task is created\\n    event NewTaskCreated(uint32 indexed taskIndex, Task task);\\n    // Event emitted when a task is verified\\n    event TaskVerified(uint32 indexed taskIndex, Task task);\\n}"
  },
  {
    "path": "contracts/src/IImageServiceManager.sol", 
    "summary": "Interface for Cat Image Service Manager contract outlining the core functionalities.",
    "content": "// SPDX-License-Identifier: UNLICENSED\\npragma solidity ^0.8.9;\\n\\ninterface IImageServiceManager {\\n    struct Task {\\n        string catImageUrl;\\n        uint32 createdBlock;\\n        uint32 verificationThreshold;\\n        uint32 verifiedCount;\\n    }\\n\\n    function createCatImageTask(string memory imageUrl) external returns (Task memory);\\n    function verifyCatImage(uint32 taskIndex, bool isCatImage) external;\\n    event NewTaskCreated(uint32 indexed taskIndex, Task task);\\n    event TaskVerified(uint32 indexed taskIndex, Task task);\\n}"
  },
  {
    "path": "contracts/test/CatImageServiceManager.t.sol",
    "summary": "Unit tests for the Cat Image Service Manager contract to ensure tasks are created and verified correctly.",
    "content": "// SPDX-License-Identifier: UNLICENSED\\npragma solidity ^0.8.12;\\n\\nimport {CatImageServiceManager} from \\\"../src/CatImageServiceManager.sol\\\";\\nimport {Test} from \\\"forge-std/Test.sol\\\";\\n\\ncontract CatImageServiceManagerTest is Test {\\n    CatImageServiceManager serviceManager;\\n\\n    function setUp() public {\\n        serviceManager = new CatImageServiceManager(\\n            0x1234567890123456789012345678901234567890,\\n            0x1234567890123456789012345678901234567890,\\n            0x1234567890123456789012345678901234567890,\\n            0x1234567890123456789012345678901234567890,\\n            0x1234567890123456789012345678901234567890\\n        );\\n    }\\n\\n    function testCreateCatImageTask() public {\\n        string memory imageUrl = \\\"https://example.com/cat.jpg\\\";\\n        CatImageServiceManager.Task memory task = serviceManager.createCatImageTask(imageUrl);\\n        assertEq(task.catImageUrl, imageUrl, \\\"Cat image URL should match\\\");\\n    }\\n\\n    function testVerifyCatImage() public {\\n        string memory imageUrl = \\\"https://example.com/cat.jpg\\\";\\n        serviceManager.createCatImageTask(imageUrl);\\n        serviceManager.verifyCatImage(0, true);\\n        assertEq(serviceManager.allTasks(0).verifiedCount, 1, \\\"Verified count should increment\\\");\\n    }\\n}"
  },
  {
    "path": "contracts/config/hello-world/31337.json",
    "summary": "Configuration for deploying the Cat Image Service on a test network.",
    "content": "{\\n  \\\"addresses\\\": {\\n    \\\"rewardsOwner\\\": \\\"0xYourRewardsOwnerAddress\\\",\\n    \\\"rewardsInitiator\\\": \\\"0xYourRewardsInitiatorAddress\\\"\\n  },\\n  \\\"keys\\\": {\\n    \\\"rewardsOwner\\\": \\\"0xYourRewardsOwnerKey\\\",\\n    \\\"rewardsInitiator\\\": \\\"0xYourRewardsInitiatorKey\\\"\\n  }\\n}"
  },
  {
    "path": "README.md",
    "summary": "Updated README file to include information about the Cat Image Service AVS.",
    "content": "# Cat Image AVS\\n\\nThis project showcases a simple AVS that generates cat images and allows a group of Operators to verify whether the likelihood of an image meeting a specified threshold (90%) as being a cat image.\\n\\n## Overview\\n1. **Task Creation**: Generate a task for creating a new cat image.\\n2. **Verification**: Have registered Operators verify the image and submit their assessments.\\n3. **Consensus**: Once enough verifications have been received, the task is marked as verified.\\n\\n## Local Development\\n- Follow instructions for setting up the environment and deploying contracts as documented.\\n\\n## Deploying\\nTo deploy the Cat Image AVS:\\n1. Setup the configuration files in contracts/config/hello-world/31337.json.\\n2. Build and deploy the contracts using the provided scripts.\\n3. Interact with the service using the deployed CatImageServiceManager.\\n\\n## Contributing\\nContributions are welcome! Please create an issue or a pull request for any enhancements or bug fixes."
  }
]
`;
