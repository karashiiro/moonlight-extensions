import { ExtensionWebExports } from "@moonlight-mod/types";

const TODOS_EXPERIMENT_SIGNATURE = "2022-08_message_todos_staff_only";
const REMINDERS_EXPERIMENT_SIGNATURE = "2024-06_message_bookmarks";
const TAB_SELECTOR_SIGNATURE = /TabBar\.Item.+TODOS/;
const TAB_ROUTER_SIGNATURE = /showTutorial.+TODOS/;
const SAVED_MESSAGES_API_SIGNATURE =
  /async function .+{.+await.+\.(PUT_SAVED_MESSAGE|DELETE_SAVED_MESSAGE|GET_SAVED_MESSAGES)/;
const BOOKMARKS_NITRO_SIGNATURE = /jsx.+FOR_LATER_POPOUT_UPSELL/;
const BOOKMARKS_MENU_GROUP_SIGNATURE = /id:"save-for-later-upsell"/;
const BOOKMARKS_MENU_GROUP_ACTIONS_SIGNATURE = /FOR_LATER_HELPERS.+dueAt/;

// https://moonlight-mod.github.io/ext-dev/webpack/#patching
export const patches: ExtensionWebExports["patches"] = [
  {
    find: BOOKMARKS_NITRO_SIGNATURE,
    replace: [
      {
        // Strip the Nitro feature gate for Bookmarks
        match: /(?<=function .\(\){return)[^?]+\?(.+(?=:\()):(.+)(?=}function)/,
        replacement: (_m, bookmarksComponent, _g2) => bookmarksComponent
      }
    ]
  },
  {
    find: BOOKMARKS_MENU_GROUP_SIGNATURE,
    replace: [
      {
        // Strip the Nitro feature gate for Bookmarks in the Message action menu
        match: /(?<=function .\(.\){.+return.+) .\|\|.+\|\|[^?]+\?(.+):.+id:"save-for-later-upsell".+:null/,
        replacement: (_m, bookmarksMenuItem) => bookmarksMenuItem
      }
    ]
  },
  {
    find: BOOKMARKS_MENU_GROUP_ACTIONS_SIGNATURE,
    replace: [
      {
        // Strip the Nitro feature gate for the bookmarking actions in the Message action menu
        match: /(?<=function .\(.\){.+)if\(null==.+return}/,
        replacement: () => ""
      }
    ]
  },
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
        // TODO: Make this more robust since it breaks sometimes
        match: /.&&!.\?(.+):null,/,
        replacement: (_, code) => `${code},`
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
    find: SAVED_MESSAGES_API_SIGNATURE,
    replace: [
      {
        match: /async function (.)\((.)\){.+await.+\.PUT_SAVED_MESSAGE.+}(?=.+DELETE_SAVED_MESSAGE)/,
        replacement: (_, functionName, paramName) =>
          `function ${functionName}(${paramName}){return require("remind-me_savedMessagesShim").putSavedMessage(${paramName})}`
      },
      {
        // Footgun: These patches are applied in order, so we can't include any part of a previously-replaced function
        // that could be missing in the lookarounds as it gets replaced by its respective match. We can work around that
        // here by using the replacement in subsequent matches.
        match:
          /(?<=putSavedMessage.+)async function (.)\((.)\){.+await.+\.DELETE_SAVED_MESSAGE.+}(?=.+GET_SAVED_MESSAGES)/,
        replacement: (_, functionName, paramName) =>
          `function ${functionName}(${paramName}){return require("remind-me_savedMessagesShim").deleteSavedMessage(${paramName})}`
      },
      {
        match: /(?<=deleteSavedMessage.+)async function (.)\(\){.+await.+\.GET_SAVED_MESSAGES.+}}/,
        replacement: (_, functionName) =>
          `function ${functionName}(){return require("remind-me_savedMessagesShim").getSavedMessages()}}`
      }
    ]
  }
];

// https://moonlight-mod.github.io/ext-dev/webpack/#webpack-module-insertion
export const webpackModules: ExtensionWebExports["webpackModules"] = {
  message: {
    dependencies: [
      {
        ext: "spacepack",
        id: "spacepack"
      },
      /this\.messageReference=.\.messageReference/
    ]
  },
  user: {
    dependencies: [
      {
        ext: "spacepack",
        id: "spacepack"
      },
      /getAvatarURL\(\w{1,2},\w{1,2}\){/
    ]
  },
  savedMessagesStore: {
    dependencies: [
      {
        ext: "spacepack",
        id: "spacepack"
      },
      '"SavedMessagesStore"'
    ]
  },
  savedMessagesPersistedStore: {
    dependencies: [
      {
        id: "discord/packages/flux"
      },
      {
        id: "discord/Dispatcher"
      },
      {
        ext: "remind-me",
        id: "message"
      },
      {
        ext: "remind-me",
        id: "user"
      },
      {
        ext: "common",
        id: "stores"
      }
    ]
  },
  savedMessagesShim: {
    dependencies: [
      {
        id: "discord/Dispatcher"
      },
      {
        ext: "remind-me",
        id: "savedMessagesStore"
      },
      {
        ext: "remind-me",
        id: "message"
      },
      {
        ext: "common",
        id: "stores"
      }
    ]
  },
  entrypoint: {
    dependencies: [
      TODOS_EXPERIMENT_SIGNATURE,
      REMINDERS_EXPERIMENT_SIGNATURE,
      TAB_SELECTOR_SIGNATURE,
      TAB_ROUTER_SIGNATURE,
      BOOKMARKS_NITRO_SIGNATURE,
      BOOKMARKS_MENU_GROUP_SIGNATURE,
      BOOKMARKS_MENU_GROUP_ACTIONS_SIGNATURE
    ],
    entrypoint: true
  }
};
