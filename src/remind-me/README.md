# Remind Me
Enables the Bookmarks and Reminders experiments in the Inbox, and patches them to make them usable.

## Public API
This extension is built on the client's existing data flows and does not expose its own API. The
relevant dispatcher events are:
- `SAVED_MESSAGE_CREATE`: Dispatched when a message is saved.
  - `savedMessage`: The message data.
    - `message`: The full message class instance.
    - `saveData`: The saved message metadata.
      - `channelId`: The containing channel ID.
      - `messageId`: The message ID.
      - `dueAt`: The optional due time, for messages saved as reminders.
- `SAVED_MESSAGE_DELETE`: Dispatched when a message is unsaved.
  - `savedMessageData`: The message data. See `saveData` under `SAVED_MESSAGE_CREATE` for fields.
- `SAVED_MESSAGES_UPDATE`: Dispatched when the local list of saved messages needs to be updated.
  This is only dispatched sometimes, so *don't* rely on it, but *do* subscribe to it to keep your
  own state consistent with Discord's store.
  - `savedMessages`: An array of messages. See `savedMessage` under `SAVED_MESSAGE_CREATE` for fields.

The store for this data is called `SavedMessagesStore`, and its module can be retrieved with
`spacepack.findByCode('"SavedMessagesStore"')`. Its current API is shown here:
```ts
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
```