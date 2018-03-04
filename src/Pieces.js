/*
  Pieces.js

  Contains a definition of the Piece class as well as
  constants that are used for various physics checks.
*/
var Pieces = (function() {
  var module = {};

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
  module.Rotations = {
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
  module.Heights = {
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
  module.Widths = {
    I: [[0,4], [2,1], [0,4], [2,1]],
    T: [[0,3], [0,2], [0,3], [1,2]],
    L: [[0,3], [0,2], [0,3], [1,2]],
    J: [[0,3], [0,2], [0,3], [1,2]],
    S: [[0,3], [0,2], [0,3], [0,2]],
    Z: [[0,3], [1,2], [0,3], [1,2]],
    O: [[0,2], [0,2], [0,2], [0,2]]
  };

  /*
    the initial spawn position for each piece.
    the positions take into account the offsets defined in PieceRotation.
  */
  module.SpawnPositions = {
    I: [17,3],
    T: [18,3],
    L: [18,3],
    J: [18,3],
    S: [18,3],
    Z: [18,3],
    O: [18,4]
  };

  // the complete set of pieces.
  module.PieceArray = ["I","T","L","J","S","Z","O"];

  // the set of pieces that are legal first pieces (i.e. at lvl 000)
  module.PieceInitialArray = ["I","T","L","J"];



  /*
    Piece - object representation of a piece.

    pieceId: string id representing one of the 7 possible pieces
    row, col: coordinates fixed on the piece's "bottom-left" position
    rotation: the rotation state. possible values: 0 to 3
  */
  module.Piece = class Piece {
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

    /*
      +1 -> clockwise rotation
      -1 -> counter-clockwise rotation
    */
    rotate(dir) {
      this._rotation = (this._rotation + dir + 4) % 4;
    }

    /*
      test for equality and return boolean result.
      id, row, col, and rotation must all be equal
    */
    equals(otherP) {
      if (otherP == null) return false;
      if (otherP.id !== this._id) return false;
      if (otherP.row !== this._row) return false;
      if (otherP.col !== this._col) return false;
      if (otherP.rotation !== this._rotation) return false;

      return true;
    }
  }

  return module;
})();

export default Pieces;