import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		include: ["uber/test/**/*.{spec,test}.{js,ts}"],
		coverage: {
			reporter: ["lcov", "text"],
			reportsDirectory: "./coverage",
			include: ["uber/app/**/*.ts", "uber/infra/**/*.ts"],
		},
	},
});
