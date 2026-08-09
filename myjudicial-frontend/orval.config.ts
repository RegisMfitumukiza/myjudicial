import { defineConfig } from "orval";

export default defineConfig({
  myjudicial: {
    input: {
      target: "http://localhost:4000/api-docs.json",
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