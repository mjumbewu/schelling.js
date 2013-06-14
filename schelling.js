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
  S.colorFunc = function (cell, options) {
    if (cell.group) return cell.group.color;
    else return options.default_color;
  };

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

  S.makeInitialData = function(options) {
    var r, c, group, data = [];

    for (r = 0; r < options.rows; ++r) {
      for (c = 0; c < options.cols; ++c) {
        group = S.chooseGroup(options);
        data.push({
          group: group
        });
      }
    }
    return data;
  };

  S.getCell = function(data, pos, options) {
    var r = pos[0], c = pos[1], index = r * options.cols + c;
    return data[index];
  };

  S.setCell = function(data, pos, value, options) {
    var r = pos[0], c = pos[1], index = r * options.cols + c;
    data[index] = value;
  };

  S.isEmpty = function(data, pos, options) {
    var cell = S.getCell(data, pos, options);
    return cell.group === null;
  };

  S.calcHappiness = function(data, pos, options) {
    var offr, offc, nr, nc, r = pos[0], c = pos[1],
      ncount = 0, incount = 0, outcount = 0,
      inratio, outratio, 
      nname, groupName, group;

    cell = S.getCell(data, pos, options);
    if (cell.group === null) {
      return null;
    }

    for (offr = -1; offr <= 1; ++offr) {
      for (offc = -1; offc <= 1; ++offc) {
        nr = (offr + r) % options.rows;
        if (nr < 0) nr = options.rows + nr;
        nc = (offc + c) % options.cols;
        if (nc < 0) nc = options.cols + nc;

        neighbor = S.getCell(data, [nr, nc], options);
        if (neighbor.group) {
          ncount++;
          // TODO: Check if we can just compare groups, not names.
          if (neighbor.group.name == cell.group.name) {
            incount++;
          } else {
            outcount++;
          }
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

  S.swapData = function(data, pos1, pos2, options) {
    var cell1, cell2;
    cell1 = S.getCell(data, pos1, options);
    cell2 = S.getCell(data, pos2, options);
    S.setCell(data, pos1, cell2, options);
    S.setCell(data, pos2, cell1, options);
  };

  S.step = function(data, config) {
    var r, c, cell, happiness, unhappy = [], empty = [],
        i, movers = [], destinations = [];

    for (r = 0; r < config.rows; ++r) {
      for (c = 0; c < config.cols; ++c) {
        cell = S.getCell(data, [r, c], config);
        if (S.isEmpty(data, [r, c], config)) {
          empty.push([r, c]);
        } else {
          cell.happiness = S.calcHappiness(data, [r, c], config);
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
        S.swapData(data, mover, destination, config);
      }
    }

    var colorFunc = function(cell) { return S.colorFunc(cell, config); },
        cells;

    cells = d3.select('#schelling-canvas').selectAll('div')
        .data(data)
        .style('background-color', colorFunc);

    cells.enter()
      .append('div')
      .style('background-color', colorFunc);
  };
})(Schelling);