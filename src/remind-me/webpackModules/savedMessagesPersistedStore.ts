import Flux from "@moonlight-mod/wp/discord/packages/flux";
import Dispatcher from "@moonlight-mod/wp/discord/Dispatcher";
import { UserStore } from "@moonlight-mod/wp/common_stores";
import { Message } from "@moonlight-mod/wp/remind-me_message";
import { User } from "@moonlight-mod/wp/remind-me_user";

const logger = moonlight.getLogger("remind-me/savedMessagesPersistedStore");
logger.info("Loaded savedMessagesPersistedStore");

type SavedMessageKey = `${Snowflake}-${Snowflake}`;

interface SavedMessageDatabaseEntry {
  message: any;
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
    super(Dispatcher, {
      // The client handles updating the Bookmarks UI automatically when these are dispatched, but
      // we still need to handle persistence or else it'll be wrong after a reload.
      MESSAGE_UPDATE: ({ message }: { message: any }) => this.onMessageUpdate(message),
      MESSAGE_DELETE: ({ id, channelId }: { id: Snowflake; channelId: Snowflake }) =>
        this.onMessageDelete(id, channelId),
      LOAD_MESSAGES_SUCCESS: ({ channelId, messages }: { channelId: Snowflake; messages: any[] }) =>
        this.onLoadMessagesSuccess(channelId, messages)
    });
  }

  /** MESSAGE_UPDATE */
  onMessageUpdate(message: any) {
    const saveData = { channelId: message.channel_id, messageId: message.id };
    if (!this.hasSavedMessage(saveData)) {
      return;
    }

    const mappedMessage = mapMessage(message, saveData);
    logger.info("Updating saved message due to real message being updated", mappedMessage, saveData);
    this.putSavedMessage(mappedMessage, saveData);
  }

  /** MESSAGE_DELETE */
  onMessageDelete(messageId: Snowflake, channelId: Snowflake) {
    const saveData = { channelId, messageId };
    if (!this.hasSavedMessage(saveData)) {
      return;
    }

    logger.info("Deleting saved message due to real message being deleted", saveData);
    this.deleteSavedMessage(saveData);

    // Unlike other cases where messages are updated (controlled by MessageStore), this
    // requires updating SavedMessageStore, which we need to do explicitly to make the
    // UI update.
    Dispatcher.dispatch({
      type: "SAVED_MESSAGE_DELETE",
      savedMessageData: saveData
    });
  }

  /** LOAD_MESSAGES_SUCCESS */
  onLoadMessagesSuccess(channelId: Snowflake, messages: any[]) {
    let updatedAny = false;
    for (const message of messages) {
      const saveData = { channelId: channelId, messageId: message.id };
      if (!this.hasSavedMessage(saveData)) {
        continue;
      }

      const mappedMessage = mapMessage(message, saveData);
      logger.info("Updating saved message due to receiving potentially-newer version", mappedMessage, saveData);
      this.putSavedMessage(mappedMessage, saveData);
      updatedAny = true;
    }

    if (updatedAny) {
      this.emitChange();
    }
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
   * Returns whether the provided message is saved or not.
   * @param saveData The message metadata.
   */
  hasSavedMessage(saveData: SavedMessageData): boolean {
    const key = createKey(saveData);
    return key in this.getCurrentUserDb();
  }

  getSavedMessage(saveData: SavedMessageData): SavedMessageDatabaseEntry | null {
    const key = createKey(saveData);
    const entry = this.getCurrentUserDb()[key];
    if (!entry) {
      return null;
    }

    const { message, saveData: saveData2 } = entry;
    return {
      message: mapMessage(message, saveData2),
      saveData: saveData2
    };
  }

  /**
   * Saves message data to the store.
   * @param message The raw message payload.
   * @param saveData The message metadata to save.
   */
  putSavedMessage(message: Message, saveData: SavedMessageData): void {
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
    if (!this.hasSavedMessage(saveData)) {
      return false;
    }

    const key = createKey(saveData);
    delete this.getCurrentUserDb()[key];
    this.emitChange();

    return true;
  }

  /**
   * Returns all saved message data currently in the store.
   * @returns The saved message data.
   */
  getSavedMessages(): SavedMessageDatabaseEntry[] {
    return Object.values(this.getCurrentUserDb()).map(({ message, saveData }) => ({
      message: mapMessage(message, saveData),
      saveData: saveData
    }));
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

    const entry = db[k];

    // During serialization, dates regress to strings and we need to convert them back
    const dueAt: unknown = entry.saveData.dueAt;
    if (typeof dueAt === "string") {
      entry.saveData.dueAt = new Date(dueAt);
    }
  }

  return db;
}

/**
 * Converts a raw message from the Discord API into a Message instance.
 * @param m A raw message payload.
 * @param saveData Saved message data for the payload.
 * @returns A structured Message object that can be used by the application.
 */
function mapMessage(m: any, saveData: SavedMessageData): Message {
  return new Message({
    ...m,
    channelId: m.channel_id,
    messageId: m.message_id,
    savedAt: new Date(saveData.savedAt ?? Date.now()),
    authorSummary: m.author_summary,
    channelSummary: m.channel_summary,
    messageSummary: m.message_summary,
    guildId: 0 === m.guild_id ? undefined : m.guild_id,
    authorId: (0 === m.author_id ? undefined : m.author_id) ?? m.author?.id,
    notes: m.notes,
    dueAt: null != saveData.dueAt ? new Date(saveData.dueAt) : undefined,
    editedTimestamp: m.editedTimestamp ?? m.edited_timestamp,
    author: m.author ? new User(m.author) : undefined,
    embeds: m.embeds?.map((embed: any) => {
      const color = embed.color;
      return {
        ...embed,
        color: typeof color === "number" ? asWebColor(color) : color
      };
    })
  });
}

/**
 * Converts the provided numeric color into a web-compliant hex string.
 * @param value The input color as an integer.
 * @returns The input color, converted into a color string.
 */
function asWebColor(value: number): string {
  const hexValue = value.toString(16).padStart(6, "0");
  return "#" + hexValue;
}

//@ts-expect-error This is defined on PersistedStore, unclear why TS is complaining
SavedMessagesPersistedStore.persistKey = "SavedMessagesPersistedStore";
const savedMessagesPersistedStore = new SavedMessagesPersistedStore();

export { savedMessagesPersistedStore as SavedMessagesPersistedStore, mapMessage };
