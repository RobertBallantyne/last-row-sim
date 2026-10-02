"use strict";

// Entry point for the Last Row page. It only imports Last Row content, so the page doesn't load
// (or need hosting for) the Inferno's models.
import { Settings } from "osrs-sdk";

import { LastRowRegion } from "./content/lastrow/js/LastRowRegion";
import { startTrainer } from "./bootstrap";

Settings.readFromStorage();

startTrainer(new LastRowRegion());
