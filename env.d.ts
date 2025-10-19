/// <reference types="@moonlight-mod/types" />

type Snowflake = `${number}`;

// Discord Message type (used by xsoverlay-notifications and remind-me)
interface Message {
  id: Snowflake;
  channel_id: Snowflake;
  guild_id?: Snowflake;
  author: {
    id: Snowflake;
    username: string;
    avatar: string | null;
  };
  content: string;
  mentions: Array<{
    id: Snowflake;
    username: string;
  }>;
  mention_roles: Snowflake[];
  attachments: Array<{
    id: Snowflake;
    filename: string;
    content_type?: string;
  }>;
  embeds: any[];
  stickers?: any[];
  call?: any;
}

// Discord Channel type (used by xsoverlay-notifications)
interface Channel {
  id: Snowflake;
  type: number;
  guild_id?: Snowflake;
  name?: string;
  rawRecipients?: Array<{
    id: Snowflake;
    username: string;
  }>;
}

// XSOverlay notification payload type
interface XSOverlayNotification {
  messageType: number;
  index: number;
  timeout: number;
  height: number;
  opacity: number;
  volume: number;
  audioPath: string;
  title: string;
  content: string;
  useBase64Icon: boolean;
  icon: string;
  sourceApp: string;
}

interface SavedMessageData {
  channelId: Snowflake;
  messageId: Snowflake;
  dueAt?: Date;
  savedAt?: number;
}

interface SavedMessage {
  message: Message;
  saveData: SavedMessageData;
}

declare module "@moonlight-mod/wp/remind-me_message" {
  declare class Message {
    guildId: Snowflake;
    constructor(rawMessage: unknown);
  }
}

declare module "@moonlight-mod/wp/remind-me_user" {
  declare class User {
    constructor(rawUser: unknown);
  }
}

declare module "@moonlight-mod/wp/remind-me_savedMessagesPersistedStore" {
  import { Message } from "@moonlight-mod/wp/remind-me_message";

  namespace Stores {
    declare class SavedMessagesPersistedStore {
      hasSavedMessage(saveData: SavedMessageData): boolean;
      getSavedMessage(saveData: SavedMessageData): { message: Message; saveData: SavedMessageData } | null;
      putSavedMessage(message: Message, saveData: SavedMessageData): void;
      deleteSavedMessage(saveData: SavedMessageData): boolean;
      getSavedMessages(): { message: Message; saveData: SavedMessageData }[];
    }
  }

  const SavedMessagesPersistedStore: Stores.SavedMessagesPersistedStore;

  function mapMessage(m: any, saveData: SavedMessageData): Message;
}

declare module "@moonlight-mod/wp/remind-me_savedMessagesStore" {
  import { Store } from "@moonlight-mod/wp/discord/packages/flux";

  namespace Stores {
    class SavedMessagesStore extends Store<SavedMessage> {
      getIsStale(): boolean;
      getLastChanged(): number;
      getMessageBookmarks(): SavedMessage[];
      getMessageReminders(): SavedMessage[];
      getOverdueMessageReminderCount();
      getSavedMessage(channelId: string, messageId: string): SavedMessage | null;
      getSavedMessageCount(): number;
      getSavedMessages(): SavedMessage[];
      hasOverdueReminder(): boolean;
      isMessageBookmarked(): boolean;
      isMessageReminder(): boolean;
      initialize(): void;
    }
  }

  const SavedMessagesStore: Stores.SavedMessagesStore;
}

// XSOverlay notifications extension module declarations
declare module "@moonlight-mod/wp/xsoverlay-notifications_notificationHandler" {}

declare module "@moonlight-mod/wp/xsoverlay-notifications_channelTypes" {
  export const ChannelTypes: {
    DM: number;
    GROUP_DM: number;
    [key: string]: number;
  };
}

declare module "@moonlight-mod/wp/xsoverlay-notifications_muteStore" {
  export const MuteStore: {
    isSuppressEveryoneEnabled(guildId: string): boolean;
    isSuppressRolesEnabled(guildId: string): boolean;
    allowAllMessages(channel: any): boolean;
  };
}

declare module "@moonlight-mod/wp/xsoverlay-notifications_mentions" {
  export const isMentioned: {
    isRawMessageMentioned(message: any, userId: string, suppressEveryone: boolean, suppressRoles: boolean): boolean;
  };
}
