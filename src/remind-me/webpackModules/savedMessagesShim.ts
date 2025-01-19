import { SavedMessagesPersistedStore } from "@moonlight-mod/wp/remind-me_savedMessagesPersistedStore";
import { MessageStore } from "@moonlight-mod/wp/common_stores";
import Dispatcher from "@moonlight-mod/wp/discord/Dispatcher";
import { Message } from "@moonlight-mod/wp/remind-me_message";
import { MessagesAPI } from "@moonlight-mod/wp/remind-me_messagesApi";
import { SavedMessagesStore } from "./savedMessagesStore";

const logger = moonlight.getLogger("remind-me/savedMessagesShim");
logger.info("Loaded saved messages shim");

/**
 * Stores a message in the saved-message store.
 * @param data The message data to save.
 */
export function putSavedMessage(data: SavedMessageData): Promise<void> {
  logger.info("Saving message", data);

  // Store the message data in our external store
  SavedMessagesPersistedStore.putSavedMessage(data);

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

  // Delete the message fata from our external store
  if (!SavedMessagesPersistedStore.deleteSavedMessage(data)) {
    return Promise.resolve(false);
  }

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
export async function getSavedMessages(): Promise<void> {
  if (!SavedMessagesStore.getIsStale()) {
    logger.debug("Saved message list is not yet stale, skipping update");
    return;
  }

  logger.info("Updating saved messages");

  // Fetch all messages from our external store and pull the real message data from Discord
  const savedMessages = SavedMessagesPersistedStore.getSavedMessages();
  const messages: [Message, SavedMessageData][] = [];

  for (const savedMessage of savedMessages) {
    const message = await getSavedMessage(savedMessage);
    if (message == null) continue;
    messages.push([message, savedMessage]);
  }

  logger.debug(messages);

  const unresolvedMessageCount = savedMessages.length - messages.length;
  if (unresolvedMessageCount > 0) {
    logger.warn(`Encountered ${unresolvedMessageCount} unresolved messages`);
  }

  // Dispatch a UI event to populate the inbox
  Dispatcher.dispatch({
    type: "SAVED_MESSAGES_UPDATE",
    savedMessages: messages.map(([message, saveData]) => ({ message, saveData }))
  });
}

/**
 * Retrieves a message from the {@link MessageStore}, or fetches it from the API if
 * it's not present.
 * @param param0 The channel and message IDs.
 * @returns The complete raw message.
 */
async function getSavedMessage(saveData: SavedMessageData): Promise<Message | null> {
  const { channelId, messageId } = saveData;

  // Try to get the message from the store
  const message = MessageStore.getMessage(channelId, messageId);
  if (message != null) return mapMessage(message, saveData);

  // If it's not present, we need to fetch it from the API
  try {
    logger.debug("Fetching message", messageId, "from channel", channelId);

    const fetchedMessageRaw = await MessagesAPI.fetchMessage({ channelId, messageId });
    const fetchedMessage = mapMessage(fetchedMessageRaw, saveData);

    // Cache the message so we don't need to fetch it next time
    Dispatcher.dispatch({
      type: "LOCAL_MESSAGES_LOADED",
      guildId: fetchedMessage.guildId,
      channelId: channelId,
      isPushNotification: false,
      users: [],
      messages: [fetchedMessageRaw],
      stale: true
    });

    return fetchedMessage;
  } catch (err) {
    logger.error("Failed to fetch message", err);
    return null;
  }
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
