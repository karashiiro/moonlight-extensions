import Flux from "@moonlight-mod/wp/discord/packages/flux";
import Dispatcher from "@moonlight-mod/wp/discord/Dispatcher";
import type { SavedMessageData } from "@moonlight-mod/wp/remind-me_savedMessagesStore";

const logger = moonlight.getLogger("remind-me/savedMessagesPersistedStore");
logger.info("Loaded savedMessagesPersistedStore");

interface SavedMessagesState {
  db: Record<string, SavedMessageData>;
}

const savedMessages: SavedMessagesState = {
  db: {}
};

class SavedMessagesPersistedStore extends Flux.PersistedStore<SavedMessagesState> {
  constructor() {
    super(Dispatcher, {});
  }

  initialize(state?: SavedMessagesState) {
    if (state) {
      savedMessages.db = state.db;
    }

    logger.info("Initialized SavedMessagesPersistedStore");
  }

  putSavedMessage(data: SavedMessageData): void {
    const key = createKey(data);
    savedMessages.db[key] = {
      ...data,
      savedAt: Date.now()
    };

    this.emitChange();
  }

  deleteSavedMessage(data: SavedMessageData): boolean {
    const key = createKey(data);
    if (!(key in savedMessages.db)) {
      return false;
    }

    delete savedMessages.db[key];
    this.emitChange();

    return true;
  }

  getSavedMessages(): SavedMessageData[] {
    return Object.values(savedMessages.db);
  }

  getState() {
    return { ...savedMessages };
  }
}

function createKey(data: SavedMessageData): string {
  return `${data.channelId}-${data.messageId}`;
}

SavedMessagesPersistedStore.persistKey = "SavedMessagesPersistedStore";
const savedMessagesPersistedStore = new SavedMessagesPersistedStore();

export { savedMessagesPersistedStore as SavedMessagesPersistedStore };
