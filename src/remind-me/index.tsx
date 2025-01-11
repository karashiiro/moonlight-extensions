import { ExtensionWebExports } from "@moonlight-mod/types";

const TODOS_EXPERIMENT_SIGNATURE = "2022-08_message_todos_staff_only";
const REMINDERS_EXPERIMENT_SIGNATURE = "2024-06_message_bookmarks";
const TAB_SELECTOR_SIGNATURE = "RecentsHeader";
const TAB_ROUTER_SIGNATURE = /showTutorial.+TODOS/;
const PUT_SAVED_MESSAGE_SIGNATURE = /async function .+{.+await.+\.PUT_SAVED_MESSAGE/;
const DELETE_SAVED_MESSAGE_SIGNATURE = /async function .+{.+await.+\.DELETE_SAVED_MESSAGE/;
const GET_SAVED_MESSAGES_SIGNATURE = /async function .+{.+await.+\.GET_SAVED_MESSAGES/;

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
  },
  {
    find: PUT_SAVED_MESSAGE_SIGNATURE,
    replace: [
      {
        // Footgun: These patches are applied in an undefined order, so we can't include any part of another replaced function
        // that could be missing in the lookarounds as they get replaced by their respective matches. We can work around that
        // here by using terms in the lookarounds which will be in the right spot regardless of the order in which these
        // patches are applied.
        match:
          /async function (.)\((.)\){.+await.+\.PUT_SAVED_MESSAGE.+}(?=.+(deleteSavedMessage|DELETE_SAVED_MESSAGE))/,
        replacement: (_, functionName, paramName) =>
          `function ${functionName}(${paramName}){return require("remind-me_savedMessagesShim").putSavedMessage(${paramName})}`
      }
    ]
  },
  {
    find: DELETE_SAVED_MESSAGE_SIGNATURE,
    replace: [
      {
        match:
          /(?<=(putSavedMessage|PUT_SAVED_MESSAGE).+)async function (.)\((.)\){.+await.+\.DELETE_SAVED_MESSAGE.+}(?=.+(getSavedMessages|GET_SAVED_MESSAGES))/,
        replacement: (_, _g1, functionName, paramName) =>
          `function ${functionName}(${paramName}){return require("remind-me_savedMessagesShim").deleteSavedMessage(${paramName})}`
      }
    ]
  },
  {
    find: GET_SAVED_MESSAGES_SIGNATURE,
    replace: [
      {
        match:
          /(?<=(deleteSavedMessage|DELETE_SAVED_MESSAGE).+)async function (.)\(\){.+await.+\.GET_SAVED_MESSAGES.+}}/,
        replacement: (_, _g1, functionName) =>
          `function ${functionName}(){return require("remind-me_savedMessagesShim").getSavedMessages()}}`
      }
    ]
  }
];

// https://moonlight-mod.github.io/ext-dev/webpack/#webpack-module-insertion
export const webpackModules: ExtensionWebExports["webpackModules"] = {
  savedMessagesShim: {},
  entrypoint: {
    dependencies: [
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
