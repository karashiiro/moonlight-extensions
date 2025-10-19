import spacepack from "@moonlight-mod/wp/spacepack_spacepack";

const logger = moonlight.getLogger("xsoverlay-notifications/channelTypes");

const ConstantsModule = spacepack.findByCode("ChannelTypes:{")[0].exports;
export const ChannelTypes = ConstantsModule.ChannelTypes;

logger.info("Loaded ChannelTypes", ChannelTypes);
