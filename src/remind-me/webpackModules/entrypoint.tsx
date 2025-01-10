import someLibrary from "@moonlight-mod/wp/remind-me_someLibrary";
import ContextMenu, { MenuItem } from "@moonlight-mod/wp/contextMenu_contextMenu";
import React from "@moonlight-mod/wp/react";
import { MenuElement } from "@moonlight-mod/types/coreExtensions/contextMenu";

const logger = moonlight.getLogger("remind-me/entrypoint");
logger.info("Hello from entrypoint!");
logger.info("someLibrary exports:", someLibrary);

const natives = moonlight.getNatives("remind-me");
logger.info("node exports:", natives);

// hack because types are broken
const RemindMeMenuItem = (<MenuItem id="remind-me" label="Remind Me" />) as unknown as MenuElement;

logger.info("Adding Remind Me to message context menu");

// Add the menu item to the "message" and "message-actions" (the ... button) context menus, after "Copy Message Link"
ContextMenu.addItem("message", () => RemindMeMenuItem, "copy-link");
ContextMenu.addItem("message-actions", () => RemindMeMenuItem, "copy-link");
