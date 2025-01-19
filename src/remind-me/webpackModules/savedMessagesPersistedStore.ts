import Flux from "@moonlight-mod/wp/discord/packages/flux";
import Dispatcher from "@moonlight-mod/wp/discord/Dispatcher";
import { UserStore } from "@moonlight-mod/wp/common_stores";

const logger = moonlight.getLogger("remind-me/savedMessagesPersistedStore");
logger.info("Loaded savedMessagesPersistedStore");

type SavedMessageKey = `${Snowflake}-${Snowflake}`;

interface SavedMessageDatabaseEntry {
  message: unknown;
  saveData: SavedMessageData;
}

type SavedMessageDatabaseV1 = Record<SavedMessageKey, SavedMessageData>;
type SavedMessageDatabaseV2 = Record<SavedMessageKey, SavedMessageDatabaseEntry>;

type DatabaseV1 = SavedMessageDatabaseV1;
type DatabaseV2 = Record<Snowflake, SavedMessageDatabaseV1>;
type DatabaseV3 = Record<Snowflake, SavedMessageDatabaseV2>;

interface SavedMessagesState {
  /** The initial database version. */
  db: DatabaseV1;
  /** Added support for storing data for multiple users. */
  db2: DatabaseV2;
  /** [BREAKING: DATA LOSS] Storing message payloads alongside messages to avoid additional API calls. */
  db3: DatabaseV3;
}

/**
 * The store state. Apparently this doesn't get persisted correctly if it's
 * stored as a class field.
 */
const savedMessages: SavedMessagesState = {
  db: {},
  db2: {},
  db3: {}
};

/**
 * Persisted data for saved messages. This store handles storing bookmarks and reminders
 * across accounts. All store mutations implicitly only affect the current user.
 */
class SavedMessagesPersistedStore extends Flux.PersistedStore<any> {
  constructor() {
    super(Dispatcher, {});
  }

  /**
   * Initializes the store, loading previously-saved state into the current application state.
   * This is expected to always have been called exactly once before other mutating actions occur.
   * @param state The previously-saved state of the store. This will be undefined if the store was never initialized.
   */
  initialize(state?: Partial<SavedMessagesState>) {
    if (state?.db3) {
      // Hydrate database objects
      for (const userId in state.db3) {
        assertSnowflakeUnsafe(userId);
        savedMessages.db3[userId] = hydrateStore(state.db3[userId]);
      }
    }

    logger.info("Initialized SavedMessagesPersistedStore", savedMessages);
  }

  /**
   * Saves message data to the store.
   * @param message The raw message payload.
   * @param saveData The message metadata to save.
   */
  putSavedMessage(message: unknown, saveData: SavedMessageData): void {
    const key = createKey(saveData);
    this.getCurrentUserDb()[key] = {
      message: message,
      saveData: {
        ...saveData,
        savedAt: Date.now()
      }
    };

    this.emitChange();
  }

  /**
   * Deletes a saved message from the store.
   * @param saveData The message data to delete.
   * @returns Whether or not anything was deleted.
   */
  deleteSavedMessage(saveData: SavedMessageData): boolean {
    const key = createKey(saveData);
    if (!(key in this.getCurrentUserDb())) {
      return false;
    }

    delete this.getCurrentUserDb()[key];
    this.emitChange();

    return true;
  }

  /**
   * Returns all saved message data currently in the store.
   * @returns The saved message data.
   */
  getSavedMessages(): SavedMessageDatabaseEntry[] {
    return Object.values(this.getCurrentUserDb());
  }

  /**
   * Returns a copy of the data in the store. When the application re-initializes, the
   * initialize() function will be called with the value returned from this function.
   * For some reason, state gets lost if the data object is returned directly, so we
   * need to be sure we're creating a copy of the data here (a shallow copy is fine).
   * @returns The current store state.
   */
  getState() {
    return { ...savedMessages };
  }

  private getCurrentUserDb(): SavedMessageDatabaseV2 {
    return this.getUserDb(getCurrentUserId());
  }

  private getUserDb(userId: Snowflake): SavedMessageDatabaseV2 {
    return (savedMessages.db3[userId] ||= {});
  }
}

/**
 * Gets the ID of the current user. This appears to be defined from the
 * moment the store initializes.
 * @returns The ID of the current user.
 */
function getCurrentUserId(): Snowflake {
  return UserStore.getCurrentUser().id;
}

/**
 * Creates a database key for the provided message.
 * @param data The saved message data.
 * @returns A database key corresponding to the message data.
 */
function createKey(data: SavedMessageData): SavedMessageKey {
  return `${data.channelId}-${data.messageId}`;
}

/**
 * Asserts that the provided value is a Snowflake. This doesn't actually
 * assert anything at runtime, it's just an unsafe type assertion.
 * @param _value The value to assert on.
 */
function assertSnowflakeUnsafe(_value: string): asserts _value is Snowflake {
  return;
}

/**
 * Asserts that the provided value is a database key. This doesn't actually
 * assert anything at runtime, it's just an unsafe type assertion.
 * @param _value The value to assert on.
 */
function assertKeyUnsafe(_value: string): asserts _value is SavedMessageKey {
  return;
}

/**
 * Hydrates the provided database. When data is persisted, it is serialized and loses
 * all class instance information. The application expects some fields to be class instances,
 * so we need to manually deserialize them to non-primitive types here.
 * @param db The database to hydrate.
 * @returns The input object reference.
 */
function hydrateStore(db: SavedMessageDatabaseV2): SavedMessageDatabaseV2 {
  for (const k in db) {
    assertKeyUnsafe(k);

    // During serialization, dates regress to strings and we need to convert them back
    const dueAt: unknown = db[k].saveData.dueAt;
    if (typeof dueAt === "string") {
      db[k].saveData.dueAt = new Date(dueAt);
    }
  }

  return db;
}

//@ts-expect-error This is defined on PersistedStore, unclear why TS is complaining
SavedMessagesPersistedStore.persistKey = "SavedMessagesPersistedStore";
const savedMessagesPersistedStore = new SavedMessagesPersistedStore();

export { savedMessagesPersistedStore as SavedMessagesPersistedStore };
