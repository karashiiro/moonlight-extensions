import { ExtensionWebExports } from "@moonlight-mod/types";

export const patches: ExtensionWebExports["patches"] = [];

export const webpackModules: ExtensionWebExports["webpackModules"] = {
  channelTypes: {
    dependencies: [
      {
        ext: "spacepack",
        id: "spacepack"
      },
      /ChannelTypes:\{/
    ]
  },
  muteStore: {
    dependencies: [
      {
        ext: "spacepack",
        id: "spacepack"
      },
      /isSuppressEveryoneEnabled/
    ]
  },
  mentions: {
    dependencies: [
      {
        ext: "spacepack",
        id: "spacepack"
      },
      /isRawMessageMentioned/
    ]
  },
  notificationHandler: {
    dependencies: [
      {
        ext: "common",
        id: "stores"
      },
      {
        id: "discord/Dispatcher"
      },
      {
        ext: "xsoverlay-notifications",
        id: "channelTypes"
      },
      {
        ext: "xsoverlay-notifications",
        id: "muteStore"
      },
      {
        ext: "xsoverlay-notifications",
        id: "mentions"
      }
    ],
    entrypoint: true
  }
};
