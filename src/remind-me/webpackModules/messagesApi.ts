import spacepack from "@moonlight-mod/wp/spacepack_spacepack";

const logger = moonlight.getLogger("remind-me/messagesApi");
logger.info("Loading messages API");

const modules = spacepack.findByCode(/sendClydeError\(.\){/);
if (modules.length === 0) {
  logger.error("Failed to find any modules matching messages API");
}

if (modules.length > 1) {
  logger.warn("Found multiple modules matching messages API");
}

export const MessagesAPI = modules[0].exports.Z;
