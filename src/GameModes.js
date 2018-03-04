/*
  GameModes.js

  Contains a set of game modes.
  Each game mode contains a subset of rules that govern
  the given mode's game mechanics and piece physics.

  TODO: add class definition of GameMode and more modes.



  Each game mode currently defines the following:
  gravity function
  gravity divisor

  ARE
  line clear ARE
  lock delay
  line clear delay
  DAS threshold

  piece randomizer
  rotation system
*/
import Rules from './Rules.js';

var GameModes = (function() {
  var module = {};

  module.getMode1 = function() {

    var mode = {};
    mode.Gravity = Rules.Gravity.Mode1();
    mode.GravityDivisor = Rules.GravityDivisor.Mode1;

    mode.ARE = Rules.ARE.Mode1();
    mode.LineClearARE = Rules.LineClearARE.Mode1();
    mode.LockDelay = Rules.LockDelay.Mode1();
    mode.LineClearDelay = Rules.LineClearDelay.Mode1();
    mode.DASThreshold = Rules.DASThreshold.Mode1();

    mode.PieceGenerator = Rules.PieceGenerator.Mode1();
    mode.RotationSystem = Rules.RotationSystem.Mode1;

    return mode;
  }

  return module;
})();

export default GameModes;