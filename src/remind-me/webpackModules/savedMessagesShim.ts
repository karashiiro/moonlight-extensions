import { SavedMessagesStore } from "@moonlight-mod/wp/remind-me_savedMessagesStore";

interface SavedMessage {
  channelId: string;
  messageId: string;
}

const logger = moonlight.getLogger("remind-me/savedMessagesShim");
logger.info("Loaded saved messages shim");

logger.info(SavedMessagesStore);

export function putSavedMessage(message: SavedMessage) {
  logger.info("Saving message");
  logger.info(message);
  return Promise.resolve();
}

export function deleteSavedMessage(message: SavedMessage) {
  logger.info("Deleting saved message");
  logger.info(message);
  return Promise.resolve(true);
}

export function getSavedMessages() {
  logger.info("Updating saved messages");
  return Promise.resolve();
}
