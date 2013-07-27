var Schelling = Schelling || {};

sum = function(l) {
  return _.reduce(l, function(memo, item) { return memo + item; }, 0);
};

popRandom = function(array) {
  return chooseRandom(array, true);
};

chooseRandom = function(array, pop) {
  var index = Math.floor(Math.random() * array.length),
    val;

  if (array.length > 0) {
    val = array[index];
    if (pop) array.splice(index, 1);
  }
  return val;
};

(function(S) {
  S.colorFunc = function(world, cell) {
    if (cell.group) return cell.group.color;
    else return world.default_color;
  };

  S.makeWorld = function(options) {
    var world = _.extend(options, {}),
        i, cell;

    // Set a name attribute for each of the groups
    for (groupName in world.groups) {
      world.groups[groupName].name = groupName;
    }

    world.grid = S.makeInitialGrid(options);
    world.$els = options.$doc.children();

    world.unhappy_cells = []
    world.empty_cells = []
    for (i = 0; i < world.grid.length; ++i) {
      cell = world.grid[i];
      if (S.isEmpty(cell)) {
        world.empty_cells.push(cell);
      }
      else if (S.calcHappiness(world, cell) === 0) {
        world.unhappy_cells.push(cell);
      }
    }

    return world;
  }

  S.chooseGroup = function(options) {
    var total = sum(_.values(options.mix)),
      groupVal = Math.random() * total,
      accumulator = 0,
      groupNames = _.keys(options.mix),
      groupName;

    for (g = 0; g < groupNames.length; ++g) {
      groupName = groupNames[g];
      accumulator += options.mix[groupName];
      if (groupVal < accumulator) {
        if (groupName in options.groups)
          return options.groups[groupName];
        else
          return null;
      }
    }
  };

  S.makeInitialGrid = function(options) {
    var r, c, group, cell, color, data = [];

    for (r = 0; r < options.rows; ++r) {
      for (c = 0; c < options.cols; ++c) {
        group = S.chooseGroup(options);

        if (group)
          color = group.color;
        else
          color = options.default_color;

        cell = {
          pos: [r, c],
          group: group,
          color: color
        };

        // Insert a div for the cell
        $('<div style="background-color: ' + color + '"/>')
          .appendTo(options.$doc);
        data.push(cell);
      }
    }
    return data;
  };

  S.getCell = function(world, pos) {
    var r = pos[0], c = pos[1], index = r * world.cols + c;
    return world.grid[index];
  };

  S.setCell = function(world, pos, cell) {
    var r = pos[0], c = pos[1], index = r * world.cols + c,
        neighbors, neighbor, n;

    cell.pos = pos;
    world.grid[index] = cell;
    world.$els[index].style['background-color'] = cell.color;

    // The cell's happiness may have changed.
    S.updateHappiness(world, cell);

    // All of the cell's neighbors' happiness may have changes as well.
    neighbors = S.getNeighbors(world, cell);
    for (n = 0; n < neighbors.length; ++n) {
      neighbor = neighbors[n];
      S.updateHappiness(world, neighbor);
    }
  };

  S.isEmpty = function(cell) {
    return cell.group === null;
  };

  S.getNeighbors = function(world, cell) {
    var offr, offc, nr, nc, r = cell.pos[0], c = cell.pos[1],
        neighbors = [];

    for (offr = -1; offr <= 1; ++offr) {
      for (offc = -1; offc <= 1; ++offc) {
        if (offr === 0 && offc === 0)
          continue;

        nr = (offr + r) % world.rows;
        if (nr < 0) nr = world.rows + nr;
        nc = (offc + c) % world.cols;
        if (nc < 0) nc = world.cols + nc;

        neighbor = S.getCell(world, [nr, nc]);
        neighbors.push(neighbor);
      }
    }
    return neighbors;
  };

  S.calcHappiness = function(world, cell) {
    var n, neighbor, ncount = 0, 
      incount = 0, outcount = 0, inratio, outratio, 
      neighbors = S.getNeighbors(world, cell);

    if (S.isEmpty(cell)) {
      return null;
    }

    for (n = 0; n < neighbors.length; ++n) {
      neighbor = neighbors[n];
      if (!S.isEmpty(neighbor)) {
        ncount++;
        // TODO: Check if we can just compare groups, not names.
        if (neighbor.group.name == cell.group.name) {
          incount++;
        } else {
          outcount++;
        }
      }
    }

    inratio = incount/ncount;
    outratio = outcount/ncount;
    if (cell.group.other_tolerance >= outratio &&
      cell.group.other_affinity <= outratio &&
      cell.group.self_tolerance >= inratio &&
      cell.group.self_affinity <= inratio) {
      return 1;
    } else {
      return 0;
    }
  };

  S.swapCells = function(world, cell1, cell2) {
    var pos1, pos2;
    pos1 = cell1.pos.slice();
    pos2 = cell2.pos.slice();
    S.setCell(world, pos1, cell2);
    S.setCell(world, pos2, cell1);
  };

  S.updateHappiness = function(world, cell) {
    var i, wasHappy, happiness;

    i = world.unhappy_cells.indexOf(cell);
    wasHappy = (i === -1);

    happiness = S.calcHappiness(world, cell);
    if (happiness === 0) {
      if (wasHappy) {
        // It's no longer happy.
        world.unhappy_cells.push(cell);
      }
    } else {
      if (!wasHappy) {
        // It's happy, but wasn't before.
        world.unhappy_cells.splice(i, 1);
      }
    }
  };

  S.step = function(world) {
    var mover, vacancy,
        neighbors, neighbor, n;

    // Choose a random unhappy cell to move and a random empty spot to move
    // it to.
    mover = popRandom(world.unhappy_cells);
    vacancy = chooseRandom(world.empty_cells);

    if (mover && vacancy) {
      S.swapCells(world, mover, vacancy);
    }
  };
})(Schelling);