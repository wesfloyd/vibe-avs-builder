
# EigenLayer Vibe AVS Web App
>Idea to AVS in under 10 minutes

Forked from: https://vercel.com/templates/next.js/nextjs-ai-chatbot

## Features

- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance
- [AI SDK](https://sdk.vercel.ai/docs)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
  - Supports xAI (default), OpenAI, Fireworks, and other model providers
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence
  - [Neon Serverless Postgres](https://vercel.com/marketplace/neon) for saving chat history and user data
  - [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage
- [Auth.js](https://authjs.dev)
  - Simple and secure authentication


## Running locally

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
rm -rf node_modules
rm -rf .next/
pnpm install
pnpm next build

pnpm dev 
#or
pnpm next start
```

Your app template should now be running on [localhost:3000](http://localhost:3000).


# Task List

## Todo

1. Landing Page Updates:
  - Modify greeting component to match "What would you like to validate?" prompt
  - Add subtitle "Enter your idea for an AVS"
  - Add links to EigenLayer AVS documentation and tutorial videos
  - Update page metadata/title to reflect EigenLayer AVS Builder

3. Stage-Based UI Components:
  - Create Progress Indicator/Timeline component
  - Develop Asset Library sidebar/panel for storing generated assets
  - Add stage selector component

4. Stage 1: Idea Refinement Implementation:
  - Create custom prompts for AVS idea evaluation
  - Build rating component for idea feasibility
  - Implement name suggestion functionality
  - Store refined idea as an artifact

5. Stage 2: Design Generation:
  - Add image artifact for AVS logo generation
  - Create architecture diagram generation capability
  - Implement document artifact for AVS design specifications
  - Update UI to display AVS project name in title

6. Stage 3: Prototype Generation:
  - Enhance code artifact for complete prototype generation
  - Implement GitHub integration for repo creation
  - Add deployment information to artifacts
  - Create download functionality for generated code

8. Model Customization:
  - Update AI models and prompts for EigenLayer-specific context
  - Create specialized prompts for each stage

9. UI/UX Improvements:
  - Update theme/styling to reflect EigenLayer branding
  - Implement "open" user flow with guided LLM experience
  - Add stage-specific help content

10. General Architectural Changes:
  - Create specialized document templates for AVS components
  - Implement tools for validating AVS concepts

7. Marketing Integration:
  - Add CTA component for scheduling calls with EigenLayer
  - Implement conversion tracking

## Done