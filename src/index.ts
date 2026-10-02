"use strict";

import { Settings, Region } from "osrs-sdk";

import { InfernoRegion } from "./content/inferno/js/InfernoRegion";
import { InfernoSettings } from "./content/inferno/js/InfernoSettings";
import { LastRowRegion } from "./content/lastrow/js/LastRowRegion";
import { startTrainer } from "./bootstrap";

Settings.readFromStorage();
InfernoSettings.readFromStorage();

// Choose the region based on the URL.
const AVAILABLE_REGIONS = {
  'inferno.html': () => new InfernoRegion(),
  'lastrow.html': () => new LastRowRegion(),
};
const DEFAULT_REGION_PATH = 'inferno.html';

const regionName = window.location.pathname.split('/').pop();
const selectedRegion: Region = (regionName in AVAILABLE_REGIONS)
  ? AVAILABLE_REGIONS[regionName]()
  : AVAILABLE_REGIONS[DEFAULT_REGION_PATH]();

startTrainer(selectedRegion);
