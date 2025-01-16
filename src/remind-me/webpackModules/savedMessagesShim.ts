import { SavedMessageData, SavedMessagesStore } from "@moonlight-mod/wp/remind-me_savedMessagesStore";
import { MessageStore } from "@moonlight-mod/wp/common_stores";
import Dispatcher from "@moonlight-mod/wp/discord/Dispatcher";
import { Message } from "@moonlight-mod/wp/remind-me_message";

const logger = moonlight.getLogger("remind-me/savedMessagesShim");
logger.info("Loaded saved messages shim");

logger.info(SavedMessagesStore);

const db: Record<string, SavedMessageData> = {};

export function putSavedMessage(data: SavedMessageData): Promise<void> {
  // Save message metadata to external resource (no Flux interaction)
  // TODO: Should we dispatch an event here to make the UI update?
  // The original code doesn't and it looks like nothing happens.
  logger.info("Saving message", data);
  db[`${data.channelId}-${data.messageId}`] = {
    ...data,
    savedAt: Date.now()
  };

  return Promise.resolve();
}

export function deleteSavedMessage(data: SavedMessageData): Promise<boolean> {
  // Delete message metadata from external resource (no Flux interaction)
  // TODO: Should we dispatch an event here to make the UI update?
  // The original code doesn't and it looks like nothing happens.
  logger.info("Deleting saved message", data);
  delete db[`${data.channelId}-${data.messageId}`];
  return Promise.resolve(true);
}

function mapMessage(m: any, saveData: SavedMessageData): any {
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

export function getSavedMessages(): Promise<void> {
  // if (!SavedMessagesStore.getIsStale()) {
  //   return Promise.resolve();
  // }

  /*
  Fetch full messages and dispatch a Flux store event like this:

  { type: "SAVED_MESSAGES_UPDATE", savedMessages: SavedMessage[] }
  */
  logger.info("Updating saved messages");

  const messages: [any, SavedMessageData][] = Object.values(db).map((d) => {
    const message = MessageStore.getMessage(d.channelId, d.messageId);
    logger.info(message);
    return [message, d];
  });

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
