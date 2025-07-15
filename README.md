
# CertifyZen - Precision Certification Management

CertifyZen is a modern, full-stack web application designed for streamlined management of test certificates and master data. Built with Next.js and leveraging a powerful set of modern technologies, it provides a secure, fast, and intuitive user experience.

This application is built and maintained with the help of **Firebase Studio**, an AI-powered coding partner.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **UI:** [React](https://reactjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Component Library:** [ShadCN UI](https://ui.shadcn.com/)
- **Icons:** [Lucide React](https://lucide.dev/guide/packages/lucide-react)
- **Generative AI:** [Genkit (Google AI)](https://firebase.google.com/docs/genkit)
- **Deployment:** [Firebase App Hosting](https://firebase.google.com/docs/app-hosting)

## Core Features

- **Secure Authentication:** Robust login system to protect application data.
- **Dynamic Tabbed Interface:** Open multiple masters and pages in tabs for efficient multitasking.
- **Comprehensive Master Data Management:** Full CRUD (Create, Read, Update, Delete) functionality for all critical business data, including:
  - Customers, Units, Grades, Products, Remarks, Materials, Laboratories, and more.
- **Advanced Data Tables:** All data is presented in tables with built-in filtering, sorting, pagination, bulk delete, and data export (Excel) capabilities.
- **Certificate Generation:** Create and manage test certificates with a detailed, multi-tab form.
- **PDF Export:** Download any certificate as a professionally formatted, A4 landscape PDF.
- **UI Kit:** An integrated UI component showcase for developers, including icons and alert variants with copy-pasteable code snippets.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en) (v18 or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### 1. Set Up Environment Variables

This project uses Genkit for AI features, which requires a Google AI API key.

1.  Copy the example environment file to a new `.env.local` file:
    ```bash
    cp .env.example .env.local
    ```
2.  Open `.env.local` and add your Google AI API key:
    ```
    GOOGLE_API_KEY="YOUR_GOOGLE_AI_API_KEY_HERE"
    ```
    You can obtain a key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 2. Install Dependencies

Install the necessary project dependencies:

```bash
npm install
```

### 3. Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

The application will be available at `http://localhost:9002`.

## Available Scripts

- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Creates a production-ready build of the application.
- `npm run start`: Starts the application in production mode (requires `npm run build` first).
- `npm run lint`: Lints the codebase for potential errors.
- `npm run typecheck`: Runs the TypeScript compiler to check for type errors.
