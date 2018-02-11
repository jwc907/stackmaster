import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();



(function () {
	/*
		CONSTANTS AND SETTINGS
	*/
	const Constants = {};

	Constants.PieceIds = {
		I: "I",
		T: "T",
		L: "L",
		J: "J",
		S: "S",
		Z: "Z",
		O: "O"
	};

	Constants.PieceArray = ["I","T","L","J","S","Z","O"];

	Constants.PieceInitialArray = ["I","T","L","J"];

	/*
		each piece is keyed to a length-4 array of (row,col) offsets
			i.e. PieceRotation[piece_id][piece_rotation] = [[y0,x0], [y1,x1], ..]
		each piece fits into a NxN square; offsets are calculated from bottom-left
		0th entry is default orientation
		index++ -> clockwise rotation, and vice versa
		redundant entries for O/I/S/Z pieces for convenience

		well pos:
		..    ..
		(1,0) (1,1) ..
		(0,0) (0,1) ..
	*/
	Constants.PieceRotation = {
		I: [[[2,0], [2,1], [2,2], [2,3]],
			[[0,2], [1,2], [2,2], [3,2]],
			[[2,0], [2,1], [2,2], [2,3]],
			[[0,2], [1,2], [2,2], [3,2]]],

		T: [[[1,0], [0,1], [1,1], [1,2]],
			[[1,0], [0,1], [1,1], [2,1]],
			[[0,0], [0,1], [1,1], [0,2]],
			[[0,1], [1,1], [2,1], [1,2]]],

		L: [[[0,0], [1,0], [1,1], [1,2]],
			[[2,0], [0,1], [1,1], [2,1]],
			[[0,0], [0,1], [0,2], [1,2]],
			[[0,1], [1,1], [2,1], [0,2]]],

		J: [[[1,0], [1,1], [0,2], [1,2]],
			[[0,0], [0,1], [1,1], [2,1]],
			[[0,0], [1,0], [0,1], [0,2]],
			[[0,1], [1,1], [2,1], [2,2]]],

		S: [[[0,0], [0,1], [1,1], [1,2]],
			[[1,0], [2,0], [0,1], [1,1]],
			[[0,0], [0,1], [1,1], [1,2]],
			[[1,0], [2,0], [0,1], [1,1]]],

		Z: [[[1,0], [0,1], [1,1], [0,2]],
			[[0,1], [1,1], [1,2], [2,2]],
			[[1,0], [0,1], [1,1], [0,2]],
			[[0,1], [1,1], [1,2], [2,2]]],

		O: [[[0,0], [1,0], [0,1], [1,1]],
			[[0,0], [1,0], [0,1], [1,1]],
			[[0,0], [1,0], [0,1], [1,1]],
			[[0,0], [1,0], [0,1], [1,1]]]
	};

	/*
		for a given piece + rotation, define a tuple [offsetRow, height]
		offsetRow is calculated from the piece's "bottom-left" position.
		height is the number of rows that a given piece occupies.

		this is used for line clear and collision checks.
	*/
	Constants.PieceHeight = {
		I: [[2,1], [0,4], [2,1], [0,4]],
		T: [[0,2], [0,3], [0,2], [0,3]],
		L: [[0,2], [0,3], [0,2], [0,3]],
		J: [[0,2], [0,3], [0,2], [0,3]],
		S: [[0,2], [0,3], [0,2], [0,3]],
		Z: [[0,2], [0,3], [0,2], [0,3]],
		O: [[0,2], [0,2], [0,2], [0,2]]
	};

	/*
		define a counterpart set of tuples [offsetCol, width].
		this is used for collision checks.
	*/
	Constants.PieceWidth = {
		I: [[0,4], [2,1], [0,4], [2,1]],
		T: [[0,3], [0,2], [0,3], [1,2]],
		L: [[0,3], [0,2], [0,3], [1,2]],
		J: [[0,3], [0,2], [0,3], [1,2]],
		S: [[0,3], [0,2], [0,3], [0,2]],
		Z: [[0,3], [1,2], [0,3], [1,2]],
		O: [[0,2], [0,2], [0,2], [0,2]]
	};

	Constants.PieceSpawnPos = {
		I: [17,3],
		T: [18,3],
		L: [18,3],
		J: [18,3],
		S: [18,3],
		Z: [18,3],
		O: [18,4]
	};

	Constants.Inputs = {
		left: "left",
		down: "down",
		right: "right",
		up: "up",
		A: "A",
		B: "B",
		C: "C"
	};

	/*
		when more game modes are added, gravity/delays/DAS won't be constant.
		so return functions instead of calling functions on the Constants object

		gravity is defined such that 256 units corresponds to 1 tile.
		delay values are in frames.
	*/
	Constants.Gravity = function() {
		// TODO: rewrite w/ binary search lookup or consider a stateful function
		return function(level) {
			if (level < 30) return 4;
			if (level < 35) return 6;
			if (level < 40) return 8;
			if (level < 50) return 10;
			if (level < 60) return 12;
			if (level < 70) return 16;
			if (level < 80) return 32;
			if (level < 90) return 48;
			if (level < 100) return 64;
			if (level < 120) return 80;
			if (level < 140) return 96;
			if (level < 160) return 112;
			if (level < 170) return 128;
			if (level < 200) return 144;

			if (level < 220) return 4;
			if (level < 230) return 32;
			if (level < 233) return 64;
			if (level < 236) return 96;
			if (level < 239) return 128;
			if (level < 243) return 160;
			if (level < 247) return 192;
			if (level < 251) return 224;
			if (level < 300) return 256;
			if (level < 330) return 512;
			if (level < 360) return 768;
			if (level < 400) return 1024;
			if (level < 420) return 1280;
			if (level < 450) return 1024;
			if (level < 500) return 768;

			return 5120;
		}
	};

	Constants.EntryDelay = function(n = 30) {
		return function(level) {
			return n;
		}
	};

	Constants.LockDelay = function(n = 30) {
		return function(level) {
			return n;
		}
	};


	Constants.LineClearDelay = function(n = 41) {
		return function(level) {
			return n;
		}
	};

	Constants.DASThreshold = function(n = 14) {
		return function(level) {
			return n;
		}
	};

	/*
		piece rng rules:
		select a piece with uniform distribution
		if piece in history, re-roll up to 4 times
		1st piece cannot be Z,S,O

		initial piece history: (Z,Z,Z,Z)

		piece generator returns a PieceId.
	*/
	Constants.PieceGenerator = function() {
		var history = ["Z","Z","Z","Z"];
		var counter = 0;
		var tries = 4;

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
			i = Math.floor(Math.random() * Constants.PieceInitialArray.length);
			return Constants.PieceInitialArray[i];
		} else {
			i = Math.floor(Math.random() * Constants.PieceArray.length);
			return Constants.PieceArray[i];
		}
	}

	// debug generator cycles through each piece in order.
	Constants.DebugPieceGenerator = function() {
		var counter = 0;

		var generator = function() {
			let piece = Constants.PieceArray[counter];
			counter = (counter + 1) % Constants.PieceArray.length;
			return piece;
		}

		return generator;
	}

	/*
		CLASS DECLARATIONS
	*/

	/*
		Piece - representation of tetromino.

		pieceId: id representing one of the 7 possible tetrominos
		row, col: coordinates fixed on the piece's "bottom-left" position
		rotation: the rotation state. possible values: 0 to 3
	*/
	class Piece {
		constructor (id, row = 0, col = 0, rotation = 0) {
			this._id = id;
			this._row = row;
			this._col = col;
			this._rotation = rotation;
		}

		get id() { return this._id; }
		get row() { return this._row; }
	    set row(row) { this._row = row; }
		get col() { return this._col; }
	    set col(col) { this._col = col; }
		get rotation() { return this._rotation; }
	    set rotation(rotation) { this._rotation = rotation; }

	    rotate(dir) {
	    	this._rotation = (this._rotation + dir + 4) % 4;
	    }
	}



	class GameState {
		constructor() {
			this._level = 0;
			// well is 21 high and 10 wide
			// need to be careful to DEEP COPY nested arrays!
			this._well = new Array(21);
			for (let i = 0; i < this._well.length; i++) {
				this._well[i] = new Array(10);
				this._well[i].fill(null);
			}

			// these fields should all be assigned to functions
			this._getNextPiece = null;
			this._gravity = null;
			this._entryDelay = null;
			this._lockDelay = null;
			this._lineClearDelay = null;
			this._DASThreshold = null;

			this._currentPiece = null; // Piece OBJECT
			this._nextPiece = null; // PieceId
			this._lockedPiece = null;

			this._onFirstPiece = null;
			this._currentGravity = null; // n % 256
			this._currentLockDelay = null;
			this._chargeLeft = 0;
			this._chargeRight = 0;
			this._chargeUp = 0;
			this._chargeDown = 0;
			this._chargeA = 0;
			this._chargeB = 0;
			this._chargeC = 0;
			this._linesToClear = null;

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

		get getNextPiece() { return this._getNextPiece; }
	    set getNextPiece(getNextPiece) { this._getNextPiece = getNextPiece; }
		get gravity() { return this._gravity; }
	    set gravity(gravity) { this._gravity = gravity; }
		get entryDelay() { return this._entryDelay; }
	    set entryDelay(entryDelay) { this._entryDelay = entryDelay; }
		get lockDelay() { return this._lockDelay; }
	    set lockDelay(lockDelay) { this._lockDelay = lockDelay; }
		get lineClearDelay() { return this._lineClearDelay; }
	    set lineClearDelay(lineClearDelay) { this._lineClearDelay = lineClearDelay; }
		get DASThreshold() { return this._DASThreshold; }
	    set DASThreshold(DASThreshold) { this._DASThreshold = DASThreshold; }

		get currentPiece() { return this._currentPiece; }
	    set currentPiece(currentPiece) { this._currentPiece = currentPiece; }
		get nextPiece() { return this._nextPiece; }
	    set nextPiece(nextPiece) { this._nextPiece = nextPiece; }
	    get lockedPiece() {return this._lockedPiece; }
	    set lockedPiece(lockedPiece) { this._lockedPiece = lockedPiece; }

	    get onFirstPiece() { return this._onFirstPiece; }
	    set onFirstPiece(onFirstPiece) { this._onFirstPiece = onFirstPiece; }
		get currentGravity() { return this._currentGravity; }
	    set currentGravity(currentGravity) { this._currentGravity = currentGravity; }
	    get currentLockDelay() { return this._currentLockDelay; }
	    set currentLockDelay(currentLockDelay) { this._currentLockDelay = currentLockDelay; }
		get chargeLeft() { return this._chargeLeft; }
	    set chargeLeft(chargeLeft) { this._chargeLeft = chargeLeft; }
		get chargeRight() { return this._chargeRight; }
	    set chargeRight(chargeRight) { this._chargeRight = chargeRight; }
	    get chargeUp() { return this._chargeUp; }
	    set chargeUp(chargeUp) { this._chargeUp = chargeUp; }
		get chargeDown() { return this._chargeDown; }
	    set chargeDown(chargeDown) { this._chargeDown = chargeDown; }
		get chargeA() { return this._chargeA; }
	    set chargeA(chargeA) { this._chargeA = chargeA; }
		get chargeB() { return this._chargeB; }
	    set chargeB(chargeB) { this._chargeB = chargeB; }
		get chargeC() { return this._chargeC; }
	    set chargeC(chargeC) { this._chargeC = chargeC; }
	    get linesToClear() { return this._linesToClear; }
	    set linesToClear(linesToClear) { this._linesToClear = linesToClear; }

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
	    */
	    updateGravity() {
	    	this._currentGravity = this._gravity(this._level);
	    	let g = Math.floor(this._currentGravity / 256);
	    	this._currentGravity %= 256;

	    	return g;
	    }

	    /*
			locks the piece and adds it to the well.
			also checks for any line clears.
	    */
	    lockPiece(p) {
	    	// merge piece with well
	    	let offsets = Constants.PieceRotation[p.id][p.rotation];
	    	for (let i = 0; i < offsets.length; i++) {
	    		this._well[p.row + offsets[i][0]][p.col + offsets[i][1]] = p.id;
	    	}

	    	// only check line clears on rows the piece actually occupies.
	    	let [offset, height] = Constants.PieceHeight[p.id][p.rotation];
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
	    			//console.log("found a clear row! " + (p.row + offset + i));
	    			linesToClear.push(p.row + offset + i);
	    		}
	    	}

			if (linesToClear.length > 0) {
	    		this._linesToClear = linesToClear;
			}
			this._lockedPiece = p;
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
			if level = x99, need line clear to advance

			if the level goes above 999 on line clear, the game is over
		*/
		updateLevel(linesCleared) {
			// don't increment level when the very first piece spawns!
			if (this._onFirstPiece) {
				this._onFirstPiece = false;
			} else {
				let level = this._level;

				if (linesCleared > 0) {
					level += linesCleared;
					if (level > 999) {
						level = 999;
						this._gameOver = true;
					}
				} else if (level % 100 !== 99) {
					level++;
				}

				this._level = level;
			}
		}

	}



	/*
		class representing the various overall states the game might be in
		this class is named Screen to distinguish it from -gameplay- modes
		that will be added in the future

		screen state diagram:
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
			let newState = clone(state);
			newState.cursorState = 0;
			newState.nextPiece = null;
			return newState;
		}

		process(state, inputs) {
			let newState = clone(state);
			processInputs(newState, inputs);

			if (newState.chargeA === 1 ||
				newState.chargeB === 1 ||
				newState.chargeC === 1) {
				newState.nextScreen = "levelSelect";
			}

			return newState;
		}
	}


	/*
		level select screen.
		choose the level the player starts at.
	*/
	class LevelSelectScreen extends Screen {

		constructor() {
			super(0);
			this.levelOptions = [0,100,200,300,400,500,600,700,800,900];
		}

		process(state, inputs) {
			let newState = clone(state);
			processInputs(newState, inputs);
			let len = this.levelOptions.length;

			if (newState.chargeDown === 1) {
				newState.cursorState = (newState.cursorState + 1) % len;
			}
			if (newState.chargeUp === 1) {
				newState.cursorState = (newState.cursorState - 1 + len) % len;
			}

			if (newState.chargeA === 1 ||
				newState.chargeB === 1 ||
				newState.chargeC === 1) {
				newState.level = this.levelOptions[newState.cursorState];
				newState.nextScreen = "gameStart";
			}

			return newState;
		}
	}


	/*
		game start screen.
		init state, display READY? GO!, transition to piece spawn when ready
	*/
	class GameStartScreen extends Screen {
		constructor(duration = 120) {
			super(duration);
		}

		enter(state) {
			let newState = clone(state);

			// clear the well
			for (let i = 0; i < newState.well.length; i++) {
				for (let j = 0; j < newState.well[i].length; j++) {
					newState.well[i][j] = null;
				}
			}

			// attach game logic functions.
			newState.gravity = Constants.Gravity();
			newState.entryDelay = Constants.EntryDelay();
			newState.lockDelay = Constants.LockDelay();
			newState.lineClearDelay = Constants.LineClearDelay();
			newState.DASThreshold = Constants.DASThreshold();
			newState.getNextPiece = Constants.PieceGenerator();
			//newState.getNextPiece = Constants.DebugPieceGenerator();

			// init starting piece. logic always derives currentPiece from nextPiece
			newState.nextPiece = newState.getNextPiece(newState.level);

			// init other game state values
			newState.onFirstPiece = true;
			newState.currentGravity = newState.gravity(newState.level);
			newState.currentLockDelay = 0;
			newState.chargeLeft = 0;
			newState.chargeRight = 0;
			newState.chargeA = 0;
			newState.chargeB = 0;
			newState.chargeC = 0;
			newState.linesToClear = null;
			newState.gameOver = false;

			newState.screenDuration = this.duration;

			return newState;
		}

		process(state, inputs) {
			let newState = clone(state);
			processInputs(newState, inputs);

			newState.screenDuration--;
			if (newState.screenDuration === 0) {
				newState.nextScreen = "pieceSpawn";
			}

			return newState;
		}
	}


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
			let newState = clone(state);
			processInputs(newState, inputs);

			let newP = generateNewPiece(newState.nextPiece);
			let newRotP = clone(newP);
			newState.nextPiece = newState.getNextPiece(newState.level);

			// if IRS, try it (no wallkick)
			newRotP.rotate(irsDirection(newState))
			if (!collision(newRotP, newState.well)) {
				newP = newRotP;
			} else if (collision(newP, newState.well)) {
				newState.nextScreen = "gameOver";
				return newState;
			}

			// gravity
/*
			let g = newState.updateGravity();
			newP.row += applyGravity(newP, newState.well, g)
*/
			newState.currentLockDelay = newState.lockDelay(newState.level);
			newState.currentPiece = newP;
			newState.nextScreen = "pieceLive";
			newState.updateLevel(0);

			//console.log("NEW PIECE:");
			//console.log(newState.currentPiece);
			//console.log(newState.well);
			return newState;
		}
	}


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
			let newState = clone(state);
			processInputs(newState, inputs);

			let movedDown = false;
			let pieceIsLocked = false;

			// rotation
			let p = clone(newState.currentPiece);
			let r = processInputRotation(newState.chargeA, newState.chargeB, newState.chargeC);

			if (r !== 0) {
				p = tryRotation(p, newState.well, r);
			}

			// movement
			let [offsetRow, offsetCol] = processInputMovement(state, inputs);
			let canMove = testMovement(p, newState.well, offsetRow, offsetCol);
			if (canMove) {
				p.row += offsetRow;
				p.col += offsetCol;

				if (offsetRow !== 0) {
					movedDown = true;
				}
			} else if (offsetRow !== 0) { // attempted to move down when unable to do so
				//console.log("locked piece! " + offsetRow + ", " + offsetCol);
				pieceIsLocked = true;
			}

			// gravity
			/*
			let g = newState.updateGravity();
			let offsetG = applyGravity(p, newState.well, g);
			p.row += offsetG;
			if (offsetG !== 0)
				movedDown = true;
			*/

			// lock delay
			if (movedDown) {
				newState.currentLockDelay = newState.lockDelay(newState.level);
			} else if (pieceBottomContact(p, newState.well)) {
				newState.currentLockDelay -= 1;
				if (newState.currentLockDelay === 0)
					pieceIsLocked = true;
			}

			// update well on piece lock and transition to appropriate screen state
			if (pieceIsLocked) {
				newState.lockPiece(p);

				if (newState.linesToClear != null)
					newState.nextScreen = "lineClear";
				else
					newState.nextScreen = "entryDelay";

				return newState;
			}
			else {
				newState.currentPiece = p;
			}

			return newState;
		}
	}

	class EntryDelayScreen extends Screen {
		constructor(duration = 30, flashDuration = 3) {
			super(duration);
			this._flashDuration = flashDuration;
		}

		enter(state) {
			let newState = clone(state);
			newState.clearLines();
			newState.screenDuration = newState.entryDelay(newState.level);
			return newState;
		}

		process(state, inputs) {
			let newState = clone(state);
			processInputs(newState, inputs);

			newState.screenDuration--;

			let initialDuration = newState.entryDelay(newState.level);
			if (newState.screenDuration === (initialDuration - this._flashDuration)) {
				newState.lockedPiece = null;
			}
			if (newState.screenDuration === 0) {
				if (newState.gameOver) { // when lvl 999+ is reached
					newState.nextScreen = "gameOver";
				} else {
					newState.nextScreen = "pieceSpawn";
				}
			}
			return newState;
		}
	}

	class LineClearScreen extends Screen {
		constructor(duration = 41) {
			super(duration);
		}

		enter(state) {
			let newState = clone(state);
			newState.screenDuration = newState.lineClearDelay(newState.level);
			newState.lockedPiece = null;
			return newState;
		}

		process(state, inputs) {
			let newState = clone(state);
			processInputs(newState, inputs);

			newState.screenDuration--;
			if (newState.screenDuration === 0) {
				newState.nextScreen = "entryDelay";
			}
			return newState;
		}
	}

	class GameOverScreen extends Screen {
		constructor(duration = 300) {
			super(duration);
		}

		enter(state) {
			let newState = clone(state);
			newState.screenDuration = this._duration;
			return newState;
		}

		process(state, inputs) {
			let newState = clone(state);
			processInputs(newState, inputs);

			newState.screenDuration--;
			if (newState.screenDuration === 0) {
				newState.nextScreen = "start";
			}
			return newState;
		}
	}




	/*
		AUXILIARY FUNCTIONS
	*/

	/*
		track how long directions/buttons are held down
		for determining DAS/IRS
	*/
	function processInputs(state, inputs) {
		if (inputs.left)
			state.chargeLeft += 1;
		else
			state.chargeLeft = 0;

		if (inputs.right)
			state.chargeRight += 1;
		else
			state.chargeRight = 0;

		if (inputs.up)
			state.chargeUp += 1;
		else
			state.chargeUp = 0;

		if (inputs.down)
			state.chargeDown += 1;
		else
			state.chargeDown = 0;

		// left + right resets DAS charge.
		if (inputs.left && inputs.right) {
			state.chargeLeft = 0;
			state.chargeRight = 0;
		}

		if (inputs.A)
			state.chargeA += 1;
		else
			state.chargeA = 0;

		if (inputs.B)
			state.chargeB += 1;
		else
			state.chargeB = 0;

		if (inputs.C)
			state.chargeC += 1;
		else
			state.chargeC = 0;
	}

	/*
		initializes a new Piece, given a PieceId
	*/
	function generateNewPiece(id) {
		let p = new Piece(id);
		[p.row, p.col] = Constants.PieceSpawnPos[id];
		return p;
	}

	/*
		determine whether to apply IRS.
		CCW rotation takes precedence over CW rotation

		-1 = CCW rotation, 0 = no rotation, 1 = CW rotation
	*/
	function irsDirection(state) {
		if (state.chargeA > 0 || state.chargeC > 0)
			return -1;
		else if (state.chargeB > 0)
			return 1;
		return 0;
	}

	/*
		checks whether a piece is OOB or collides with something inside the well

		returns true if there is a collision
	*/
	function collision(p, well) {
		// left/bottom/right OOB check.
		// note that depending on piece/rotation, p.row or p.col can be negative!
		let heightOffset = Constants.PieceHeight[p.id][p.rotation];
		let widthOffset = Constants.PieceWidth[p.id][p.rotation];
		if ((p.row + heightOffset[0]) < 0 ||
			(p.col + widthOffset[0]) < 0 ||
			(p.col + widthOffset[0] + widthOffset[1]) > 10) {
			return true;
		}

		// well collision check
		let orientation = Constants.PieceRotation[p.id][p.rotation]; // [[y0,x0], [y1,x1], ..]
		for (let i = 0; i < orientation.length; i++) {
			if (well[p.row + orientation[i][0]][p.col + orientation[i][1]] != null) {
				return true;
			}
		}

		return false;
	}

	/*
		determine which way to rotate a live piece, given inputs.

		should only attempt rotation on initial button press.
		same frame CCW + CW rotation cancel out.
		same frame A + C only rotates once.

		-1 = CCW rotation, 0 = no rotation, 1 = CW rotation
	*/
	function processInputRotation(chargeA, chargeB, chargeC) {
		if (chargeA === 1 || chargeC === 1) {
			if (chargeB !== 1)
				return -1;
		}
		else if (chargeB === 1)
			return 1;
		return 0;
	}

	/*
		try to rotate a piece.

		rotation logic:
			rotate in-place
			if failure, wallkick right
			else if failure, wallkick left
			else no rotation

	 	special cases:
		    I cannot kick
		    L,J,T cannot kick on middle column

		   returns a new Piece which is based on the outcome.
	*/
	function tryRotation(p, well, dir) {
		let newP = clone(p);
		newP.rotate(dir);

		if (collision(newP, well)) {
			if (canWallkick(newP, well)) {
				// try wallkicking right
				newP.col += 1;
				if (!collision(newP, well)) {
					return newP;
				}
				// else try wallkicking left
				newP.col -= 2;
				if (!collision(newP, well)) {
					return newP;
				}
			}
			// return the original piece if unable to wallkick
			return p;
		}

		return newP;
	}

	/*
		see tryRotation() for wallkick rules.

		returns a boolean depending on whether the given piece can wallkick.
	*/
	function canWallkick(p, well) {
		if (p.id === "I") return false;

		// for L,J,T pieces, check if collision on non-middle column
		if (p.id === "L" || p.id === "J" || p.id === "T") {

			// if L/J/T piece is OOB, wallkick is ok
			let widthOffset = Constants.PieceWidth[p.id][p.rotation];
			if ((p.col + widthOffset[0]) < 0 ||
				(p.col + widthOffset[0] + widthOffset[1]) > 10) {
				return true;
			}

			let orientation = Constants.PieceRotation[p.id][p.rotation] // [[y0,x0], [y1,x1], ..]
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

	/*
		determine which direction a piece should move.

		horizontal input takes precedence over vertical input
		left + right = neutral

		return a tuple of offsets: [offsetRow, offsetCol]
	*/
	function processInputMovement(state, inputs) {
		if (inputs.left || inputs.right) {
			if (inputs.left && inputs.right)
				return [0,0];

			if (state.chargeLeft === 1 || state.chargeLeft >= state.DASThreshold(state.level))
				return [0,-1];
			else if (state.chargeRight === 1 || state.chargeRight >= state.DASThreshold(state.level))
				return [0,1];
		}
		else if (inputs.down) {
			return [-1,0];
		}

		return [0,0];
	}

	/*
		determine if the given piece movement is legal.

		returns true if legal movement, false otherwise.
	*/
	function testMovement(p, well, offsetRow, offsetCol) {

		let newP = clone(p);
		newP.row += offsetRow;
		newP.col += offsetCol;

		if (!collision(newP, well))
			return true;
		else
			return false;
	}

	/*
		apply gravity (the number of rows to fall through) on the given piece.
		consider using a more efficient algorithm!

		returns the result as a row offset from the original position.
		the result will be 0 or NEGATIVE.
	*/
	function applyGravity(p, well, g) {
		let newP = clone(p);
		let result = 0;

		for (let i = 0; i < g; i++) {
			newP.row -= 1;
			if (collision(newP, well)) {
				break;
			}
			result -= 1;
		}

		return result;
	}

	/*
		returns true if the bottom of the live piece
		is touching the well bottom or another piece.
	*/
	function pieceBottomContact(p, well) {
		let newP = clone(p);
		newP.row -= 1;
		return collision(newP, well);
	}





	/*
		Set up input reader.

		Default keybinds (keycodes):
		up: s (83)
		down: x (88)
		left: z (90)
		right: c (67)
		A: m (77)
		B: , (188)
		C: . (190)
	*/
	var inputs = {
		up: false,
		down: false,
		left: false,
		right: false,
		A: false,
		B: false,
		C: false
	};

	var inputBinds = {
		83: "up",
		88: "down",
		90: "left",
		67: "right",
		77: "A",
		188: "B",
		190: "C"
	};

	function keypress(e, isKeydown) {
		e.preventDefault();
		e.stopPropagation();

		let key = inputBinds[e.keyCode];

		if (key !== undefined) {
			inputs[key] = isKeydown;
		}
	}

	function handleKeydown(e) { keypress(e, true); }
	function handleKeyup(e) { keypress(e, false); }

	document.addEventListener('keydown', handleKeydown, true);
	document.addEventListener('keyup', handleKeyup, true);

	/*
		screen state diagram:
		0 - start -> 1
		1 - levelSelect -> 2
		2 - gameStart -> 3
		3 - pieceSpawn -> 4,7
		4 - pieceLive -> 5,6
		5 - entryDelay -> 3
		6 - lineClear -> 5
		7 - gameOver -> 0
	*/
	var gameScreens = {
		start: new StartScreen(),
		levelSelect: new LevelSelectScreen(),
		gameStart: new GameStartScreen(),
		pieceSpawn: new PieceSpawnScreen(),
		pieceLive: new PieceLiveScreen(),
		entryDelay: new EntryDelayScreen(),
		lineClear: new LineClearScreen(),
		gameOver: new GameOverScreen()
	}

	var gameState = new GameState();

	/*

		UI (React) components

	*/
	class MainLoop extends React.Component {

		constructor(props) {
			super(props);

			this.gameState = this.props.gameState;

		 	this.state = {
		 		currentScreen: this.gameState.currentScreen,
		 		screenDuration: this.gameState.screenDuration,
		 		cursorState: this.gameState.cursorState,
		 		well: this.gameState.well,
		 		level: this.gameState.level,
		 		currentPiece: this.gameState.currentPiece,
		 		nextPiece: this.gameState.nextPiece,
		 		linesToClear: this.gameState.linesToClear,
		 		lockedPiece: this.gameState.lockedPiece
		 	}

		 	this.renderMap = {
		 		start: this.renderStartScreen.bind(this),
		 		levelSelect: this.renderLevelSelectScreen.bind(this),
		 		gameStart: this.renderGameStartScreen.bind(this),
		 		pieceSpawn: this.renderPieceSpawnScreen.bind(this),
		 		pieceLive: this.renderPieceLiveScreen.bind(this),
		 		entryDelay: this.renderEntryDelayScreen.bind(this),
		 		lineClear: this.renderLineClearScreen.bind(this),
		 		gameOver: this.renderGameOverScreen.bind(this) 
		 	}

		 	this.processFrame = this.processFrame.bind(this);
		 	this.updateComponentState = this.updateComponentState.bind(this);

		 	this.piecePreview = document.getElementById("nextPiece");
			this.levelDisplay = document.getElementById("levelDisplay");
		}

		/*
			main loop:
			for each frame, given a screen state, process inputs and then render.
			run loop at 60fps.
		*/
		processFrame() {
			let previousScreen = this.gameState.currentScreen;
			let nextScreen = this.gameState.nextScreen;
			let newGameState = clone(this.gameState);

			if (previousScreen !== nextScreen) {
				//console.log("transition: " + nextScreen);
				newGameState = gameScreens[nextScreen].enter(gameState);
				newGameState.currentScreen = this.gameState.nextScreen;
			}

			newGameState = gameScreens[nextScreen].process(newGameState, inputs);

			gameState = newGameState;
			this.updateComponentState(newGameState);
		}

		updateComponentState(gameState) {
			this.gameState = gameState;

			//console.log("current game state:");
			//console.log(gameState);

			this.setState({
		 		currentScreen: gameState.currentScreen,
		 		screenDuration: gameState.screenDuration,
		 		cursorState: gameState.cursorState,
		 		well: gameState.well,
		 		level: gameState.level,
		 		currentPiece: gameState.currentPiece,
		 		nextPiece: gameState.nextPiece,
		 		linesToClear: gameState.linesToClear,
		 		lockedPiece: gameState.lockedPiece
			})

		}


		renderStartScreen() {
			return <div className='screen text-display'>
				Press any rotate key to start
			</div>
		}

		renderLevelSelectScreen() {
			let levelOptions = gameScreens[this.state.currentScreen].levelOptions;
			let cursorState = this.state.cursorState;

			let listItems = levelOptions.map((level, i) => 
				<ListItem key={i} level={level} selected={i === cursorState} />
			);

			return (<div className='screen text-display'>
				<div>Level Select:</div>
				{listItems}
			</div>);
		}

		renderGameStartScreen() {
			let screenDuration = this.state.screenDuration;
			let message;
			if (screenDuration > gameScreens[this.state.currentScreen].duration / 2) {
				message = "Ready?"
			}
			else {
				message = "GO!"
			}

			return <div className='screen text-display'>
				{message}
			</div>
		}

		renderPieceSpawnScreen() {
			return <WellScreen
						well={this.state.well}
						level={this.state.level}
						currentPiece={this.state.currentPiece}
						linesToClear={this.state.linesToClear}
						lockedPiece={this.state.lockedPiece}
					/>;
		}

		renderPieceLiveScreen() {
			return <WellScreen
						well={this.state.well}
						level={this.state.level}
						currentPiece={this.state.currentPiece}
						linesToClear={this.state.linesToClear}
						lockedPiece={this.state.lockedPiece}
					/>;
		}

		renderEntryDelayScreen() {
			return <WellScreen
						well={this.state.well}
						level={this.state.level}
						currentPiece={this.state.currentPiece}
						linesToClear={this.state.linesToClear}
						lockedPiece={this.state.lockedPiece}
					/>;
		}

		renderLineClearScreen() {
			return <WellScreen
						well={this.state.well}
						level={this.state.level}
						currentPiece={this.state.currentPiece}
						linesToClear={this.state.linesToClear}
						lockedPiece={this.state.lockedPiece}
					/>;
		}

		renderGameOverScreen() {
			return <div className='screen text-display'>
				GAME OVER
			</div>
		}

		componentDidMount() {
			this.interval = setInterval(() => this.processFrame(), (1000 / 60));
		}

		componentWillUnmount() {
			clearInterval(this.interval);
		}

		render () {
			// render the piece preview, if a next piece exists
			ReactDOM.render(<PiecePreview nextPiece={this.state.nextPiece} />,
							this.piecePreview);

			// render the level display
			ReactDOM.render(<LevelDisplay level={this.state.level} />,
							this.levelDisplay);

			// render the game screen
			let currentScreen = this.state.currentScreen;

			return this.renderMap[currentScreen]();
		}
	}

	function PiecePreview(props) {
		let nextPiece = props.nextPiece;
		if (nextPiece != null) {

			// create a 2x10 well
			let well = new Array(2);
			for (let i = 0; i < 2; i++) {
				well[i] = new Array(10);
				well[i].fill(null);
			}

			let p = generateNewPiece(nextPiece);
			// make nextPiece start inside the preview "well"
			p.row = p.row - 18;
			mergePiece(well, p);

			// crop the well to center 2x4 tiles
			for (let i = 0; i < 2; i++) {
				well[i] = well[i].slice(3,7);
			}

			let wellRows = [];
			for (let i = 1; i >= 0; i--) {
				wellRows.push(<WellRow key={i} row={well[i]} />);
			}

			return (<div>{wellRows}</div>);
		}

		return null;
	}

	function LevelDisplay(props) {
		let level = props.level;
		let currentLevel = levelToString(level);
		let targetLevel = getTargetLevel(level);

		return (<div className='levelDisplayText'>
			LEVEL: {currentLevel} / {targetLevel}
		</div>);
	}

	function levelToString(level) {
		if (level < 10) {
			return "00" + (level).toString();
		} else if (level < 100) {
			return "0" + (level).toString();
		}
		return (level).toString();
	}

	function getTargetLevel(level) {
		let hundredthPlace = Math.floor(level / 100);
		if (hundredthPlace === 9) {
			return "999";
		} else {
			return ((hundredthPlace + 1) * 100).toString();
		}
	}

	function ListItem(props) {
		return (
			props.selected ? <div><mark>{props.level}</mark></div> :
							 <div>{props.level}</div>
		);
	}

	function WellScreen(props) {
		let well = copyWell(props.well);
		let currentPiece = props.currentPiece;
		let lockedPiece = props.lockedPiece;

		if (currentPiece != null) {
			mergePiece(well, currentPiece);
		}
		if (lockedPiece != null) {
			mergePiece(well, lockedPiece, "CL");
		}

		let linesToClear = props.linesToClear === null ? [] : props.linesToClear;
		let wellRows = [];
		for (let i = 19; i >= 0; i--) {
			let cleared = linesToClear.includes(i);
			wellRows.push(<WellRow key={i} row={well[i]} cleared={cleared} />);
		}

		return (<div className='screen in-game'>
			{wellRows}
		</div>);
	}

	function WellRow(props) {
		let row = props.row;
		let cleared = props.cleared;

		let tiles = row.map((tile, i) => 
			<WellTile key={i} tile={cleared ? "CL" : tile} />
		);

		return (
			<div className="row">{tiles}</div>
		);
	}

	function WellTile(props) {
		let css = getTileCss(props.tile);

		return (
			<div className={css}></div>
		);
	}

	function copyWell(well) {
		let newWell = new Array(well.length);
		for (let i = 0; i < well.length; i++) {
			newWell[i] = well[i].slice();
		}
		return newWell;
	}

	function clone(obj) {
		return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj)
	}

	function getTileCss(tile) {
		switch (tile) {
			case "CL":
				return "tile piece-cleared";
			case "I":
				return "tile piece-i";
			case "T":
				return "tile piece-t";
			case "L":
				return "tile piece-l";
			case "J":
				return "tile piece-j";
			case "S":
				return "tile piece-s";
			case "Z":
				return "tile piece-z";
			case "O":
				return "tile piece-o";
			default:
				return "tile piece-blank";
		}
	}


	/*
		Helper function to fill well with the current piece's tiles.
		Modifies the well in-place.
	*/
	function mergePiece(well, p, newId) {
		let tiles = Constants.PieceRotation[p.id][p.rotation];
		for (let i = 0; i < tiles.length; i++) {
			let row = p.row + tiles[i][0];
			let col = p.col + tiles[i][1];

			if (newId !== undefined) {
				well[row][col] = newId;
			} else {
				well[row][col] = p.id;
			}
		}
	}



	// start the main loop.
	const el = document.getElementById("screen");
	ReactDOM.render(<MainLoop gameState={gameState} />, el);

})();