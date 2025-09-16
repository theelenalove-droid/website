# Overview

SiteSecure is a modern nonprofit organization website built as a full-stack web application that enables online donations, contact management, and administrative oversight. The platform serves as a comprehensive solution for a charitable organization to showcase their work, collect donations through multiple payment methods (PayPal, Stripe, GCash), manage contact inquiries, and provide secure administrative dashboards for different user roles.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built with React 18 using TypeScript and follows a component-based architecture with modern React patterns. The application uses Wouter for client-side routing instead of React Router, providing a lightweight navigation solution. State management is handled through React Context for authentication and TanStack Query for server state management and caching. The UI is built with a comprehensive design system using shadcn/ui components, which provides a consistent and accessible interface built on top of Radix UI primitives.

## Backend Architecture
The server follows a REST API design pattern built with Express.js and TypeScript. The application uses a modular storage abstraction layer that currently implements an in-memory storage solution but is designed to easily swap to database persistence. The server includes comprehensive middleware for request logging, error handling, and authentication via session-based tokens. API routes are organized by functionality with clear separation between public endpoints and protected administrative routes.

## Authentication & Authorization
The system implements a role-based access control (RBAC) system with three distinct user roles: guest, admin, and owner. Authentication is handled through session-based tokens stored in localStorage on the client side and validated via Bearer token headers. The system includes separate login portals for different user roles (/admin-secret-portal and /owner-secret-portal) with role-specific dashboard access. Session management includes automatic expiration and secure session storage.

## Database Schema Design
The application uses Drizzle ORM with PostgreSQL dialect for database operations. The schema includes five main entities: users (with role-based permissions), donations (supporting multiple payment methods), contact messages (for inquiry management), GCash payments (for manual payment verification), and sessions (for authentication). The schema is designed with proper foreign key relationships and includes audit fields like timestamps for tracking. The database configuration supports both development and production environments with proper connection pooling.

## Payment Processing Architecture
The system integrates three payment methods with different processing approaches. PayPal integration uses the official PayPal Server SDK with environment-specific configuration for sandbox and production modes. Stripe integration utilizes the Stripe SDK for card processing with proper error handling and webhook support. GCash payments are handled through a manual verification system where users submit payment references that administrators can verify through a dedicated dashboard interface.

## UI/UX Design System
The frontend implements a comprehensive design system using Tailwind CSS with custom CSS variables for theming. The design follows the "new-york" style from shadcn/ui with a professional color scheme suitable for a nonprofit organization. The system includes responsive design patterns, accessibility features through Radix UI primitives, and a consistent component library covering forms, navigation, data display, and interactive elements.

# External Dependencies

## Payment Service Providers
- **PayPal Server SDK**: Official PayPal integration for processing donations with support for both sandbox and production environments
- **Stripe**: Credit card processing with React components for secure payment forms and webhook handling
- **GCash**: Manual verification system for Philippine mobile payment processing

## Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL database provider with connection pooling and automatic scaling
- **Drizzle ORM**: Type-safe database ORM with PostgreSQL dialect support and migration management

## UI & Frontend Libraries
- **Radix UI**: Comprehensive collection of accessible, unstyled UI primitives for building the component library
- **Tailwind CSS**: Utility-first CSS framework for styling with custom design tokens
- **TanStack Query**: Powerful data fetching and caching library for managing server state
- **React Hook Form**: Form management library with validation support
- **Wouter**: Lightweight client-side routing library as an alternative to React Router

## Development & Build Tools
- **Vite**: Modern build tool and development server with React plugin support
- **TypeScript**: Static type checking for both client and server code
- **ESBuild**: Fast JavaScript bundler for production builds
- **TSX**: TypeScript execution environment for development server

## Authentication & Session Management
- **Connect PG Simple**: PostgreSQL session store for Express sessions with automatic cleanup
- **Crypto**: Node.js built-in module for generating secure session IDs and tokens

## Third-party Integrations
- **Email Services**: Ready for integration with email providers for automated notifications and confirmations (SMTP configuration not yet implemented)
- **Google Fonts**: External font loading for improved typography (Inter, DM Sans, Architects Daughter, Fira Code, Geist Mono)