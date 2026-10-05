import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "convex/_generated/**"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // Intentional component + helper/hook co-exports (shadcn, contexts, demo stores).
  {
    files: [
      "src/components/ui/**/*.{ts,tsx}",
      "src/contexts/**/*.{ts,tsx}",
      "src/components/demo/**/*.{ts,tsx}",
      "src/components/auth/AuthWizardProgress.tsx",
      "src/components/creator/SettingsSubnav.tsx",
      "src/components/dashboard/MemberSidebar.tsx",
      "src/components/discover/GameMatchupCard.tsx",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
);
