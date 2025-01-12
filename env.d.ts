/// <reference types="@moonlight-mod/types" />

declare module "@moonlight-mod/wp/remind-me_savedMessagesStore" {
  import { Store } from "@moonlight-mod/wp/discord/packages/flux";

  type Timestamp = number;

  // TODO: Fill out fields
  type Message = object;

  namespace Stores {
    class SavedMessagesStore extends Store<Message> {
      getIsStale(): boolean;
      getLastChanged(): Timestamp;
      getMessageBookmarks(): Message[];
      getMessageReminders(): Message[];
      getOverdueMessageReminderCount();
      getSavedMessage(channelId: string, messageId: string): Message | null;
      getSavedMessageCount(): number;
      getSavedMessages(): Message[];
      hasOverdueReminder(): boolean;
      isMessageBookmarked(): boolean;
      isMessageReminder(): boolean;
      initialize(): void;
    }
  }

  const SavedMessagesStore: Stores.SavedMessagesStore;
}
