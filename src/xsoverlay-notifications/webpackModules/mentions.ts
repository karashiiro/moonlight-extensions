import spacepack from "@moonlight-mod/wp/spacepack_spacepack";

const logger = moonlight.getLogger("xsoverlay-notifications/mentions");

const MentionUtilsModule = spacepack.findByCode("isRawMessageMentioned")[0].exports;
export const isMentioned = MentionUtilsModule;

logger.info("Loaded mention utilities");
