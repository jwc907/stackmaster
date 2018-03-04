/*
  GameEngine.js

  Contains the core functionality of the game.
  Handles control flow and screen transitions,
  as well as the actual game logic.
*/
import GameModes from './GameModes.js';
import Inputs from './Inputs.js';
import Pieces from './Pieces.js';
import Util from './Util.js';

var GameEngine = (function() {
  var module = {};
  /*
    GameState includes the following:

    - menu state when not in-game
    - game state when in-game
    - "screen" state for the app's control flow
  */
  class GameState {
    constructor() {
      this._level = 0;
      // well is 21 high and 10 wide (IRS rotation can occupy 21st row)
      // each entry is either NULL or a PieceId (STRING)
      // need to be careful to DEEP COPY nested arrays!
      // TODO: allow for variable well sizes (e.g. 10x5).
      this._well = new Array(21);
      for (let i = 0; i < this._well.length; i++) {
        this._well[i] = new Array(10);
        this._well[i].fill(null);
      }

      // contains various game logic functions
      this._gameMode = null;

      this._currentPiece = null; // Piece - OBJECT
      this._nextPiece = null; // PieceId - String
      this._onFirstPiece = null; // boolean. is the current piece also the first?
      this._currentGravity = null; // n % 256 (for mode 1)
      this._currentLockDelay = null; // ints...
      this._linesToClear = null; // array of ints [x,y,z...]

      this._leftDAS = 0;
      this._rightDAS = 0;

      // control flow variables.
      this._currentScreen = "start";
      this._nextScreen = "start";
      this._screenDuration = null;
      this._cursorState = 0;
      this._gameOver = false;
    }

    get level() { return this._level; }
    set level(level) { this._level = level; }
    get well() { return this._well; }
    set well(well) { this._well = well; }

    get gameMode() { return this._gameMode; }
    set gameMode(gameMode) { this._gameMode = gameMode; }

    get currentPiece() { return this._currentPiece; }
    set currentPiece(currentPiece) { this._currentPiece = currentPiece; }
    get nextPiece() { return this._nextPiece; }
    set nextPiece(nextPiece) { this._nextPiece = nextPiece; }
    get onFirstPiece() { return this._onFirstPiece; }
    set onFirstPiece(onFirstPiece) { this._onFirstPiece = onFirstPiece; }
    get currentGravity() { return this._currentGravity; }
    set currentGravity(currentGravity) { this._currentGravity = currentGravity; }
    get currentLockDelay() { return this._currentLockDelay; }
    set currentLockDelay(currentLockDelay) { this._currentLockDelay = currentLockDelay; }
    get linesToClear() { return this._linesToClear; }
    set linesToClear(linesToClear) { this._linesToClear = linesToClear; }

    get leftDAS() { return this._leftDAS; }
    set leftDAS(leftDAS) { this._leftDAS = leftDAS; }
    get rightDAS() { return this._rightDAS; }
    set rightDAS(rightDAS) { this._rightDAS = rightDAS; }

    get currentScreen() { return this._currentScreen; }
    set currentScreen(currentScreen) { this._currentScreen = currentScreen; }
    get nextScreen() { return this._nextScreen; }
    set nextScreen(nextScreen) { this._nextScreen = nextScreen; }
    get screenDuration() { return this._screenDuration; }
    set screenDuration(screenDuration) { this._screenDuration = screenDuration; }
    get cursorState() { return this._cursorState; }
    set cursorState(cursorState) { this._cursorState = cursorState; }
    get gameOver() { return this._gameOver; }
    set gameOver(gameOver) { this._gameOver = gameOver; }

    /*
      update gravity and return the number of rows to fall through.

      return value should be int between 0-20.
    */
    updateGravity() {
      let divisor = this._gameMode.GravityDivisor;

      this._currentGravity += this._gameMode.Gravity(this._level);
      let g = Math.floor(this._currentGravity / divisor);
      this._currentGravity %= divisor;

      return g;
    }

    /*
      locks the piece and adds it to the well.
      also checks for any line clears.
    */
    lockPiece(p) {
      // merge piece with well
      let offsets = Pieces.Rotations[p.id][p.rotation];
      for (let i = 0; i < offsets.length; i++) {
        this._well[p.row + offsets[i][0]][p.col + offsets[i][1]] = p.id;
      }

      // only check line clears on rows the piece actually occupies.
      let [offset, height] = Pieces.Heights[p.id][p.rotation];
      let linesToClear = [];
      for (let i = 0; i < height; i++) {
        let cleared = true;
        for (let j = 0; j < this._well[0].length; j++) {
          if (this._well[p.row + offset + i][j] == null) {
            cleared = false;
            break;
          }
        }

        if (cleared) {
          linesToClear.push(p.row + offset + i);
        }
      }

      if (linesToClear.length > 0) {
        this._linesToClear = linesToClear;
      }

      this._currentGravity = 0; // reset fractional gravity
      this._currentPiece = null;
    }

    /*
      clears any completed rows from the well and updates accordingly.
    */
    clearLines() {
      if (this._linesToClear != null) {
        let linesToClear = this._linesToClear.slice();
        let startRow = linesToClear.shift();
        let nextRow = linesToClear.shift();
        let shift = 1;

        // override rows based on the current shift.
        for (let i = startRow; (i + shift) < this._well.length; i++) {
          while (nextRow !== undefined && (i + shift) === nextRow) {
            shift++;
            nextRow = linesToClear.shift();
          }

          this._well[i] = this._well[i + shift];
        }

        // empty the top rows of the well based on the shift.
        for (let i = this._well.length - shift; i < this._well.length; i++) {
          this._well[i] = new Array(10);
          this._well[i].fill(null);
        }

        this._linesToClear = null;
        this.updateLevel(shift);
      }
    }

    /*
      updates the current level on piece lock or line clear.
      if level = x99 or 998, need line clear to advance

      if the level goes above 998 on line clear, the game is over

      TODO: allow for variable level sections (e.g. 0-1300).
    */
    updateLevel(linesCleared) {
      // don't increment level when the very first piece spawns!
      if (this._onFirstPiece) {
        this._onFirstPiece = false;
      } else {
        let level = this._level;

        if (linesCleared > 0) {
          level += linesCleared;
          if (level > 998) {
            level = 999;
            this._gameOver = true;
          }
        } else if (level !== 998 ||
                  (level < 900 && level % 100 !== 99)) {
          level++;
        }

        this._level = level;
      }
    }
  }
  module.GameState = GameState;

  /*
    class representing the various overall states the game might be in.
    this class is named Screen to distinguish it from -gameplay- modes
    that will be added in the future

    screen state / control flow diagram:
    0 - start -> 1
    1 - levelSelect -> 2
    2 - gameStart -> 3
    3 - pieceSpawn -> 4,7
    4 - pieceLive -> 5,6
    5 - entryDelay -> 3
    6 - lineClear -> 5
    7 - gameOver -> 0
  */
  class Screen {
    /*
      duration: amount of frames that should be rendered when
      the screen state is entered. 0 -> remain in state indefinitely
    */
    constructor(duration) {
      this._duration = duration; // function(level)
    }

    /*
      call this method once when transitioning from one screen to another
      and init values as necessary

      return: updated state
    */
    enter(state) {
      return state;
    }

    /*
      call this method once per frame of the game loop

      return: updated state
    */
    process(state, inputs) {
      return state;
    }

    get duration() { return this._duration; }
    set duration(duration) { this._duration = duration; }
  }

  /*
    intro splash screen.
    will add options to rebind keys and intermediate screens
    to select various game modes in the future.
  */
  class StartScreen extends Screen {

    constructor() {
      super(0);
    }

    enter(state) {
      let newState = Util.clone(state);
      newState.cursorState = 0;
      newState.nextPiece = null;
      return newState;
    }

    process(state, inputs) {
      let newState = Util.clone(state);

      if (Inputs.justPressedButton(inputs)) {
        newState.nextScreen = "levelSelect";
      }

      return newState;
    }
  }
  module.StartScreen = StartScreen;

  /*
    level select screen.
    the player chooses the level to start at.

    TODO: make level options configurable
  */
  class LevelSelectScreen extends Screen {

    constructor() {
      super(0);
      this.levelOptions = [0,100,200,300,400,500,600,700,800,900];
    }

    process(state, inputs) {
      let newState = Util.clone(state);

      let len = this.levelOptions.length;
      if (Inputs.justPressed(inputs, ["down"])) {
        newState.cursorState = (newState.cursorState + 1) % len;
      }
      if (Inputs.justPressed(inputs, ["up"])) {
        newState.cursorState = (newState.cursorState - 1 + len) % len;
      }

      if (Inputs.justPressedButton(inputs)) {
        newState.level = this.levelOptions[newState.cursorState];
        newState.nextScreen = "gameStart";
      }

      return newState;
    }
  }
  module.LevelSelectScreen = LevelSelectScreen;

  /*
    game start screen.
    init state, display READY? GO!, transition to piece spawn when ready
  */
  class GameStartScreen extends Screen {
    constructor(duration = 120) {
      super(duration);
    }

    enter(state) {
      let newState = Util.clone(state);

      // clear the well
      for (let i = 0; i < newState.well.length; i++) {
        for (let j = 0; j < newState.well[i].length; j++) {
          newState.well[i][j] = null;
        }
      }

      // attach game logic functions.
      newState.gameMode = GameModes.getMode1();

      // init starting piece. logic always derives currentPiece from nextPiece
      newState.nextPiece = newState.gameMode.PieceGenerator(newState.level);

      // init other game state values
      newState.onFirstPiece = true;
      newState.currentGravity = 0;
      newState.currentLockDelay = 0;
      newState.leftDAS = 0;
      newState.rightDAS = 0;
      newState.linesToClear = null;
      newState.gameOver = false;

      newState.screenDuration = this.duration;

      return newState;
    }

    process(state, inputs) {
      let newState = Util.clone(state);
      updateDASCharge(newState, inputs);

      newState.screenDuration--;
      if (newState.screenDuration === 0) {
        newState.nextScreen = "pieceSpawn";
      }

      return newState;
    }
  }
  module.GameStartScreen = GameStartScreen;

  /*
    the frame where a piece spawns in the well.

    piece spawn logic:
    if IRS and no collision
        spawn rotated piece
      else if collision
        end game
    else
      spawn piece
      apply gravity
  */
  class PieceSpawnScreen extends Screen {
    constructor() {
      super(1);
    }

    process(state, inputs) {
      let newState = Util.clone(state);
      updateDASCharge(newState, inputs);

      let newP = generateNewPiece(newState.nextPiece);
      let newRotP = Util.clone(newP);
      newState.nextPiece = newState.gameMode.PieceGenerator(newState.level);

      // if IRS, try it (no wallkick)
      newRotP.rotate(Inputs.irsDirection(inputs))
      if (!Util.collision(newRotP, newState.well)) {
        newP = newRotP;
      } else if (Util.collision(newP, newState.well)) {
        newState.nextScreen = "gameOver";
        return newState;
      }

      // gravity
      let g = newState.updateGravity();
      let offsetG = applyGravity(newP, newState.well, g);
      newP.row += offsetG;

      newState.currentLockDelay = newState.gameMode.LockDelay(newState.level);
      newState.currentPiece = newP;
      newState.nextScreen = "pieceLive";
      newState.updateLevel(0);

      //console.log("NEW PIECE:");
      //console.log(newState.currentPiece);
      //console.log(newState.well);
      return newState;
    }
  }
  module.PieceSpawnScreen = PieceSpawnScreen;

  /*
    the screen state where a piece is in play.

    processing order:
      rotation
      movement
      gravity

    notes:
    piece drop = lock delay reset
    start lock delay on contact

    next piece on lock delay end or manual lock
    also check for line clears
  */
  class PieceLiveScreen extends Screen {
    constructor() {
      super(0);
    }

    process(state, inputs) {
      let newState = Util.clone(state);
      updateDASCharge(newState, inputs);

      let movedDown = false;
      let pieceIsLocked = false;

      // rotation
      let p = Util.clone(newState.currentPiece);
      let r = Inputs.processInputRotation(inputs);

      if (r !== 0) {
        p = newState.gameMode.RotationSystem(p, newState.well, r);
      }

      // movement
      let threshold = newState.gameMode.DASThreshold(newState.level);

      let [offsetRow, offsetCol] = Inputs.processInputMovement(newState.leftDAS,
                                                               newState.rightDAS,
                                                               inputs.down,
                                                               threshold);
      let canMove = testMovement(p, newState.well, offsetRow, offsetCol);
      if (canMove) {
        p.row += offsetRow;
        p.col += offsetCol;

        if (offsetRow !== 0) {
          movedDown = true;
        }
      } else if (offsetRow !== 0) { // attempted to move down when unable to do so
        pieceIsLocked = true;
      }

      // gravity
      let g = newState.updateGravity();
      let offsetG = applyGravity(p, newState.well, g);
      p.row += offsetG;
      if (offsetG !== 0) {
        movedDown = true;
      }

      // lock delay
      if (movedDown) {
        newState.currentLockDelay = newState.gameMode.LockDelay(newState.level);
      } else if (pieceBottomContact(p, newState.well)) {
        newState.currentLockDelay -= 1;
        if (newState.currentLockDelay === 0)
          pieceIsLocked = true;
      }

      // update well on piece lock and transition to appropriate screen state
      if (pieceIsLocked) {
        newState.lockPiece(p);

        if (newState.linesToClear != null) {
          newState.nextScreen = "lineClear";
        } else {
          newState.nextScreen = "entryDelay";
        }

        return newState;
      }
      else {
        newState.currentPiece = p;
      }

      return newState;
    }
  }
  module.PieceLiveScreen = PieceLiveScreen;

  /*
    the screen state after each piece lock (and possible line clear).
    the next piece comes into play after entry delay ends.
  */
  class EntryDelayScreen extends Screen {
    // flashDuration = number of frames a newly locked piece should flash
    constructor(duration = 30, flashDuration = 3) {
      super(duration);
      this._flashDuration = flashDuration;
    }

    enter(state) {
      let newState = Util.clone(state);
      if (newState.linesToClear != null) {
        newState.screenDuration = newState.gameMode.LineClearARE(newState.level);
      } else {
        newState.screenDuration = newState.gameMode.ARE(newState.level);
      }

      newState.clearLines();
      return newState;
    }

    process(state, inputs) {
      let newState = Util.clone(state);
      updateDASCharge(newState, inputs);

      newState.screenDuration--;

      if (newState.screenDuration === 0) {
        if (newState.gameOver) { // when lvl 999 is reached
          newState.nextScreen = "gameOver";
        } else {
          newState.nextScreen = "pieceSpawn";
        }
      }
      return newState;
    }

    get flashDuration() { return this._flashDuration; }
    set flashDuration(flashDuration) { this._flashDuration = flashDuration; }
  }
  module.EntryDelayScreen = EntryDelayScreen;

  /*
    the screen state during a line clear.
    while in this state, cleared lines should flash.
  */
  class LineClearScreen extends Screen {
    constructor(duration = 41) {
      super(duration);
    }

    enter(state) {
      let newState = Util.clone(state);
      newState.screenDuration = newState.gameMode.LineClearDelay(newState.level);
      return newState;
    }

    process(state, inputs) {
      let newState = Util.clone(state);
      updateDASCharge(newState, inputs);

      newState.screenDuration--;
      if (newState.screenDuration === 0) {
        newState.nextScreen = "entryDelay";
      }
      return newState;
    }
  }
  module.LineClearScreen = LineClearScreen;

  /*
    the screen state when the game is over.
    transitions back to the intro screen after given duration.
  */
  class GameOverScreen extends Screen {
    constructor(duration = 300) {
      super(duration);
    }

    enter(state) {
      let newState = Util.clone(state);
      newState.screenDuration = this._duration;
      return newState;
    }

    process(state, inputs) {
      let newState = Util.clone(state);

      newState.screenDuration--;
      if (newState.screenDuration === 0) {
        newState.nextScreen = "start";
      }
      return newState;
    }
  }
  module.GameOverScreen = GameOverScreen;


  /*
    AUXILIARY FUNCTIONS
  */

  /*
    initializes a new Piece, given a PieceId
  */
  function generateNewPiece(id) {
    let p = new Pieces.Piece(id);
    [p.row, p.col] = Pieces.SpawnPositions[id];
    return p;
  }
  module.generateNewPiece = generateNewPiece;

  /*
    keeps track of left/right DAS charges.

    TODO: whether or not DAS charges are updated is conditional
    and depends on the screen state! Implement these checks.
  */
  function updateDASCharge(state, inputs) {
    if (inputs.left > 0) {
      if (inputs.right > 0) {
        state.leftDAS = 0;
        state.rightDAS = 0;
      } else {
        state.leftDAS++;
      }
    }
    else if (inputs.right > 0) {
      state.rightDAS++;
    }
    else {
      state.leftDAS = 0;
      state.rightDAS = 0;
    }
  }
  module.updateDASCharge = updateDASCharge;

  /*
    determine if the given piece movement is legal.

    returns true if legal move, false otherwise.
  */
  function testMovement(p, well, offsetRow, offsetCol) {
    let newP = Util.clone(p);
    newP.row += offsetRow;
    newP.col += offsetCol;

    if (!Util.collision(newP, well)) {
      return true;
    } else {
      return false;
    }
  }
  module.testMovement = testMovement;

  /*
    apply gravity (the number of rows to fall through) on the given piece.
    TODO: consider using a more efficient algorithm!
          should be useful for sonic drop + ghost piece.

    returns the result as a row offset from the original position.
    the result will be 0 or NEGATIVE.
  */
  function applyGravity(p, well, g) {
    let newP = Util.clone(p);
    let result = 0;

    for (let i = 0; i < g; i++) {
      newP.row -= 1;
      if (Util.collision(newP, well)) {
        break;
      }
      result -= 1;
    }

    return result;
  }
  module.applyGravity = applyGravity;

  /*
    returns true if the bottom of the live piece
    is touching the well bottom or another piece.
  */
  function pieceBottomContact(p, well) {
    let newP = Util.clone(p);
    newP.row -= 1;
    return Util.collision(newP, well);
  }
  module.pieceBottomContact = pieceBottomContact;

  return module;
})();

export default GameEngine;