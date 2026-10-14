import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		globals: true,
		include: ["test/**/*.{spec,test}.{js,ts}", "uber/test/**/*.{spec,test}.{js,ts}"],
		coverage: {
			reporter: ["lcov", "text"],
			reportsDirectory: "./coverage",
			include: ["app/**/*.ts", "uber/app/**/*.ts"],
		},
	},
});
