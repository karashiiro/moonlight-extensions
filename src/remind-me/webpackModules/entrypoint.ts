import someLibrary from "@moonlight-mod/wp/remind-me_someLibrary";

const logger = moonlight.getLogger("remind-me/entrypoint");
logger.info("Hello from entrypoint!");
logger.info("someLibrary exports:", someLibrary);

const natives = moonlight.getNatives("remind-me");
logger.info("node exports:", natives);
