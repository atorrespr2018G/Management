# NextJS Advanced App

A modern, full-featured Next.js application built with advanced techniques including Redux, Material UI, TypeScript, and comprehensive routing.

## Features

- ⚡ **Next.js 14** with App Router
- 🔄 **Redux Toolkit** for state management
- 🎨 **Material UI v5** for beautiful components
- 📘 **TypeScript** for type safety
- 🧭 **Advanced Routing** with Next.js App Router
- 📱 **Responsive Design** for all devices
- 🎯 **Reusable Components** architecture
- 🌙 **Theme Support** (light/dark ready)

## Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **State Management:** Redux Toolkit
- **UI Library:** Material UI v5
- **Styling:** Emotion (via Material UI)
- **Routing:** Next.js App Router

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home/Landing page
│   ├── about/             # About page
│   ├── features/          # Features page
│   └── login/             # Login page
├── components/            # Reusable components
│   ├── Layout/           # Layout components (Header, Footer, Sidebar)
│   ├── Cards/            # Card components
│   ├── Buttons/          # Button components
│   └── Hero/             # Hero section components
├── store/                # Redux store configuration
│   ├── store.ts          # Redux store setup
│   ├── hooks.ts          # Typed Redux hooks
│   ├── Provider.tsx      # Redux provider component
│   └── slices/           # Redux slices
│       ├── counterSlice.ts
│       └── userSlice.ts
└── theme/                # Material UI theme
    └── theme.ts          # Theme configuration
```

## Key Features Explained

### Redux State Management

The app uses Redux Toolkit for state management with two main slices:
- **Counter Slice:** Demonstrates basic state management
- **User Slice:** Handles user authentication state

### Material UI Components

Fully integrated Material UI with:
- Custom theme configuration
- Responsive design breakpoints
- Accessible components
- Consistent styling

### Routing

Next.js App Router provides:
- File-based routing
- Layout nesting
- Server and client components
- Dynamic routes support

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [Material UI Documentation](https://mui.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## License

MIT



