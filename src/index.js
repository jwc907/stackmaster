import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

import GameEngine from './GameEngine.js';
import Inputs from './Inputs.js';
import Pieces from './Pieces.js';
import Util from './Util.js';

import registerServiceWorker from './registerServiceWorker';
registerServiceWorker();



(function () {
  /*
    set up control flow.

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
    start: new GameEngine.StartScreen(),
    levelSelect: new GameEngine.LevelSelectScreen(),
    gameStart: new GameEngine.GameStartScreen(),
    pieceSpawn: new GameEngine.PieceSpawnScreen(),
    pieceLive: new GameEngine.PieceLiveScreen(),
    entryDelay: new GameEngine.EntryDelayScreen(),
    lineClear: new GameEngine.LineClearScreen(),
    gameOver: new GameEngine.GameOverScreen()
  }

  /*
    main loop:
    for each frame, given a screen state, process inputs and then render.
    run loop at 60fps.
  */
  class MainLoop extends React.Component {

    constructor(props) {
      super(props);

      this.gameState = this.props.gameState;
      this.prevState = null;
      this.lockedPiece = null;

      this.inputs = this.props.inputs;

      this.state = {
        currentScreen: this.gameState.currentScreen,
        cursorState: this.gameState.cursorState,
        level: this.gameState.level,
        previewWell: null
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
      the main loop: this gets called once per frame.
    */
    processFrame() {
      Inputs.processInputs(this.inputs);

      let previousScreen = this.gameState.currentScreen;
      let nextScreen = this.gameState.nextScreen;
      let newState = Util.clone(this.gameState);

      if (previousScreen !== nextScreen) {
        newState = gameScreens[nextScreen].enter(newState);
        newState.currentScreen = newState.nextScreen;
      }

      newState = gameScreens[nextScreen].process(newState, this.inputs);

      this.updateComponentState(newState);
    }

    /*
      updates the internal game state as well as React state.
    */
    updateComponentState(newState) {
      this.prevState = this.gameState;
      this.gameState = newState;

      // only set React state on change!
      // ...but make sure to batch updates and call setState()
      // exactly once to prevent issues with asynchronicity!
      let newProps = {};

      // currentScreen
      if (this.prevState.currentScreen !== newState.currentScreen) {
        newProps.currentScreen = newState.currentScreen;
      }

      // cursorState
      if (this.prevState.cursorState !== newState.cursorState) {
        newProps.cursorState = newState.cursorState;
      }

      // gameStartMessage
      if (newState.currentScreen === "gameStart") {
        let totalDuration = gameScreens[newState.currentScreen].duration;
        let gameStartMessage = getGameStartMessage(totalDuration,
                               newState.screenDuration);
        newProps.gameStartMessage = gameStartMessage;
      }

      // previewWell
      if (this.prevState.nextPiece !== newState.nextPiece) {
        if (newState.nextPiece != null) {
          // create a 2x10 well
          let previewWell = new Array(2);
          for (let i = 0; i < 2; i++) {
            previewWell[i] = new Array(10);
            previewWell[i].fill(null);
          }

          let p = GameEngine.generateNewPiece(newState.nextPiece);
          // make nextPiece start inside the preview "well"
          p.row = p.row - 18;
          mergePiece(previewWell, p);

          // crop the well to only include center 2x4 tiles
          for (let i = 0; i < 2; i++) {
            previewWell[i] = previewWell[i].slice(3,7);
          }

          newProps.previewWell = previewWell;
        } else {
          newProps.previewWell = null;
        }
      }

      // level
      if (this.prevState.level !== newState.level) {
        newProps.level = newState.level;
      }

      // well:
      // when a piece is live, the visual state of the well only changes
      // when the piece moves; therefore, comparing currentPiece between
      // the previous and current state is sufficient
      if (newState.currentScreen === "pieceSpawn" ||
        newState.currentScreen === "pieceLive") {
        let oldP = this.prevState.currentPiece;
        let newP = newState.currentPiece;

        if (newP != null && !newP.equals(oldP)) {
          let newWell = copyWell(newState.well);
          mergePiece(newWell, newP);
          newProps.well = newWell;
        }

        if (newP == null) { // on piece lock...
          this.lockedPiece = oldP; // piece cannot have moved.
        }
      }

      // well:
      // display lock flash if necessary; update well regardless
      if (newState.currentScreen === "entryDelay") {
        // update well when first entering the screen...
        if (this.prevState.currentScreen !== "entryDelay") {
          let newWell = copyWell(newState.well);
          mergePiece(newWell, this.lockedPiece, "CL");
          newProps.well = newWell;
        }

        // ...and when lock flash duration ends
        let totalDuration = gameScreens["entryDelay"].duration;
        let currentDuration = newState.screenDuration;
        let flashDuration = gameScreens["entryDelay"].flashDuration;

        if (currentDuration + flashDuration < totalDuration) {
          this.lockedPiece = null;
          newProps.well = newState.well;
        }
      }

      // well:
      // make cleared lines flash. only need to do this once per clear
      if (newState.currentScreen === "lineClear" &&
        this.prevState.currentScreen !== "lineClear") {
        let newWell = copyWell(newState.well);

        for (let i = 0; i < newWell.length; i++) {
          if (newState.linesToClear.includes(i)) {
            for (let j = 0; j < newWell[i].length; j++) {
              newWell[i][j] = "CL";
            }
          }
        }

        this.lockedPiece = null;
        newProps.well = newWell;
      }

      this.setState(newProps);
    }

    // incredibly naive timestep. TODO: may revisit.
    // that said, the gameplay requires a strict 60fps!
    componentDidMount() {
      this.interval = setInterval(() => this.processFrame(), (1000 / 60));
    }

    componentWillUnmount() {
      clearInterval(this.interval);
    }

    render() {
      // render the piece preview, if a next piece exists
      ReactDOM.render(<PiecePreview previewWell={this.state.previewWell} />,
                      this.piecePreview);

      // render the level display
      ReactDOM.render(<LevelDisplay level={this.state.level} />,
                      this.levelDisplay);

      // render the game screen
      let currentScreen = this.state.currentScreen;

      return this.renderMap[currentScreen]();
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
      return <div className='screen text-display'>
        {this.state.gameStartMessage}
      </div>
    }

    renderPieceSpawnScreen() {
      return <WellScreen well={this.state.well}/>;
    }

    renderPieceLiveScreen() {
      return <WellScreen well={this.state.well}/>;
    }

    renderEntryDelayScreen() {
      return <WellScreen well={this.state.well}/>;
    }

    renderLineClearScreen() {
      return <WellScreen well={this.state.well}/>;
    }

    renderGameOverScreen() {
      return <div className='screen text-display'>
        GAME OVER
      </div>
    }
  }



  /*
    helper functions for determining new React state
  */

  /*
    generates the message to display on the gameStart screen.
  */
  function getGameStartMessage(totalDuration, currentDuration) {
    if (currentDuration > totalDuration / 2) {
      return "READY?";
    } else {
      return "GO!";
    }
  }

  /*
    formats the given level and returns a string.
  */
  function levelToString(level) {
    if (level < 10) {
      return "00" + (level).toString();
    } else if (level < 100) {
      return "0" + (level).toString();
    }
    return (level).toString();
  }

  /*
    calculates target level (i.e. must clear lines to pass the target),
    given the current level.
  */
  function getTargetLevel(level) {
    let hundredthPlace = Math.floor(level / 100);
    if (hundredthPlace === 9) {
      return "999";
    } else {
      return ((hundredthPlace + 1) * 100).toString();
    }
  }

  /*
    deep copies well.
  */
  function copyWell(well) {
    let newWell = new Array(well.length);
    for (let i = 0; i < well.length; i++) {
      newWell[i] = well[i].slice();
    }
    return newWell;
  }

  /*
    fills well with the given Piece p's tiles.
    if newId is specified, newId will be used in place of p.id
    modifies the well in-place.
  */
  function mergePiece(well, p, newId) {
    if (p == null) return;

    let tiles = Pieces.Rotations[p.id][p.rotation];
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

  /*
    returns CSS classes given a PieceId
    "CL" is a special case indicating piece lock or line clear flash.
  */
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
    helper React components
  */

  /*
    props:
    previewWell - the well representation of the preview piece
                  should be a 2x4 array of PieceIds.
  */
  function PiecePreview(props) {
    let previewWell = props.previewWell;

    if (previewWell != null) {
      let wellRows = [];
      for (let i = 1; i >= 0; i--) {
        wellRows.push(<WellRow key={i} row={previewWell[i]} />);
      }

      return (<div>{wellRows}</div>);
    }

    return null;
  }

  /*
    props:
    level - the current level.
  */
  function LevelDisplay(props) {
    let level = props.level;
    let currentLevel = levelToString(level);
    let targetLevel = getTargetLevel(level);

    return (<div className='levelDisplayText'>
      LEVEL: {currentLevel} / {targetLevel}
    </div>);
  }

  /*
    React functional component representing an option on the level select screen.

    props:
    selected - whether to highlight the given menu option
    level - string representation of the given level
  */
  function ListItem(props) {
    return (
      props.selected ? <div><mark>{props.level}</mark></div> :
               <div>{props.level}</div>
    );
  }

  /*
    props:
    well - array of WellRows
  */
  function WellScreen(props) {
    let wellRows = [];
    for (let i = 19; i >= 0; i--) {
      wellRows.push(<WellRow key={i} row={props.well[i]} />);
    }

    return (<div className='screen in-game'>
      {wellRows}
    </div>);
  }

  /*
    props:
    row - array of WellTiles
  */
  function WellRow(props) {
    let tiles = props.row.map((tile, i) =>
      <WellTile key={i} tile={tile} />
    );

    return (
      <div className="row">{tiles}</div>
    );
  }

  /*
    props:
    tile - PieceId or "CL" indicating lock flash or line clear flash
  */
  function WellTile(props) {
    let css = getTileCss(props.tile);

    return (
      <div className={css}></div>
    );
  }



  // start the main loop.
  Inputs.startInputReader();
  var initialGameState = new GameEngine.GameState();
  const el = document.getElementById("screen");
  ReactDOM.render(<MainLoop gameState={initialGameState} inputs={Inputs.inputState} />, el);

})();