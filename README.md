# Last Row Sim

A practice simulator for the last row of Tumeken's Warden (Tombs of Amascut, phase 3 enrage): red lightning,
Ba-Ba's boulders and Zebak's jugs and rocks, on real 600ms game ticks with OSRS movement, prayers and inventory.

## Features

- Lightning patterns, boulder and Zebak timings based on the GameMaker Last Row Sim's in-game research
- Raid level (Warden HP/Defence, damage) and Zebak/Ba-Ba path levels, or switch either phantom off
- Supply presets (Helpful Spirit / own supplies / no brews) with ambrosia, blessed crystal scarabs, smelling salts,
  ranging potions and the keris partisan of the sun's Tumeken's Light special
- Lightbearer toggle, saved inventory layouts, and a boss health bar
- Game models exported from the OSRS cache

## Credits

- **[GameMaker Last Row Sim](https://gx.games/games/6f00u8/last-row-sim/)**: the mechanics and tick timings this
  sim is based on.
- **[Inferno Trainer](https://github.com/OldSchoolSDK/InfernoTrainer)** and its game engine
  **[osrs-sdk](https://github.com/OldSchoolSDK/osrs-sdk)** by the OldSchoolSDK contributors: this project is a
  modified version of the Inferno Trainer, and the engine does the heavy lifting (ticks, pathing, combat, prayers,
  inventory, rendering).
- **[osrscachereader](https://github.com/Dezinater/osrscachereader)**: used to export the models.
- **[OSRS Wiki](https://oldschool.runescape.wiki/)**: item effects and boss stats.

All game assets are property of Jagex. This project is licensed under the GNU GPL v3 (see `LICENSE`), as is the
Inferno Trainer it's built on.

## Running it locally

    npm install
    npm run start

Then open http://localhost:8000/lastrow.html (the Inferno is still at http://localhost:8000/).

## Building the hosted site

    npm run build:hosted

This builds only the Last Row Sim into `dist/`, as the site's front page, with the engine's models served from
`cdn/` (regenerated from the game cache) so it works on any static host. Upload `dist/` to the host.

## Code layout

- `src/content/lastrow/`: the Last Row Sim (region, Warden, phantoms, attacks, supplies, settings)
- `src/lastrow.ts`: the Last Row page's entry point; `src/bootstrap.ts`: start-up shared with the Inferno page
- `cdn/`: engine models regenerated from the game cache (see `assets.md` for the export commands)
- `test/content/lastrow/`: tests for the attack patterns, scaling and inventory layouts

Running the Last Row tests:

    npx jest --config "{\"preset\":\"ts-jest\",\"testEnvironment\":\"node\",\"rootDir\":\".\"}" test/content/lastrow

---

# Original Inferno Trainer README

- [Click here to try the Inferno Trainer](https://www.infernotrainer.com/)
- [Click here to beta test the Inferno Trainer](https://beta.infernotrainer.com/)
- [Join our Discord](https://discord.gg/Z3ZyY7Yzt5)

## What is this project?

This project stemmed from my interest in Old School Runescape's Inferno, and my desire for an open source, relatively clean re-implementation of the Old School Runescape engine. The underlying code is designed closer to a true game engine compared to any other trainer or simulator. The goal is for there to be a clean, well-defined API between all "Game Content" code and any underlying "Engine" code

## How do I use it?

### Pick your own waves

If you want to practice a wave, click one of the links above. You can type in a wave and it will produce a random spawn, and you can re-play the exact spawn if you wish.

### Practice a wave I failed in-game

Alternatively, if you are practicing the Inferno and have the Inferno Stats plugin (Available on RuneLite's Plugin Hub), you can click a wave in the panel and it will load the simulation with the exact spawn. I would recommend you disable the "Hide when outside of the Inferno" feature for when you plank.

## I found a bug!

Likely. Please open a issue above. Videos, screenshots, proof of OSRS science, etc is appreciated. I want this to be a faithful re-implementation of OSRS and all bugs are appreciated.

## Can I contribute?

Sure. Right now the code is undergoing rapid development and the API is not stable. I am open to pull requests but I suggest you start small and let me talk to you first to make sure we're aligned.

## Development notes

Use Node 16 for now. There's an SSL error on version >= 18.

    npm run start

Running test

    npx jest
