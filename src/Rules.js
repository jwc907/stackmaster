/*
  Rules.js

  Contains rules which affect game mechanics and piece physics.
  Each mode defined in GameModes.js uses a subset of these rules
  to construct a complete game mode.
*/
import Pieces from './Pieces.js';
import Util from './Util.js';

var Rules = (function() {
  var module = {};

  // How fast does a piece fall?
  const Gravity = {};
  module.Gravity = Gravity;

  Gravity.Mode1 = function() {
    let levels = [  0,  30,  35,  40,  50,
                   60,  70,  80,  90, 100,
                  120, 140, 160, 170, 200,
                  220, 230, 233, 236, 239,
                  243, 247, 251, 300, 330,
                  360, 400, 420, 450, 500];


    let gravities = [   4,    6,    8,   10,   12,
                       16,   32,   48,   64,   80,
                       96,  112,  128,  144,    4,
                       32,   64,   96,  128,  160,
                      192,  224,  256,  512,  768,
                     1024, 1280, 1024,  768, 5120];

    return levelFunctionFactory(levels, gravities);
  }

  Gravity.Mode2 = Gravity.Mode1;



  // How many gravity units are equivalent to the height of 1 tile?
  const GravityDivisor = {};
  module.GravityDivisor = GravityDivisor;

  GravityDivisor.Mode1 = 256;
  GravityDivisor.Mode2 = 256;



  // Level thresholds for Mode 2 used to calculate multiple delay functions.
  const Mode2Levels = [0, 500, 601, 701, 801, 900, 901];

  // How many frames of entry delay are there upon piece lock?
  const ARE = {};
  module.ARE = ARE;

  ARE.Mode1 = function(n = 30) {
    return function(lvl) {
      return n;
    }
  }

  ARE.Mode2 = function() {
    let delays = [25, 25, 25, 16, 12, 12, 12];

    return levelFunctionFactory(Mode2Levels, delays);
  }



  // How many frames of entry delay are there after the line clear animation?
  const LineClearARE = {};
  module.LineClearARE = LineClearARE;

  LineClearARE.Mode1 = function(n = 30) {
    return function(lvl) {
      return n;
    }
  }

  LineClearARE.Mode2 = function() {
    let delays = [25, 25, 16, 12, 6, 6, 6];

    return levelFunctionFactory(Mode2Levels, delays);
  }



  // After the bottom of a live piece touches the well or another piece,
  // how many frames can the piece remain at the same height before locking?
  const LockDelay = {};
  module.LockDelay = LockDelay;

  LockDelay.Mode1 = function(n = 30) {
    return function(lvl) {
      return n;
    }
  }

  LockDelay.Mode2 = function() {
    let delays = [30, 30, 30, 30, 30, 30, 17];

    return levelFunctionFactory(Mode2Levels, delays);
  }



  // How many frames does the line clear animation take?
  const LineClearDelay = {};
  module.LineClearDelay = LineClearDelay;

  LineClearDelay.Mode1 = function(n = 41) {
    return function(lvl) {
      return n;
    }
  }

  LineClearDelay.Mode2 = function() {
    let delays = [40, 25, 16, 12, 6, 6, 6];

    return levelFunctionFactory(Mode2Levels, delays);
  }



  /*
    How many frames can you hold left/right consecutively
    before DAS (auto-shift) activates?
  */
  const DASThreshold = {};
  module.DASThreshold = DASThreshold;

  DASThreshold.Mode1 = function(n = 14) {
    return function(lvl) {
      return n;
    }
  }

  DASThreshold.Mode2 = function() {
    let thresholds = [14, 8, 8, 8, 8, 6, 6];

    return levelFunctionFactory(Mode2Levels, thresholds);
  }



  /*
    Generates a function whose return values, given the current level,
    are dependent on the provided level thresholds.

    levels: array of ints. assumes the ints are monotonically increasing.
    values: array of ints. assumes values.length === levels.length.
  */
  function levelFunctionFactory(levels, values) {
    let i = 0;

    return function(lvl) {
      if (i !== levels.length - 1) {
        while (lvl >= levels[i + 1]) {
          i++;
        }
      }

      return values[i];
    }
  }



  // How does the piece randomizer choose each piece?
  const PieceGenerator = {};
  module.PieceGenerator = PieceGenerator;

  PieceGenerator.Mode1 = function() {
    let startHistory = ["Z","Z","Z","Z"];
    let tries = 4;

    return pieceGeneratorFactory(startHistory, tries);
  }

  PieceGenerator.Mode2 = function() {
    let startHistory = ["Z","Z","S","S"];
    let tries = 6;

    return pieceGeneratorFactory(startHistory, tries);
  }

  /*
    Generates a function that, in turn, decides the next piece
    each time it is called. Returns a PieceId.

    piece rng rules:
    select a piece with uniform distribution
    if piece in history, reroll
    1st piece (at level 000) cannot be Z,S,O

    startHistory: array of PieceIds.
    tries: int.
           The max number of rerolls allowed before a piece is chosen
           regardless of whether the piece is already in the history or not.
  */
  function pieceGeneratorFactory(startHistory, tries) {
    var history = startHistory.slice();
    var counter = 0;

    var generator = function(level) {
      var duplicate;
      var nextPiece;

      for (let i = 0; i < tries; i++) {
        duplicate = false;
        nextPiece = getRandomPiece(level);
        for (let j = 0; j < history.length; j++) {
          if (history[j] === nextPiece) {
            duplicate = true;
            break;
          }
        }

        if (!duplicate) break;
      }

      history[counter] = nextPiece;
      counter = (counter + 1) % history.length;
      return nextPiece;
    }

    return generator;
  }

  function getRandomPiece(level) {
    let i;

    if (level === 0) {
      i = Math.floor(Math.random() * Pieces.PieceInitialArray.length);
      return Pieces.PieceInitialArray[i];
    } else {
      i = Math.floor(Math.random() * Pieces.PieceArray.length);
      return Pieces.PieceArray[i];
    }
  }



  // Does the ruleset allow sonic drops?
  const CanSonicDrop = {};
  module.CanSonicDrop = CanSonicDrop;

  CanSonicDrop.Mode1 = false;
  CanSonicDrop.Mode2 = true;



  // What are the rules governing piece rotation and wall/floor kicks?
  const RotationSystem = {};
  module.RotationSystem = RotationSystem;

  RotationSystem.Mode1 = tryRotation;
  RotationSystem.Mode2 = RotationSystem.Mode1;

  /*
    Try to rotate a piece.

    rotation logic:
      rotate in-place
      if failure, wallkick right
      else if failure, wallkick left
      else no rotation

    returns a new Piece which is based on the outcome.

    TODO: Mode 3 introduces new wallkicks and floorkicks.
          May need to rework how rotations are handled.
  */
  function tryRotation(p, well, dir) {
    let newP = Util.clone(p);
    newP.rotate(dir);

    if (Util.collision(newP, well)) {
      if (canWallkick(newP, well)) {
        // try wallkicking right
        newP.col += 1;
        if (!Util.collision(newP, well)) {
          return newP;
        }
        // else try wallkicking left
        newP.col -= 2;
        if (!Util.collision(newP, well)) {
          return newP;
        }
      }

      // return the original piece if unable to wallkick
      return p;
    }

    return newP;
  }

  /*
    Returns a boolean depending on whether the given piece can wallkick.

    special wallkick rules:
      I cannot kick
      L,J,T cannot kick on middle column
  */
  function canWallkick(p, well) {
    if (p.id === "I") return false;

    // for L,J,T pieces, check if collision on non-middle column
    if (p.id === "L" || p.id === "J" || p.id === "T") {

      // if L/J/T piece is OOB, wallkick is ok
      let widthOffset = Pieces.Widths[p.id][p.rotation];
      if ((p.col + widthOffset[0]) < 0 ||
          (p.col + widthOffset[0] + widthOffset[1]) > well[0].length) {
        return true;
      }

      let orientation = Pieces.Rotations[p.id][p.rotation] // [[y0,x0], [y1,x1], ..]
      for (let i = 0; i < orientation.length; i++) {
        if (orientation[i][1] !== 1 &&
            well[p.row + orientation[i][0]][p.col + orientation[i][1]] != null) {
          return true;
        }
      }
      return false;
    }

    return true;
  }

  return module;
})();

export default Rules;