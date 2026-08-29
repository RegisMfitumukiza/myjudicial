import { defineConfig } from "orval";

export default defineConfig({
  myjudicial: {
    input: {
      // Canonical snapshot exported from the backend:
      //   myjudicial-backend: npm run export:openapi
      target: "../openapi/api-docs.json",
    },
    output: {
      target: "./src/api/generated.ts",
      client: "react-query",
      override: {
        mutator: {
          path: "./src/lib/api/client.ts",
          name: "apiFetchEnvelope",
        },
      },
    },
  },
});