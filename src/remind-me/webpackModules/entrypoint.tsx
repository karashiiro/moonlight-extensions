import spacepack from "@moonlight-mod/wp/spacepack_spacepack";

const logger = moonlight.getLogger("remind-me/entrypoint");
logger.info("Hello from entrypoint!");

/* As of 1/11/2025
2818: Bookmarks and reminders experiment
141321: Inbox button
178088: Tab router
192720: Saved message API
686478: Response-mapping utils for the saved message API
742989: Todos experiment
768943: SavedMessagesStore
791914: Tab bar
956961: Reminders tab
*/
logger.info(`Test code:\n${spacepack.inspect(791914)}`);
//logger.info("Test scan:", spacepack.findByCode("RecentsHeader"));
