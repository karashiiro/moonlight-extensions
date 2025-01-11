import spacepack from "@moonlight-mod/wp/spacepack_spacepack";

const logger = moonlight.getLogger("remind-me/entrypoint");
logger.info("Hello from entrypoint!");

/*
2818: Bookmarks and reminders experiment
141321: Inbox button
178088: Tab router
192720: "Saved message" API (TODO: intercept calls here)
742989: Todos experiment
768943: SavedMessagesStore
791914: Tab bar
956961: Reminders tab
*/
logger.info(`Test code:\n${spacepack.inspect(178088)}`);
//logger.info("Test scan:", spacepack.findByCode("RecentsHeader"));
