import { SavedMessagesStore } from "@moonlight-mod/wp/remind-me_savedMessagesStore";

interface SavedMessage {
  channelId: string;
  messageId: string;
}

const logger = moonlight.getLogger("remind-me/savedMessagesShim");
logger.info("Loaded saved messages shim");

logger.info(SavedMessagesStore);

export function putSavedMessage(message: SavedMessage): Promise<void> {
  // Save message metadata to external resource (no Flux interaction)
  logger.info("Saving message");
  logger.info(message);
  return Promise.resolve();
}

export function deleteSavedMessage(message: SavedMessage): Promise<boolean> {
  // Delete message metadata from external resource (no Flux interaction)
  logger.info("Deleting saved message");
  logger.info(message);
  return Promise.resolve(true);
}

export function getSavedMessages(): Promise<void> {
  /*
  Fetch full messages and dispatch a Flux store event like this:

  { type: "SAVED_MESSAGES_UPDATE", savedMessages: [{ message: { ... }, saveData: { ??? } }] }
  */
  logger.info("Updating saved messages");
  return Promise.resolve();
}
