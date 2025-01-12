import { SavedMessageData, SavedMessagesStore } from "@moonlight-mod/wp/remind-me_savedMessagesStore";

const logger = moonlight.getLogger("remind-me/savedMessagesShim");
logger.info("Loaded saved messages shim");

logger.info(SavedMessagesStore);

export function putSavedMessage(message: SavedMessageData): Promise<void> {
  // Save message metadata to external resource (no Flux interaction)
  logger.info("Saving message");
  logger.info(message);
  return Promise.resolve();
}

export function deleteSavedMessage(message: SavedMessageData): Promise<boolean> {
  // Delete message metadata from external resource (no Flux interaction)
  logger.info("Deleting saved message");
  logger.info(message);
  return Promise.resolve(true);
}

export function getSavedMessages(): Promise<void> {
  /*
  Fetch full messages and dispatch a Flux store event like this:

  { type: "SAVED_MESSAGES_UPDATE", savedMessages: SavedMessage[] }
  */
  logger.info("Updating saved messages");
  return Promise.resolve();
}
