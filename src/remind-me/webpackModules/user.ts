import spacepack from "@moonlight-mod/wp/spacepack_spacepack";

const logger = moonlight.getLogger("remind-me/user");
logger.info("Loading User");

const modules = spacepack.findByCode(/getAvatarURL\(\w{1,2},\w{1,2}\){/);
if (modules.length === 0) {
  logger.error("Failed to find any modules matching User class");
}

if (modules.length > 1) {
  logger.warn("Found multiple modules matching User class");
}

export const User = modules[0].exports.Z;
