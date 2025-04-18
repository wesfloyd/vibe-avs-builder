

<div align="center">
<img src="public/images/app-logo.png" width="200" />
</div>

# EigenLayer Vibe AVS Web App
"Idea to Design to AVS in under 10 minutes"

**Screenshot**
<img width="500" alt="image" src="https://github.com/user-attachments/assets/f9abe5d6-1aa5-420e-801c-974b3f6dbe2c" />


**Demo Site**
[vibe-avs-builder.vercel.app](https://vibe-avs-builder.vercel.app/)


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


Note: this app was forked from [Vercel Next.js AI Chatbot](https://vercel.com/templates/next.js/nextjs-ai-chatbot)


# Task List

## Todo


8. Model Customization:
  - Update AI models and prompts for EigenLayer-specific context
  - Create specialized prompts for each stage

  
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

3. Maybe? Stage-Based UI Components:
  - Create Progress Indicator/Timeline component
  - Add stage selector component

7. Operational:
 - Find ways to separate Dev from Production database and data stores.


9. UI/UX Improvements:
  - Update theme/styling to reflect EigenLayer branding
  - Implement "open" user flow with guided LLM experience
  - Add stage-specific help content
  - Add "AVS Name" supplied or AI generated at the top after first user interaction. Note Vercel treats them as "Projects"
  - Add references to eigenlayer.xyz and docs site?


7. Marketing Integration:
  - Add CTA component for scheduling calls with EigenLayer
  - Implement conversion tracking




## Done

1. Landing Page Updates:
  - Modify greeting component to match "What would you like to validate?" prompt
  - Add subtitle "Enter your idea for an AVS"
  - Add links to EigenLayer AVS documentation and tutorial videos
  - Update page metadata/title to reflect EigenLayer AVS Builder

