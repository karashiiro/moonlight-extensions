const logger = moonlight.getLogger("remind-me/savedMessagesShim");
logger.info("Loaded saved messages shim");

export function putSavedMessage(message: unknown) {
  logger.info("Saving message");
  logger.info(message);
  return Promise.resolve();
}

export function deleteSavedMessage(message: unknown) {
  logger.info("Deleting saved message");
  logger.info(message);
  return Promise.resolve(true);
}

export function getSavedMessages() {
  logger.info("Updating saved messages");
  return Promise.resolve();
}
