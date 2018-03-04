/*
  Inputs.js

  Contains an object representation of the game inputs,
  as well as the input reader logic.

  Also contains various functions to determine if the current input state
  satisfies certain conditions (e.g. a button was just pressed)/
*/
var Inputs = (function() {
  var module = {};
  /*
    set up input reader.
    TODO: separate input state objects from module.

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
    CCW1: false,
    CW1: false,
    CCW2: false,
    CW2: false
  };
  module.inputs = inputs;

  var inputState = {
    up: 0,
    down: 0,
    left: 0,
    right: 0,
    CCW1: 0,
    CW1: 0,
    CCW2: 0,
    CW2: 0
  };
  module.inputState = inputState;

  var inputBinds = {
    83: "up",
    88: "down",
    90: "left",
    67: "right",
    77: "CCW1",
    188: "CW1",
    190: "CCW2",
    191: "CW2"
  };
  module.inputBinds = inputBinds;

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

  /*
    call this before starting main loop.
  */
  module.startInputReader = function startInputReader() {
    document.addEventListener('keydown', handleKeydown, true);
    document.addEventListener('keyup', handleKeyup, true);
  }


  /*
    Track how many frames each input is held down.
  */
  module.processInputs = function processInputs(inputState) {
    if (inputs.left) {
      inputState.left++;
    } else {
      inputState.left = 0;
    }

    if (inputs.right) {
      inputState.right++;
    } else {
      inputState.right = 0;
    }

    if (inputs.up) {
      inputState.up++;
    } else {
      inputState.up = 0;
    }

    if (inputs.down) {
      inputState.down++;
    } else {
      inputState.down = 0;
    }

    if (inputs.CCW1) {
      inputState.CCW1++;
    } else {
      inputState.CCW1 = 0;
    }

    if (inputs.CW1) {
      inputState.CW1++;
    } else {
      inputState.CW1 = 0;
    }

    if (inputs.CCW2) {
      inputState.CCW2++;
    } else {
      inputState.CCW2 = 0;
    }

    if (inputs.CW2) {
      inputState.CW2++;
    } else {
      inputState.CW2 = 0;
    }
  }

  /*
    determine if any of the given keys were just pressed
    during the current frame.
  */
  module.justPressed = function justPressed(inputState, keys) {
    for (let k of keys) {
      if (inputState[k] === 1) {
        return true;
      }
    }

    return false;
  }

  module.justPressedButton = function justPressedButton(inputState) {
    return module.justPressed(inputState, ["CCW1", "CW1", "CCW2", "CW2"]);
  }

  /*
    determine whether to apply IRS.
    CCW rotation takes precedence over CW rotation

    -1 = CCW rotation, 0 = no rotation, 1 = CW rotation
  */
  module.irsDirection = function irsDirection(inputState) {
    if (inputState.CCW1 > 0 || inputState.CCW2 > 0)
      return -1;
    else if (inputState.CW1 > 0 || inputState.CW2 > 0)
      return 1;
    return 0;
  }

  /*
    determine which way to rotate a live piece, given inputs.

    should only attempt rotation on initial button press.
    same frame CCW + CW rotations cancel out.
    same frame A + C only rotates once.

    -1 = CCW rotation, 0 = no rotation, 1 = CW rotation
  */
  module.processInputRotation =
  function processInputRotation(inputState) {
    if (inputState.CCW1 === 1 || inputState.CCW2 === 1) {
      if (inputState.CW1 !== 1 && inputState.CW2 !== 1) {
        return -1;
      }
    }
    else if (inputState.CW1 === 1 || inputState.CW2 === 1) {
      return 1;
    }
    return 0;
  }

  /*
    determine which direction a piece should move.

    horizontal input takes precedence over vertical input
    left + right = neutral

    return a tuple of offsets: [offsetRow, offsetCol]

    TODO: Mode 2 introduces sonic drop (with the up key).
          Need to accommodate this.
          For keyboard users, need to handle up + down.
          Another implementation of this game causes
          simultaneous actions: sonic drop + lock.
  */
  module.processInputMovement =
  function processInputMovement(leftDAS, rightDAS, down, threshold) {
    if (leftDAS > 0 || rightDAS > 0) {
      if (leftDAS > 0 && rightDAS > 0) {
        return [0,0];
      }

      if (leftDAS === 1 ||
          leftDAS >= threshold) {
        return [0,-1];
      } else if (rightDAS === 1 ||
                 rightDAS >= threshold) {
        return [0,1];
      }
    }
    else if (down > 0) {
      return [-1,0];
    }

    return [0,0];
  }

  return module;
})();

export default Inputs;