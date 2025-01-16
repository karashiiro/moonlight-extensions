import spacepack from "@moonlight-mod/wp/spacepack_spacepack";

const logger = moonlight.getLogger("remind-me/message");
logger.info("Loading Message");

const modules = spacepack.findByCode(/this.messageReference=.\.messageReference/);
if (modules.length === 0) {
  logger.error("Failed to find any modules matching Message class");
}

if (modules.length > 1) {
  logger.warn("Found multiple modules matching Message class");
}

export const Message = modules[0].exports.ZP;
