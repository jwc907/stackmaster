/*
  Util.js

  Contains various auxiliary functions.
*/
import Pieces from './Pieces.js';

var Util = (function() {
  /*
    clones an object.
  */
  module.clone = function clone(obj) {
    return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj)
  }

  /*
    checks whether a piece is OOB or collides with something inside the well

    returns true if there is a collision
  */
  module.collision = function collision(p, well) {
    // left/bottom/right OOB check.
    // note that depending on piece/rotation, p.row or p.col can be negative!
    let heightOffset = Pieces.Heights[p.id][p.rotation];
    let widthOffset = Pieces.Widths[p.id][p.rotation];
    if ((p.row + heightOffset[0]) < 0 ||
        (p.col + widthOffset[0]) < 0 ||
        (p.col + widthOffset[0] + widthOffset[1]) > well[0].length) {
      return true;
    }

    // well collision check
    let orientation = Pieces.Rotations[p.id][p.rotation]; // [[y0,x0], [y1,x1], ..]
    for (let i = 0; i < orientation.length; i++) {
      if (well[p.row + orientation[i][0]][p.col + orientation[i][1]] != null) {
        return true;
      }
    }

    return false;
  }

  return module;
})();

export default Util;