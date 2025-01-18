import Flux from "@moonlight-mod/wp/discord/packages/flux";
import Dispatcher from "@moonlight-mod/wp/discord/Dispatcher";

const logger = moonlight.getLogger("remind-me/savedMessagesPersistedStore");
logger.info("Loaded savedMessagesPersistedStore");

type Database = Record<string, SavedMessageData>;

interface SavedMessagesState {
  db: Database;
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
      savedMessages.db = hydrateStore(state.db);
    }

    logger.info("Initialized SavedMessagesPersistedStore", savedMessages);
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

function hydrateStore(db: Database): Database {
  for (const k in db) {
    // During serialization, dates regress to strings and we need to convert them back
    const dueAt: unknown = db[k].dueAt;
    if (typeof dueAt === "string") {
      db[k].dueAt = new Date(dueAt);
    }
  }

  return db;
}

SavedMessagesPersistedStore.persistKey = "SavedMessagesPersistedStore";
const savedMessagesPersistedStore = new SavedMessagesPersistedStore();

export { savedMessagesPersistedStore as SavedMessagesPersistedStore };
