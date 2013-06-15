var Schelling = Schelling || {};

sum = function(l) {
  return _.reduce(l, function(memo, item) { return memo + item; }, 0);
};

popRandom = function(array) {
  var index = Math.floor(Math.random() * array.length),
    val;

  if (array.length > 0) {
    val = array[index];
    array.splice(index, 1);
  }
  return val;
};

(function(S) {
  S.colorFunc = function(world, cell) {
    if (cell.group) return cell.group.color;
    else return world.default_color;
  };

  S.makeWorld = function(options) {
    var world = _.extend(options, {});

    // Set a name attribute for each of the groups
    for (groupName in world.groups) {
      world.groups[groupName].name = groupName;
    }

    world.grid = S.makeInitialGrid(options);
    world.$els = options.$doc.children();

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
    var r, c, group, cell, data = [];

    for (r = 0; r < options.rows; ++r) {
      for (c = 0; c < options.cols; ++c) {
        group = S.chooseGroup(options);
        cell = {group: group};
        // Insert a div for the cell
        $('<div/>')
          .css({backgroundColor: S.colorFunc(options, cell)})
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
    var r = pos[0], c = pos[1], index = r * world.cols + c;
    world.grid[index] = cell;
    $(world.$els[index]).css({backgroundColor: S.colorFunc(world, cell)});
  };

  S.isEmpty = function(cell) {
    return cell.group === null;
  };

  S.getNeighbors = function(world, pos) {
    var offr, offc, nr, nc, r = pos[0], c = pos[1],
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

  S.calcHappiness = function(world, pos) {
    var n, neighbor, ncount = 0, 
      incount = 0, outcount = 0, inratio, outratio, 
      cell = S.getCell(world, pos),
      neighbors = S.getNeighbors(world, pos);

    cell = S.getCell(world, pos);
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

  S.swapCells = function(world, pos1, pos2) {
    var cell1, cell2;
    cell1 = S.getCell(world, pos1);
    cell2 = S.getCell(world, pos2);
    S.setCell(world, pos1, cell2);
    S.setCell(world, pos2, cell1);
  };

  S.step = function(world) {
    var r, c, cell, happiness, unhappy = [], empty = [],
        i, movers = [], destinations = [];

    for (r = 0; r < world.rows; ++r) {
      for (c = 0; c < world.cols; ++c) {
        cell = S.getCell(world, [r, c]);
        if (S.isEmpty(cell)) {
          empty.push([r, c]);
        } else {
          cell.happiness = S.calcHappiness(world, [r, c]);
          if (cell.happiness === 0) {
            unhappy.push([r, c]);
          }
        }
      }
    }

    for (i = 0; i < config.movers_per_step; ++i) {
      movers.push(popRandom(unhappy));
      destinations.push(popRandom(empty));
    }

    var mover, destination;
    for (i = 0; i < config.movers_per_step; ++i) {
      mover = movers[i];
      destination = destinations[i];
      if (mover && destination) {
        S.swapCells(world, mover, destination);
      }
    }
  };
})(Schelling);