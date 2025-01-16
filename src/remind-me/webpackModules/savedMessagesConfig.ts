import type { SavedMessageData } from "@moonlight-mod/wp/remind-me_savedMessagesStore";

export class SavedMessagesConfig {
  private readonly logger = moonlight.getLogger("remind-me/SavedMessages");
  private db: Record<string, SavedMessageData> = {};
  private loaded = false;

  putSavedMessage(data: SavedMessageData): void {
    const key = this.createKey(data);
    this.db[key] = {
      ...data,
      savedAt: Date.now()
    };

    this.save();
  }

  deleteSavedMessage(data: SavedMessageData): boolean {
    const key = this.createKey(data);
    if (!(key in this.db)) {
      return false;
    }

    delete this.db[key];
    this.save();

    return true;
  }

  getSavedMessages(): SavedMessageData[] {
    if (!this.loaded) {
      this.load();
      this.loaded = true;
    }

    return Object.values(this.db);
  }

  private createKey(data: SavedMessageData): string {
    return `${data.channelId}-${data.messageId}`;
  }

  private load() {
    try {
      const messages = loadSavedMessagesFromConfig();
      if (messages == null) {
        this.logger.info("No bookmarked messages, creating new database");
        this.db = {};
      } else {
        this.db = messages;
      }
    } catch (err) {
      this.logger.error("Failed to load bookmarked messages, starting clean", err);
      this.db = {};
    }
  }

  private save() {
    try {
      saveSavedMessagesToConfig(this.db);
    } catch (err) {
      this.logger.error("Failed to save bookmarked messages", err);
    }
  }
}

/**
 * Loads all saved messages from the extension config.
 * @returns The message database.
 */
function loadSavedMessagesFromConfig(): Record<string, SavedMessageData> | null {
  const messages = moonlight.getConfigOption<string>("remind-me", "messages");
  if (messages == null) {
    return null;
  }

  const messagesJson = atob(messages);
  return JSON.parse(messagesJson);
}

/**
 * Saves all saved messages to the extension config.
 * @param messages The message database.
 */
function saveSavedMessagesToConfig(messages: Record<string, SavedMessageData>) {
  const messagesJson = JSON.stringify(messages);
  const messagesBinary = btoa(messagesJson);
  moonlight.setConfigOption<string>("remind-me", "messages", messagesBinary);
}
