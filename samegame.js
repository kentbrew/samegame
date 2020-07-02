/* use strict */

// globals that won't change during the course of a single game
const config = {
  // full size is 24x24; decrease to test
  dim: 24,
  // empty spaces are gray
  empty: "GRAY",
  // game colors
  colors: [
    // first color will be used during floodfill and will never show on the board 
    Color.Black,
    Color.Blue,
    Color.Yellow,
    Color.Red,
    Color.Green,
    Color.Violet,
    // orange appears last because it is hardest to tell from yellow
    Color.Orange
  ],
  // when checking for neighbors, add these values to current x and y
  moveMod: [
    // up
    { x: 0, y: -1 },
    // right
    { x: 1, y: 0 },
    // down
    { x: 0, y: 1 },
    // left
    { x: -1, y: 0 }
  ]
},
// globals that can change throughout the game (start function adds more)
me = {
  // how many colors do you want on the board?
  difficulty: 3
},
// all dots gone? we win!
win = () => {
  me.done = true;
  me.text = `Winner! Score: ${me.score}. Up to play again`;
},
// all moves gone? we lose.
fail = () => {
  me.done = true;
  me.text = `Game over. Score: ${me.score}. Up to play again`;
},
// find and return all neighbors for a location
nearby = (x, y) => {
  // if we find any neighbors they will go here
  let found = [];
  // go through all four directions
  config.moveMod.filter((mod) => {
    checkX = x + mod.x;
    checkY = y + mod.y;
    if (checkX > -1 && checkX < config.dim && checkY > -1 && checkY < config.dim) {
      // return the neighbor's coordinates and color
      found.push({
        x: checkX,
        y: checkY,
        // this will be a color
        c: me.data[checkX * config.dim + checkY]
      });
    }
  });
  return found;
},
// to run these, enter test("something") in console
test = (condition) => {
  let temp = new Array(config.dim * config.dim).fill(config.empty);
  switch(condition) {
    case "win":
      temp[config.dim - 2] = config.colors[1];
      temp[config.dim - 1] = config.colors[1];
      me.data = temp;
      me.text = "Testing win; make a move.";
      me.score = 8675309;
      break;
    case "fail":
      temp[config.dim - 3] = config.colors[1];
      temp[config.dim - 2] = config.colors[1];
      temp[config.dim - 1] = config.colors[2];
      me.data = temp;
      me.text = "Testing fail; make a move.";
      me.score = 666;
      break;
    default:
      console.log(`Unknown test ${condition}`);
  }
},
// is the game over?
check = () => {
  // did we win?
  let done = 0;
  for (x = config.dim - 1; x < config.dim * config.dim; x = x + config.dim) {
    if (me.data[x] === config.empty) {
      done++;
    }
  }
  if (done === config.dim) {
    win();
    return;
  }
  // if we're still here we did not win. Do we have any moves left?
  let found = false;
  me.data.filter((color, index) => {
    // don't check empty spaces
    if (color !== config.empty) {
      // get all my neighbors
      nearby(~~(index/config.dim), index % config.dim).filter((n) => {
        // does this neighbor have my color?
        if (n.c === color) {
          // we're good
          found = true;
        }
      });
    }
  });
  // if we have not found a move, there are no moves left
  if (!found) {
    fail();
  }
},
// tag all neighboring dots matching a color
fill = (x, y, c) => {
  nearby(x, y).filter((n) => {
    if (n.c === c) {
      // zero me
      me.data[n.x * config.dim + n.y] = config.colors[0];
      // recurse to check all my neighbors
      fill(n.x, n.y, c);
    }
  });
  return;
},
// scan the entire board for black dots and collapse them one column at a time
collapse = () => {
  // shift columns left when one is empty
  const removeCol = col => {
    // start with the gray column
    for (x = col; x < config.dim - 1; x = x + 1) {
      // do for every dot in the column
      for (y = 0; y < config.dim; y = y + 1) {
        // copy the dot to the right of this one
        temp[x * config.dim + y] = temp[(x + 1) * config.dim + y];
      }
    }
    // blank out the rightmost column
    for (y = 0; y < config.dim; y = y + 1) {
      temp[x * config.dim + y] = config.empty;
    }
  }, 
  // grind is pretty crude; it calls itself until it doesn't change a dot
  grind = () => {
    let x, y, v, found = 0;
    // go left to right for columns
    for (x = 0; x < config.dim; x = x + 1) {
      // go bottom to top for rows
      for (y = config.dim - 1; y > -1; y = y - 1) {
        // get the current value of this dot
        v = temp[x * config.dim + y];
        // if it's color zero, it's been flood-filled and needs to collapse
        if (v === config.colors[0]) {
          // found one
          found = found + 1;
          // score = score plut the number found so far times difficulty
          me.score = me.score + found * me.difficulty;
          // bottom to top: remove this dot and copy the one above it
          for (k = y; k > 0; k = k - 1) {
            temp[x * config.dim + k] = temp[x * config.dim + k - 1];
          }
          // top dot is now empty
          temp[x * config.dim] = config.empty;
        }
      }
      // if the bottom dot is empty, remove the column      
      if (temp[x * config.dim + config.dim - 1] === config.empty) {
        removeCol(x);
      }
    }
    // we removed a dot so there may be more to do
    if (found) {
      grind();
    } else {
      // we are now done grinding and can now copy our temp data back to main
      me.data = temp;
      // check for win or fail
      check();
    }
  }, 
  // take a snapshot of game data to work with
  temp = [...me.data];
  // recurse until all empty cells have been collapsed
  grind();
  // if the game is still on, update the score
  if (!me.done) {
    me.text = "Score: " + me.score;
  }
},
// things we do to make a mark on the board
move = (x, y, c) => {
  // flood-fill all dots of the same color that touch the dot we just clicked 
  fill(x, y, c);
  // remove the area we just filled and reshuffle rows and columns
  collapse();
},
// start a new game
start = () => {
  // our working copy of the board
  me.data = [];
  // text content
  me.text = "";
  // point total
  me.score = 0;
  // our done state
  me.done = false;
  // randomize the board
  for (i = 0; i < config.dim * config.dim; i = i + 1) {
    me.data.push(config.colors[Math.floor(Math.random() * me.difficulty) + 1]);
  }
},
// this runs as often as possible through the game's loop
update = () => {
  // update dots
  me.data.filter((color, index) => {
    game.setDot(~~(index/config.dim), index % config.dim, color);
  });
  // update text
  game.setText(me.text);
},
// if someone clicks a dot, do this:
onDotClicked = (x, y) => {
  // get the color of the dot we just clicked
  const c = game.getDot(x, y);
  // does the dot we clicked have a color?
  if (c !== config.empty) {
    // get all my neighbors
    nearby(x, y).filter((n) => {
      // does this neighbor have the same color we just clicked
      if (n.c === c) {
        // run the move
        move(x, y, c);
      }
    });
  }
},
// valid keys are up, down, right, and left
onKeyPress = (direction) => {
  // restart on current difficulty
  if (direction === Direction.Up) {
    start();
  }
  // decrease difficulty and restart
  if (direction === Direction.Left) {
    me.difficulty = me.difficulty - 1;
    if (me.difficulty < 2) {
      me.difficulty = 2;
    }
    start();
  }
  // increase difficulty and restart
  if (direction === Direction.Right) {
    me.difficulty = me.difficulty + 1;
    if (me.difficulty > 6) {
      me.difficulty = 6;
    }
    start();
  }
},
// initialze the game
create = () => {
  // run the start function
  start();
},
// create an instance of Game to run
game = new Game({create, update, onDotClicked, onKeyPress});
// start the game
game.run();
