import { SavedMessagesStore } from "@moonlight-mod/wp/remind-me_savedMessagesStore";
import { mapMessage, SavedMessagesPersistedStore } from "@moonlight-mod/wp/remind-me_savedMessagesPersistedStore";
import { MessageStore } from "@moonlight-mod/wp/common_stores";
import Dispatcher from "@moonlight-mod/wp/discord/Dispatcher";
import { Message } from "@moonlight-mod/wp/remind-me_message";

const logger = moonlight.getLogger("remind-me/savedMessagesShim");
logger.info("Loaded saved messages shim");

/**
 * Stores a message in the saved-message store.
 * @param saveData The message data to save.
 */
export function putSavedMessage(saveData: SavedMessageData): Promise<void> {
  const message: Message =
    SavedMessagesPersistedStore.getSavedMessage(saveData)?.message ??
    MessageStore.getMessage(saveData.channelId, saveData.messageId);

  logger.info("Saving message", message, saveData);

  // Store the message data in our external store
  SavedMessagesPersistedStore.putSavedMessage(message, saveData);

  // Dispatch a UI event to populate the inbox
  Dispatcher.dispatch({
    type: "SAVED_MESSAGE_CREATE",
    savedMessage: { message, saveData }
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

  // Delete the message data from our external store
  if (!SavedMessagesPersistedStore.deleteSavedMessage(data)) {
    logger.info("Failed to delete saved message", data);
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

  // Fetch all messages from our external store
  const messages: { message: Message; saveData: SavedMessageData }[] =
    SavedMessagesPersistedStore.getSavedMessages().map(({ message, saveData }) => ({
      message: mapMessage(message, saveData),
      saveData: saveData
    }));

  logger.debug(messages);

  // Dispatch a UI event to populate the inbox
  Dispatcher.dispatch({
    type: "SAVED_MESSAGES_UPDATE",
    savedMessages: messages
  });
}
