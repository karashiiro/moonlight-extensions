import spacepack from "@moonlight-mod/wp/spacepack_spacepack";

const logger = moonlight.getLogger("xsoverlay-notifications/muteStore");

const MuteStoreModule = spacepack.findByCode("isSuppressEveryoneEnabled")[0].exports;
export const MuteStore = MuteStoreModule;

logger.info("Loaded MuteStore");
