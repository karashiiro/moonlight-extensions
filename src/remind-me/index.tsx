import { ExtensionWebExports } from "@moonlight-mod/types";

const TODOS_EXPERIMENT_SIGNATURE = "2022-08_message_todos_staff_only";
const REMINDERS_EXPERIMENT_SIGNATURE = "2024-06_message_bookmarks";
const TAB_SELECTOR_SIGNATURE = "RecentsHeader";
const TAB_ROUTER_SIGNATURE = /showTutorial.+TODOS/;

// https://moonlight-mod.github.io/ext-dev/webpack/#patching
export const patches: ExtensionWebExports["patches"] = [
  {
    find: TODOS_EXPERIMENT_SIGNATURE,
    replace: [
      {
        // Enable experiment by default
        match: /defaultConfig:{(.+)},treatments/,
        replacement: () => `defaultConfig:{showReminders:true},treatments`
      }
    ]
  },
  {
    find: REMINDERS_EXPERIMENT_SIGNATURE,
    replace: [
      {
        // Enable experiment by default
        match: /defaultConfig:{(.+)},treatments/,
        replacement: () => `defaultConfig:{enabled:true,inInbox:true},treatments`
      }
    ]
  },
  {
    find: TAB_SELECTOR_SIGNATURE,
    replace: [
      {
        // Strip the ternary around the reminders tab in the inbox UI to bypass the experiment gate
        match: /.&&!.\?(.+):null/,
        replacement: (_, code) => code
      }
    ]
  },
  {
    find: TAB_ROUTER_SIGNATURE,
    replace: [
      {
        // Strip the useEffect that disables the Bookmarks/Reminders tabs (why are the experiments
        // fixing Bookmarks but not Reminders?)
        match: /.\.useEffect\(\(\)=>{.+TODOS.+}\);/,
        replacement: (_) => ""
      }
    ]
  }
];

// https://moonlight-mod.github.io/ext-dev/webpack/#webpack-module-insertion
export const webpackModules: ExtensionWebExports["webpackModules"] = {
  entrypoint: {
    dependencies: [
      {
        ext: "remind-me",
        id: "someLibrary"
      },
      {
        id: "react"
      },
      {
        ext: "contextMenu",
        id: "contextMenu"
      },
      {
        ext: "spacepack",
        id: "spacepack"
      },
      TODOS_EXPERIMENT_SIGNATURE,
      REMINDERS_EXPERIMENT_SIGNATURE,
      TAB_SELECTOR_SIGNATURE,
      TAB_ROUTER_SIGNATURE
    ],
    entrypoint: true
  }
};
