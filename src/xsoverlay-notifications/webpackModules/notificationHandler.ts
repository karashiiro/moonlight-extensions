import { ExtensionLoadSource } from "@moonlight-mod/types";
import Dispatcher from "@moonlight-mod/wp/discord/Dispatcher";
import { UserStore, ChannelStore, GuildStore } from "@moonlight-mod/wp/common_stores";
import { ChannelTypes } from "@moonlight-mod/wp/xsoverlay-notifications_channelTypes";
import { MuteStore } from "@moonlight-mod/wp/xsoverlay-notifications_muteStore";
import { isMentioned } from "@moonlight-mod/wp/xsoverlay-notifications_mentions";

const logger = moonlight.getLogger("xsoverlay-notifications/notificationHandler");
logger.info("Loaded notification handler");

function calculateHeight(content: string): number {
  if (content.length <= 100) {
    return 100;
  } else if (content.length <= 200) {
    return 150;
  } else if (content.length <= 300) {
    return 200;
  }
  return 250;
}

function sendToXSOverlay(data: string): void {
  moonlight.getNatives("xsoverlay-notifications").sendToXSOverlay(data);
}

function clearMessage(content: string): string {
  return content.replace(new RegExp("<[^>]*>", "g"), "");
}

function supposedToNotify(message: Message, channel: Channel): boolean {
  if (message.author.id === UserStore.getCurrentUser().id) return false;

  const isSuppressEveryone = MuteStore.isSuppressEveryoneEnabled(message.guild_id || "@me");
  const isSuppressRoles = MuteStore.isSuppressRolesEnabled(message.guild_id || "@me");

  if (MuteStore.allowAllMessages(channel)) return true;

  return isMentioned.isRawMessageMentioned(message, UserStore.getCurrentUser().id, isSuppressEveryone, isSuppressRoles);
}

function onMessage({ message }: { message: Message }): void {
  const enabled = moonlight.getConfigOption<boolean>("xsoverlay-notifications", "enabled");
  const enableDMs = moonlight.getConfigOption<boolean>("xsoverlay-notifications", "enableDMs");
  const enableServers = moonlight.getConfigOption<boolean>("xsoverlay-notifications", "enableServers");

  if (!enabled) {
    return;
  }

  let finalMsg = message.content;
  const author = UserStore.getUser(message.author.id);
  const channel = ChannelStore.getChannel(message.channel_id);
  const images = message.attachments.filter(
    (e: { content_type?: string }) => typeof e?.content_type === "string" && e?.content_type.startsWith("image")
  );

  if (!supposedToNotify(message, channel)) return;

  logger.debug("Processing notification for message", message.id);

  let authorString = "";
  if (channel.guild_id) {
    const guild = GuildStore.getGuild(channel.guild_id);
    authorString = `${author.username} (${guild.name}, #${channel.name})`;
    if (!enableServers) {
      return;
    }
  }

  if (channel.type === ChannelTypes.GROUP_DM) {
    authorString = `${author.username} (${channel.name})`;
    if (!channel.name || channel.name === " " || channel.name === "") {
      authorString = `${author.username} (${channel.rawRecipients.map((e: { username: string }) => e.username).join(", ")})`;
    }
    if (!enableDMs) {
      return;
    }
  }

  if (channel.type === ChannelTypes.DM) {
    authorString = `${author.username}`;
    if (!enableDMs) {
      return;
    }
  }

  if (message.call) {
    finalMsg = "Started a call";
  }

  if (message.embeds.length !== 0) {
    finalMsg += " [embed] ";
    if (message.content === "") {
      finalMsg = "[embed]";
    }
  }

  if (message.stickers) {
    finalMsg += " [sticker] ";
    if (message.content === "") {
      finalMsg = "[sticker]";
    }
  }

  if (images[0]) {
    finalMsg += " [image:" + message.attachments[0].filename + "] ";
  } else if (message.attachments.length !== 0) {
    finalMsg += " [attachment:" + message.attachments[0].filename + "] ";
  }

  for (const mention of message.mentions) {
    finalMsg = finalMsg.replace(
      new RegExp(`<@!?${mention.id}>`, "g"),
      `<color=#8a2be2><b>@${mention.username}</color></b>`
    );
  }

  if (message.mention_roles.length > 0) {
    const guild = GuildStore.getGuild(message.guild_id);
    if (guild) {
      const { roles } = guild;
      for (const roleId of message.mention_roles) {
        const role = roles[roleId];
        finalMsg = finalMsg.replace(
          new RegExp(`<@&${roleId}>`, "g"),
          `<b><color=#${parseInt(role.color.toString()).toString(16)}>@${role.name}</color></b>`
        );
      }
    }
  }

  let matches = finalMsg.match(new RegExp("(<a?:\\w+:\\d+>)", "g"));
  if (matches) {
    for (const match of matches) {
      finalMsg = finalMsg.replace(new RegExp(`${match}`, "g"), `:${match.split(":")[1]}:`);
    }
  }

  matches = finalMsg.match(new RegExp("<(#\\d+)>", "g"));
  if (matches) {
    for (const match2 of matches) {
      let channelId = match2.split("<#")[1];
      channelId = channelId.substring(0, channelId.length - 1);
      const mentionedChannel = ChannelStore.getChannel(channelId);
      if (mentionedChannel) {
        finalMsg = finalMsg.replace(
          new RegExp(`${match2}`, "g"),
          `<b><color=#8a2be2>#${mentionedChannel.name}</color></b>`
        );
      }
    }
  }

  fetch(`https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.png?size=128`)
    .then((response) => response.arrayBuffer())
    .then((result) => {
      const notification: XSOverlayNotification = {
        messageType: 1,
        index: 0,
        timeout: 5,
        height: calculateHeight(clearMessage(finalMsg)),
        opacity: 0.9,
        volume: 0,
        audioPath: "",
        title: authorString,
        content: finalMsg,
        useBase64Icon: true,
        icon: Buffer.from(result).toString("base64"),
        sourceApp: "Discord"
      };
      logger.info("Sending notification to XSOverlay", { title: authorString, messageId: message.id });
      sendToXSOverlay(JSON.stringify(notification));
    })
    .catch((error) => {
      logger.error("Failed to fetch avatar or send notification", error);
    });
}

export function load(_source: ExtensionLoadSource): void {
  logger.info("Subscribing to MESSAGE_CREATE events");
  Dispatcher.subscribe("MESSAGE_CREATE", onMessage);
}

export function unload(): void {
  logger.info("Unsubscribing from MESSAGE_CREATE events");
  Dispatcher.unsubscribe("MESSAGE_CREATE", onMessage);
}
