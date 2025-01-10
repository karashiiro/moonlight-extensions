import { ExtensionWebExports } from "@moonlight-mod/types";

// https://moonlight-mod.github.io/ext-dev/webpack/#patching
export const patches: ExtensionWebExports["patches"] = [];

// https://moonlight-mod.github.io/ext-dev/webpack/#webpack-module-insertion
export const webpackModules: ExtensionWebExports["webpackModules"] = {
  entrypoint: {
    dependencies: [
      {
        ext: "remind-me",
        id: "someLibrary"
      }
    ],
    entrypoint: true
    // See `src/remind-me/webpackModules/entrypoint.ts` for the source of this module.
  },
  someLibrary: {
    entrypoint: true,
    run: (module, exports, require) => {
      const logger = moonlight.getLogger("remind-me/someLibrary");
      logger.info("Hello from someLibrary!");
      module.exports = "Hello from someLibrary's exports!";
    }
  }
};
