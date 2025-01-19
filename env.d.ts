/// <reference types="@moonlight-mod/types" />

type Message = object;

type Snowflake = `${number}`;

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
