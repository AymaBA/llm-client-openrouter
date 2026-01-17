# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LLM Client is a React-based chat application that interfaces with the OpenRouter API to provide access to various LLM models. It features streaming responses, conversation management, user profiles with personalized system prompts, customizable theming, **image generation**, **multimodal image input**, **reasoning/thinking display**, **full-featured model selector**, **custom projects (GPT-like contexts)**, and **web search integration**.

## Commands

- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Architecture

### State Management
All application state is centralized in `src/store/useStore.js` using Zustand with localStorage persistence (key: `llm-client-storage`). The store manages:
- API key and model selection
- Conversations (CRUD, active conversation tracking, **projectId association**, **webSearchEnabled**)
- Streaming state (content, reasoning, images, **citations**) and abort controller
- User profile settings (name, language, communication style, accent color, **webSearchMaxResults**)
- Favorite models list
- **Projects** (custom GPT-like contexts with system prompts and context files)
- **Web search** (per-conversation toggle, citations tracking)
- Import/export functionality

### API Integration
`src/services/openrouter.js` handles all OpenRouter API calls:
- `fetchModels()` - Get available models with capabilities (architecture, pricing, modalities)
- `streamChat()` - Async generator for streaming chat completions with support for:
  - Regular text content
  - **Reasoning tokens** (`delta.reasoning`, `delta.reasoning_content`, `delta.reasoning_details`)
  - **Image generation** (`delta.images`, `message.images`, multimodal content arrays)
  - **Web search** (via `plugins: [{ id: "web", max_results: N }]`)
  - **Citations parsing** (from `annotations` or `citations` in response)
  - Automatic `modalities: ["text", "image"]` for image-capable models
- `generateTitle()` - Auto-generate conversation titles using a lightweight model (gemini-2.5-flash-lite)

### Key Patterns

**URL Sync**: `useUrlSync` hook synchronizes the active conversation with the browser URL (`/conversation/:id`), enabling shareable links and browser navigation.

**Dynamic Theming**: `useThemeColor` hook applies the user's accent color as CSS custom properties (--color-accent, --color-accent-soft, etc.) on the document root.

**System Prompts**: Generated dynamically from user profile settings in `getSystemPrompt(conversationId)` to personalize AI responses. Combines:
1. User profile (name, occupation, language, style, custom instructions)
2. Project system prompt (if conversation has an associated project)
3. Project context files (reference documents injected into the prompt)
**Disabled for image generation models** to avoid confusion.

**Model Capabilities Detection**: Uses `model.architecture.output_modalities` to detect image generation support and automatically configure API requests.

### Component Structure
- `Layout.jsx` - Responsive sidebar layout with mobile support
- `Chat/` - ChatWindow (message display + streaming + **web search indicator**), ChatMessage (markdown + reasoning + images + **citations** + **user images**), ChatInput (**web search toggle** + **image upload**)
- `Sidebar/` - Conversation list, ModelSelector (opens modal), **Project selector**, **Web search toggle**
- `Settings/` - ApiKeyModal, ProfileModal
- `Projects/` - **ProjectModal** (create/edit projects), **ProjectSelectorModal** (choose project for conversation)
- `ModelSelectorModal.jsx` - Full-screen model browser with search, filters, favorites

### Features

#### Reasoning Display
- Collapsible "Raisonnement" section with purple Brain icon
- Shows reasoning tokens from models like DeepSeek R1, Claude with thinking, Gemini thinking variants
- Displays "(en cours...)" indicator during streaming

#### Image Generation
- Automatic detection of image-capable models via `architecture.output_modalities`
- Supports multiple response formats (base64, data URLs, multimodal arrays)
- Image grid display with hover overlay
- Modal viewer with zoom and download functionality
- Deduplication to prevent duplicate images

#### Multimodal Image Input
Send images to vision-capable models (GPT-4o, Claude 3.5 Sonnet, Gemini Pro Vision, etc.):
- **Model detection**: Uses `model.architecture.input_modalities.includes('image')` to show upload button
- **Upload methods**: Button click or Ctrl+V paste from clipboard
- **Validation** (`src/utils/imageUtils.js`):
  - Supported formats: JPEG, PNG, GIF, WebP
  - Max size: 4MB per image
  - Max images: 5 per message
  - Auto-compression for large images (max 2048px)
- **Preview**: Thumbnail grid with remove buttons before sending
- **API format**: Multimodal content array `[{ type: "text", text }, { type: "image_url", image_url: { url: "data:..." } }]`
- **Message storage**: Images stored in `userImages` metadata array
- **Display**: User images shown in chat history with lightbox zoom

#### Model Selector Modal
- Full-screen modal with search bar
- Filter buttons: All, Favorites, Free, Image-capable, Reasoning
- Sort by: Name, Price, Context length
- Model cards showing:
  - Provider color accent (OpenAI green, Anthropic beige, Google blue, etc.)
  - Favorite star toggle (persisted)
  - Capability badges (Image, Reasoning, Free)
  - Pricing per million tokens
  - Context window size
- Keyboard support (Escape to close)

#### Web Search
Real-time web search integration via OpenRouter's native plugin system:
- **Toggle locations**: Quick toggle in ChatInput + persistent toggle in Sidebar
- **Per-conversation setting**: Each conversation can have web search enabled/disabled (`webSearchEnabled`)
- **Plugin integration**: Uses OpenRouter's `plugins: [{ id: "web", max_results: N }]`
- **Citations display**: Shows clickable source links with favicons after AI responses
- **Visual feedback**: "Recherche en cours..." indicator with Globe icon during search
- **Streaming citations**: Citations appear during streaming and are saved with messages
- **Configurable results**: `webSearchMaxResults` in user profile (default: 5)

#### Projects (Custom GPT-like Contexts)
Similar to OpenAI GPTs or Claude Projects, allows creating custom contexts for conversations:
- **Project structure**:
  - `id`, `name`, `description`, `icon` (emoji)
  - `systemPrompt` - Custom system instructions for the project
  - `contextFiles[]` - Reference documents (name + content) injected into prompts
  - `createdAt`, `updatedAt` timestamps
- **Per-conversation association**: Each conversation can have its own project (via `projectId`)
- **Prompt composition**: User profile + project prompt + context files are combined
- **File extraction** (`src/utils/fileExtractor.js`):
  - PDF text extraction using `pdfjs-dist` (Mozilla PDF.js)
  - Supports TXT, Markdown, JSON, and code files (JS, TS, Python, etc.)
  - Two modes: upload file or paste text directly
- **UI Components**:
  - `ProjectModal` - Create/edit projects with file upload/paste
  - `ProjectSelectorModal` - Choose project for active conversation
  - Sidebar displays current conversation's project with quick access
- **Data persistence**: Projects are stored in localStorage alongside other app state

### Styling
Uses Tailwind CSS with CSS custom properties for theming. Theme variables are defined in `src/index.css` and dynamically modified by the accent color hook.

## Deployment

Deployed on Netlify. The `netlify.toml` configures SPA routing (redirects all paths to index.html).
