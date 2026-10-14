import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		include: ["test/**/*.{spec,test}.{js,ts}"],
		coverage: {
			reporter: ["lcov", "text"],
			reportsDirectory: "./coverage",
			include: ["app/**/*.ts", "infra/**/*.ts"],
		},
	},
});
