import { SavedMessageData, SavedMessagesStore } from "@moonlight-mod/wp/remind-me_savedMessagesStore";
import { MessageStore } from "@moonlight-mod/wp/common_stores";
import Dispatcher from "@moonlight-mod/wp/discord/Dispatcher";
import { Message } from "@moonlight-mod/wp/remind-me_message";

const logger = moonlight.getLogger("remind-me/savedMessagesShim");
logger.info("Loaded saved messages shim");

// TODO: Actual persistence
const db: Record<string, SavedMessageData> = {};

/**
 * Stores a message in the saved-message store.
 * @param data The message data to save.
 */
export function putSavedMessage(data: SavedMessageData): Promise<void> {
  logger.info("Saving message", data);

  // Store the message data in our external store
  db[`${data.channelId}-${data.messageId}`] = {
    ...data,
    savedAt: Date.now()
  };

  // Dispatch a UI event to populate the inbox
  const message = MessageStore.getMessage(data.channelId, data.messageId);
  Dispatcher.dispatch({
    type: "SAVED_MESSAGE_CREATE",
    savedMessage: {
      message: mapMessage(message, data),
      saveData: data
    }
  });

  return Promise.resolve();
}

/**
 * Deletes a message from the saved-message store.
 * @param data The message data to save.
 * @returns true if data was deleted; otherwise false.
 */
export function deleteSavedMessage(data: SavedMessageData): Promise<boolean> {
  logger.info("Deleting saved message", data);

  const key = `${data.channelId}-${data.messageId}`;
  if (!(key in db)) {
    return Promise.resolve(false);
  }

  // Delete the message fata from our external store
  delete db[key];

  // Dispatch a UI event to remove the message from the inbox
  Dispatcher.dispatch({
    type: "SAVED_MESSAGE_DELETE",
    savedMessageData: data
  });

  return Promise.resolve(true);
}

/**
 * Refreshes the saved-message store.
 */
export function getSavedMessages(): Promise<void> {
  if (!SavedMessagesStore.getIsStale()) {
    logger.debug("Saved message list is not yet stale, skipping update");
    return Promise.resolve();
  }

  logger.info("Updating saved messages");

  // Fetch all messages from our external store and pull the real message data from Discord
  const messages: [any, SavedMessageData][] = Object.values(db).map((d) => {
    const message = MessageStore.getMessage(d.channelId, d.messageId);
    logger.info(message);
    return [message, d];
  });

  // Dispatch a UI event to populate the inbox
  Dispatcher.dispatch({
    type: "SAVED_MESSAGES_UPDATE",
    savedMessages: messages.map(([message, saveData]) => {
      return {
        message: mapMessage(message, saveData),
        saveData: saveData
      };
    })
  });

  return Promise.resolve();
}

/**
 * Converts a raw message from the Discord API into a Message instance.
 * @param m A raw message payload.
 * @param saveData Saved message data for the payload.
 * @returns A structured Message object that can be used by the application.
 */
function mapMessage(m: any, saveData: SavedMessageData): Message {
  return new Message({
    ...m,
    channelId: m.channel_id,
    messageId: m.message_id,
    savedAt: new Date(saveData.savedAt ?? Date.now()),
    authorSummary: m.author_summary,
    channelSummary: m.channel_summary,
    messageSummary: m.message_summary,
    guildId: 0 === m.guild_id ? undefined : m.guild_id,
    authorId: 0 === m.author_id ? undefined : m.author_id,
    notes: m.notes,
    dueAt: null != saveData.dueAt ? new Date(saveData.dueAt) : undefined
  });
}
