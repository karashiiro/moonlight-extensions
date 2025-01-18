import Flux from "@moonlight-mod/wp/discord/packages/flux";
import Dispatcher from "@moonlight-mod/wp/discord/Dispatcher";
import { UserStore } from "@moonlight-mod/wp/common_stores";

const logger = moonlight.getLogger("remind-me/savedMessagesPersistedStore");
logger.info("Loaded savedMessagesPersistedStore");

type Snowflake = `${number}`;
type SavedMessageKey = `${Snowflake}-${Snowflake}`;

type SavedMessageDatabase = Record<SavedMessageKey, SavedMessageData>;
type DatabaseV1 = SavedMessageDatabase;
type DatabaseV2 = Record<Snowflake, SavedMessageDatabase>;

interface SavedMessagesState {
  db: DatabaseV1;
  db2: DatabaseV2;
}

const savedMessages: SavedMessagesState = {
  db: {},
  db2: {}
};

class SavedMessagesPersistedStore extends Flux.PersistedStore<any> {
  constructor() {
    super(Dispatcher, {});
  }

  initialize(state?: Partial<SavedMessagesState>) {
    if (state?.db && hasProperties(state.db)) {
      // Migrate from V1 to V2 format (support multi-account usage)
      state.db2 = { [getCurrentUserId()]: hydrateStore(state.db) };
    }

    if (state?.db2) {
      // Hydrate database objects
      for (const userId in state.db2) {
        assertSnowflakeUnsafe(userId);
        savedMessages.db2[userId] = hydrateStore(state.db2[userId]);
      }
    }

    logger.info("Initialized SavedMessagesPersistedStore", savedMessages);
  }

  putSavedMessage(data: SavedMessageData): void {
    const key = createKey(data);
    this.getCurrentUserDb()[key] = {
      ...data,
      savedAt: Date.now()
    };

    this.emitChange();
  }

  deleteSavedMessage(data: SavedMessageData): boolean {
    const key = createKey(data);
    if (!(key in savedMessages.db2)) {
      return false;
    }

    delete this.getCurrentUserDb()[key];
    this.emitChange();

    return true;
  }

  getSavedMessages(): SavedMessageData[] {
    return Object.values(this.getCurrentUserDb());
  }

  getState() {
    return { ...savedMessages };
  }

  private getCurrentUserDb(): SavedMessageDatabase {
    return this.getUserDb(getCurrentUserId());
  }

  private getUserDb(userId: Snowflake): SavedMessageDatabase {
    return (savedMessages.db2[userId] ||= {});
  }
}

function getCurrentUserId(): Snowflake {
  return UserStore.getCurrentUser().id;
}

function createKey(data: SavedMessageData): SavedMessageKey {
  return `${data.channelId}-${data.messageId}`;
}

function assertSnowflakeUnsafe(_value: string): asserts _value is Snowflake {
  return;
}

function assertKeyUnsafe(_value: string): asserts _value is SavedMessageKey {
  return;
}

function hasProperties(o: unknown) {
  return Object.entries(o || {}).length > 0;
}

function hydrateStore(db: SavedMessageDatabase): SavedMessageDatabase {
  for (const k in db) {
    assertKeyUnsafe(k);

    // During serialization, dates regress to strings and we need to convert them back
    const dueAt: unknown = db[k].dueAt;
    if (typeof dueAt === "string") {
      db[k].dueAt = new Date(dueAt);
    }
  }

  return db;
}

//@ts-expect-error This is defined on PersistedStore, unclear why TS is complaining
SavedMessagesPersistedStore.persistKey = "SavedMessagesPersistedStore";
const savedMessagesPersistedStore = new SavedMessagesPersistedStore();

export { savedMessagesPersistedStore as SavedMessagesPersistedStore };
