
# EigenLayer Vibe AVS Web App
>Idea to AVS in under 10 minutes

<img width="500" alt="image" src="https://github.com/user-attachments/assets/f9abe5d6-1aa5-420e-801c-974b3f6dbe2c" />
  
[Demo site here](https://vibe-avs-builder.vercel.app/)
Forked from [Vercel Next.js AI Chatbot](https://vercel.com/templates/next.js/nextjs-ai-chatbot)


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



3. Stage-Based UI Components:
  - Create Progress Indicator/Timeline component
  - Develop Asset Library sidebar/panel for storing generated assets
  - Add stage selector component


4. Stage 1: Idea Refinement Implementation:
  - Create custom prompts for AVS idea evaluation
  - Build rating component for idea feasibility
  - Implement name suggestion functionality
  - Store refined idea as an artifact
  - Add Download button to download idea

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

7. Operational:
 - Find ways to separate Dev from Production database and data stores.

8. Model Customization:
  - Update AI models and prompts for EigenLayer-specific context
  - Create specialized prompts for each stage

9. UI/UX Improvements:
  - Update theme/styling to reflect EigenLayer branding
  - Implement "open" user flow with guided LLM experience
  - Add stage-specific help content
  - Add "AVS Name" supplied or AI generated at the top after first user interaction. Note Vercel treats them as "Projects"

10. General Architectural Changes:
  - Create specialized document templates for AVS components
  - Implement tools for validating AVS concepts

7. Marketing Integration:
  - Add CTA component for scheduling calls with EigenLayer
  - Implement conversion tracking



## Done

1. Landing Page Updates:
  - Modify greeting component to match "What would you like to validate?" prompt
  - Add subtitle "Enter your idea for an AVS"
  - Add links to EigenLayer AVS documentation and tutorial videos
  - Update page metadata/title to reflect EigenLayer AVS Builder


Build optimizations:

  1. Added SWC compiler configuration in next.config.ts
  2. Added typescript-to-proptypes-ignore to tsconfig.json
  3. Created .swcrc file with optimal settings
  4. Added vercel.json with build cache configuration
  5. Optimized database migrations to skip when unchanged