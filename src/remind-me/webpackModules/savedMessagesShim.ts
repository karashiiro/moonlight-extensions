import { SavedMessageData, SavedMessagesStore } from "@moonlight-mod/wp/remind-me_savedMessagesStore";
import { MessageStore } from "@moonlight-mod/wp/common_stores";
import Dispatcher from "@moonlight-mod/wp/discord/Dispatcher";

const logger = moonlight.getLogger("remind-me/savedMessagesShim");
logger.info("Loaded saved messages shim");

logger.info(SavedMessagesStore);

const db: Record<string, SavedMessageData> = {};

export function putSavedMessage(data: SavedMessageData): Promise<void> {
  // Save message metadata to external resource (no Flux interaction)
  logger.info("Saving message", data);
  db[`${data.channelId}-${data.messageId}`] = data;
  return Promise.resolve();
}

export function deleteSavedMessage(data: SavedMessageData): Promise<boolean> {
  // Delete message metadata from external resource (no Flux interaction)
  logger.info("Deleting saved message", data);
  delete db[`${data.channelId}-${data.messageId}`];
  return Promise.resolve(true);
}

function mapMessage(m: any): any {
  return {
    ...m,
    channelId: m.channel_id,
    messageId: m.message_id
  };
}

export function getSavedMessages(): Promise<void> {
  /*
  Fetch full messages and dispatch a Flux store event like this:

  { type: "SAVED_MESSAGES_UPDATE", savedMessages: SavedMessage[] }
  */
  logger.info("Updating saved messages");

  const messages = Object.values(db).map((d) => {
    const message = MessageStore.getMessage(d.channelId, d.messageId);
    logger.info(message);
    return message;
  });

  Dispatcher.dispatch({
    type: "SAVED_MESSAGES_UPDATE",
    savedMessages: messages.map((message) => ({
      message: mapMessage(message),
      saveData: db[`${message.channel_id}-${message.message_id}`]
    }))
  });

  return Promise.resolve();
}
