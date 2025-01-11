import someLibrary from "@moonlight-mod/wp/remind-me_someLibrary";
import ContextMenu, { MenuItem, MenuSeparator } from "@moonlight-mod/wp/contextMenu_contextMenu";
import React from "@moonlight-mod/wp/react";
import { MenuElement } from "@moonlight-mod/types/coreExtensions/contextMenu";
import spacepack from "@moonlight-mod/wp/spacepack_spacepack";

const logger = moonlight.getLogger("remind-me/entrypoint");
logger.info("Hello from entrypoint!");
logger.info("someLibrary exports:", someLibrary);

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

const natives = moonlight.getNatives("remind-me");
logger.info("node exports:", natives);

const RemindMeMenuItem = (
  <MenuItem id="remind-me" label="Remind Me">
    <MenuItem id="remind-me-30m" label="In 30 Minutes" action={() => {}} />
    <MenuItem id="remind-me-1h" label="In 1 Hour" action={() => {}} />
    <MenuItem id="remind-me-3h" label="In 3 Hours" action={() => {}} />
    <MenuItem id="remind-me-24h" label="In 24 Hours" action={() => {}} />
    <MenuSeparator />
    <MenuItem id="remind-me-custom" label="Custom..." action={() => {}} />
  </MenuItem>
) as unknown as MenuElement; // hack because types are broken

logger.info("Adding Remind Me to message context menu");

// Add the menu item to the "message" and "message-actions" (the ... button) context menus, after "Copy Message Link"
ContextMenu.addItem("message", () => RemindMeMenuItem, "copy-link");
ContextMenu.addItem("message-actions", () => RemindMeMenuItem, "copy-link");
