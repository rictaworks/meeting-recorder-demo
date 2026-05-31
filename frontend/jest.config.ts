import type { Config } from "jest";

const config: Config = {
  testEnvironment: "jsdom",
  testMatch: ["**/tests/unit/**/*.test.{ts,tsx}"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "<rootDir>/tests/__mocks__/styleMock.ts",
    "^react-i18next$": "<rootDir>/tests/__mocks__/react-i18next.tsx",
  },
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
        },
      },
    ],
  },
  setupFiles: ["<rootDir>/tests/__mocks__/setupEnv.ts"],
};

export default config;
