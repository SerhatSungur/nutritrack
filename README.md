# NutriTrack 🍎

NutriTrack is a modern, cross-platform nutrition and meal tracking application. Built with premium, "Editorial Minimal" design principles, the application provides an intuitive interface for logging meals, discovering new recipes, and tracking macro/micronutrient goals.

## 🚀🚀🚀🚀 Tech Stack

*   **Framework**: [React Native](https://reactnative.dev/) via [Expo](https://expo.dev/) (SDK 52)
*   **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
*   **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
*   **Backend & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, OAuth)
*   **State Management**: [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
*   **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

---

## 🛠️ How to Start the Project

### Prerequisites
*   Node.js (v18 or higher recommended)
*   npm or yarn
*   A Supabase project (for local/live backend)

### 1. Install Dependencies
Run the following command in the root directory:
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root of your project and add your Supabase connection details:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Start the Development Server
To start the Expo bundler:
```bash
npx expo start
```
*   **To run on iOS**: Press `i` in the terminal to open the iOS Simulator.
*   **To run on Android**: Press `a` in the terminal to open the Android Emulator.
*   **To run on Web**: Press `w` in the terminal to open the app in your browser (usually `http://localhost:8081`).
*   *(Note: To clear the bundler cache, run `npx expo start -c`)*

---

## 📂 Project Structure & Important Files

The app uses **Expo Router**, meaning the file system in `src/app` dictates the navigation routes.

### App Routing (`src/app/`)
*   **`_layout.tsx`**: The root layout wrapper. Handles font loading, theme injection, global state initialization, and the Supabase OAuth web redirect interceptor.
*   **`index.tsx`**: The entry point. Handles routing to the main app (`/(tabs)`) once auth state is initialized.
*   **`(tabs)/_layout.tsx`**: The main navigation layout (bottom tabs on mobile, sidebar on desktop).
*   **`(tabs)/index.tsx`**: The **Dashboard** screen. Contains macro rings, meal logging sections, and the water tracker.
*   **`(tabs)/recipes.tsx`**: The **Recipes & Discovery** screen. Shows user-saved recipes and public community recipes.
*   **`(tabs)/profile.tsx`**: The **User Profile** screen. Handles settings, theme toggling, account details, and trend charts.
*   **`recipes/create.tsx`**: The **Add Recipe** screen. Features a sliding web drawer, ingredient search (via OpenFoodFacts API), and barcode scanning.
*   **`auth/login.tsx`**: The **Authentication** screen. Handles Google OAuth, Apple Sign-In, and anonymous guest sessions.

### State & Logic
*   **`src/store/useAuthStore.ts`**: Zustand store for managing Supabase user sessions and initialization.
*   **`src/store/useLogStore.ts`**: Zustand store for tracking daily calories, macros, logged meals, and custom recipes.
*   **`src/lib/supabase.ts`**: The Supabase client initialization. Handles session persistence and web URL parsing.
*   **`src/lib/api/foodApi.ts`**: Logic for searching the OpenFoodFacts API for ingredients and barcode lookups.

### UI & Configuration
*   **`src/components/`**: Reusable UI parts like `DesktopSidebar` and `DashboardSkeleton`.
*   **`tailwind.config.js`**: Contains the custom design tokens, color palettes, and theme variables for NativeWind.
*   **`global.css`**: Defines CSS custom properties (`--background`, `--primary`, etc.) utilized by the Tailwind configuration for easy Light/Dark mode switching.
