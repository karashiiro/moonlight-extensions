/// <reference types="@moonlight-mod/types" />

declare module "@moonlight-mod/wp/remind-me_message" {
  declare class Message {
    constructor(rawMessage: unknown);
  }
}

declare module "@moonlight-mod/wp/remind-me_savedMessagesStore" {
  import { Store } from "@moonlight-mod/wp/discord/packages/flux";

  type Timestamp = number;

  // TODO: Fill out fields
  type Message = object;

  interface SavedMessageData {
    channelId: string;
    messageId: string;
    dueAt?: Timestamp;
    savedAt?: Timestamp;
  }

  interface SavedMessage {
    message: Message;
    saveData: SavedMessageData;
  }

  namespace Stores {
    class SavedMessagesStore extends Store<SavedMessage> {
      getIsStale(): boolean;
      getLastChanged(): Timestamp;
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
