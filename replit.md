# Aether - Collaborative Spatial OS

## Overview

Aether is a virtual operating system running in the browser, set in a 3D spatial computing environment. Users interact with floating, glassmorphic windows that have physics-based behavior, all rendered in real-time WebGL. The project demonstrates advanced full-stack capabilities including 3D rendering at 60+ FPS, real-time multiplayer synchronization, custom GLSL shaders, and AI-powered terminal commands.

Key features:
- **3D Window System**: Physics-enabled windows using Rapier that can be dragged, thrown, and bounce off boundaries
- **Procedural Background**: Interactive particle starfield with mouse-reactive shaders
- **Real-time Collaboration**: WebSocket-based cursor tracking showing other users as glowing drones
- **AI Terminal**: OpenAI-powered command interface for creating windows and controlling the environment
- **Workspace Persistence**: Save and load workspace states to PostgreSQL

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Single-page application with Vite for development and building
- **Three.js + React Three Fiber**: 3D rendering layer with declarative React components
- **React Three Drei**: Helper components for common 3D patterns (materials, controls, Html overlays)
- **React Three Rapier**: Physics simulation for window dynamics and collisions
- **Zustand**: Global state management for windows, workspaces, and multiplayer state
- **Tailwind CSS + shadcn/ui**: UI component library with glassmorphic styling

### Backend Architecture
- **Express.js**: HTTP server handling API routes and static file serving
- **WebSocket (ws)**: Real-time bidirectional communication for cursor positions and window movements
- **OpenAI Integration**: AI command processing for natural language terminal interactions

### Data Layer
- **PostgreSQL**: Primary database for workspace persistence
- **Drizzle ORM**: Type-safe database queries with schema defined in `shared/schema.ts`
- **Schema**: Workspaces table storing window states as JSONB (positions, rotations, content)

### Key Design Patterns
- **Shared Types**: Common schema definitions in `/shared` used by both client and server
- **Path Aliases**: `@/` for client source, `@shared/` for shared code, `@assets/` for static assets
- **Physics-First Windows**: All window interactions go through Rapier physics simulation for natural feel
- **Optimistic Updates**: Local state changes broadcast to server, with periodic persistence

### 3D/Graphics Approach
- **Custom GLSL Shaders**: Vertex and fragment shaders for particle effects and glass materials
- **MeshTransmissionMaterial**: Physically-based glass rendering with refraction
- **InstancedMesh**: Performance optimization for rendering thousands of particles
- **Html Component**: 2D UI overlays positioned in 3D space for window content

## External Dependencies

### Database
- **PostgreSQL**: Required, connection via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migrations with `npm run db:push`

### AI/ML Services
- **OpenAI API**: Optional, requires `OPENAI_API_KEY` for AI terminal functionality
- Falls back to basic responses when API key not configured
- Uses GPT-4o for command parsing and responses

### Real-time Communication
- **WebSocket Server**: Built-in, runs on same port as HTTP server at `/ws` path
- Handles cursor position broadcasting and window state synchronization

### Build/Dev Tools
- **Vite**: Development server with HMR, builds to `dist/public`
- **esbuild**: Server bundling for production
- **TypeScript**: Strict mode enabled across entire codebase

### Third-Party UI Libraries
- **Radix UI**: Accessible primitive components (dialogs, dropdowns, tooltips)
- **Framer Motion**: Animation library (available but Rapier handles main physics)
- **Lucide Icons**: Icon set used throughout UI