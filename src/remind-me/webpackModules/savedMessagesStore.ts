import spacepack from "@moonlight-mod/wp/spacepack_spacepack";

const logger = moonlight.getLogger("remind-me/savedMessagesStore");
logger.info("Loading SavedMessagesStore");

const modules = spacepack.findByCode('"SavedMessagesStore"');
if (modules.length === 0) {
  logger.error("Failed to find any modules matching SavedMessagesStore");
}

if (modules.length > 1) {
  logger.warn("Found multiple modules matching SavedMessagesStore", modules);
}

export const SavedMessagesStore = modules[0].exports.Z;
