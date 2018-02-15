# Stackmaster

![Brief gameplay demonstration](https://media.giphy.com/media/3ohs4o9idZAfMhNqyk/giphy.gif)

Stackmaster is a falling block game that emulates the ruleset of the first game in the TGM series. The game is coded in HTML/CSS/JS and uses React to render the UI.

[A live demo can be played here.](https://codepen.io/jwc907/full/qxBVKr) The game will run on the latest version of Chrome and Firefox; other browsers are currently unsupported.

The TGM variants of the falling block game are specifically designed to facilitate precise gameplay at high speeds. The example gif above shows gameplay at "20G" (a piece will fall from the top of the well to the bottom in 1/60th of a second). For those interested, a detailed explanation of the mechanics can be found [here.](http://kitaru.1101b.com/TGMGUIDE/)

## Installation

This project was made with Create React App. To play this game locally on your machine, install Create React App, create a new project, copy over the contents of this project, and start the app through the Node.js command line.

## Version History
* 0.01 - Initial release

## Future Plans

Features and changes to be implemented in the short term:
* Refactoring, debug mode, test suite
* Documentation outlining overall code structure and design decisions
* Basic graphics options - draggable play area, resizing, etc.
* Keyboard settings
* Missing features from TGM1: ghost piece, timer, scoring/grading system, playable credits roll
* Sound effects
* Extended browser support
* TGM2 rulesets (Master, T.A. Death)
* Benchmarking and optimization

Features which would be nice to have in the long term:
* UI/graphics overhaul
* Music + custom soundtracks
* Native support for joysticks
* Desktop app
* Stats tracking
* Replays
* Leaderboards
* Gameplay customization options
* TGM3 rulesets
* Netplay

## License

This project uses the MIT License.
