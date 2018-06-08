import * as d3 from 'd3';
import _ from "lodash";
import {
  HTML_ALGETA_CONTAINER_ID,
  SVG_CONTAINER_ID,
  DEFAULT_CONFIG_GRAPH,
  REPEAT_RANGE,
} from '../../const/index';

/**
 * Show message alert
 * @param msg
 */
export function comShowMessage(msg = null) {
  if (!msg)
    return;
  alert(msg);
}

/**
 * Gernerate object id with format 'prefix' + Date.now()
 * Ex for vertex: V1234234234
 * Ex for edge: E1234234234
 * Ex for boundary: B1234234234
 * @returns {string}
 */
export function generateObjectId(prefix = 'V') {
  let date = new Date();
  return `${prefix}${date.getTime()}`;
}

/**
 * Remove special character in selector query
 * @param id
 * @returns {string}
 */
export function replaceSpecialCharacter(id) {
  // return id.replace(/(:|\.|\[|\]|,|=|@)/g, "\\\\$1");
  return id.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, "\\$&");
}

/**
 * Create string path
 * @param src
 * @param tar
 * @returns {string}
 */
export function createPath(src, tar) {
  // Straight line
  let pathStr = `M${src.x},${src.y} L${tar.x},${tar.y}`;

  return pathStr;
};

/**
 * Cancle selected path when user
 * click click outside path selected or move object...
 */
export function cancleSelectedPath() {
  window.udpateEdge = false;
  d3.select('#edgePath').style("display", "none");
  d3.select('#groupEdgePoint').style("display", "none");
  d3.select("#groupEdgePoint").moveToBack();
  d3.select("#edgePath").moveToBack();
}

/**
 * Get coordinate mouse when click on SVG
 */
export function getCoordinateMouseOnClick(e) {
  let container = $(`#${HTML_ALGETA_CONTAINER_ID}`);
  let x = e.clientX + container.scrollLeft();
  let y = e.clientY + container.scrollTop();
  return {x, y};
}

/**
 * Auto scroll when drag vertex or boundary
 */
export function autoScrollOnMousedrag(d) {
  // Autoscroll on mousedrag
  let svg = d3.select("svg").node();
  const $parent = $(`#${HTML_ALGETA_CONTAINER_ID}`);
  let w = $parent.width();
  let h = $parent.height();
  let sL = $parent.scrollLeft();
  let sT = $parent.scrollTop();
  let coordinates = d3.mouse(svg);
  let x = coordinates[0];
  let y = coordinates[1];

  if (x > w + sL) {
    $parent.scrollLeft(x - w);
  } else if (x < sL) {
    $parent.scrollLeft(x);
  }

  if (y > h + sT) {
    $parent.scrollTop(y - h);
  } else if (y < sT) {
    $parent.scrollTop(y);
  }
}

export function updateGraphBoundary(d) {
  const {width, height} = d3.select(`#${d.id}`).node().getBBox();
  const $parent = $(`#${HTML_ALGETA_CONTAINER_ID}`);
  let currentX = d3.event.x;
  let currentY = d3.event.y;
  let margin = 100;
  if ((currentX + width) > window.xBoundary) {
    window.xBoundary = currentX + width + margin;
    $(`#${SVG_CONTAINER_ID}`).css("min-width", window.xBoundary);
  }

  if ((currentY + height) > window.yBoundary) {
    window.yBoundary = currentY + height + margin;
    $(`#${SVG_CONTAINER_ID}`).css("min-height", window.yBoundary);
  }
}

export function setSizeGraph(options = {
  width: DEFAULT_CONFIG_GRAPH.MIN_WIDTH,
  height: DEFAULT_CONFIG_GRAPH.MIN_HEIGHT
}) {
  let $parent = $(`#${HTML_ALGETA_CONTAINER_ID}`);
  let offer = 200;
  if (options.width) {
    window.xBoundary = options.width + offer;
    $(`#${SVG_CONTAINER_ID}`).css("min-width", window.xBoundary);
  }

  if (options.height) {
    window.yBoundary = options.height + offer;
    $(`#${SVG_CONTAINER_ID}`).css("min-height", window.yBoundary);
  }
}

/**
 * Shink graph when object drag end.
 * @param d
 */
export function setMinBoundaryGraph(data) {
  // Array store size
  let lstOffsetX = [1900];
  let lstOffsetY = [959];

  // Filter boundary without parent
  let boundaries = _.filter(data.boundary, (g) => {
    return g.parent == null;
  });

  // Filter vertex without parent
  let vertices = _.filter(data.vertex, (g) => {
    return g.parent == null;
  });

  boundaries.forEach(e => {
    let node = d3.select(`#${e.id}`).node()
    if (node) {
      let {width, height} = node.getBBox();
      lstOffsetX.push(width + e.x);
      lstOffsetY.push(height + e.y);
    }
  });

  vertices.forEach(e => {
    let node = d3.select(`#${e.id}`).node()
    if (node) {
      let {width, height} = node.getBBox();
      lstOffsetX.push(width + e.x);
      lstOffsetY.push(height + e.y);
    }
  });

  // Get max width, max height
  let width = Math.max.apply(null, lstOffsetX);
  let height = Math.max.apply(null, lstOffsetY);

  setSizeGraph({width, height});
}

/**
 * Allow only numeric (0-9) in HTML inputbox using jQuery.
 * Allow: backspace, delete, tab, escape, enter and .
 * Allow: Ctrl+A, Command+A
 */

export function allowInputNumberOnly(e) {
  // Allow: backspace, delete, tab, escape, enter, dot(.) and +
  if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190, 187, 189]) !== -1 ||
    // Allow: Ctrl+A, Command+A
    (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
    // Allow: home, end, left, right, down, up
    (e.keyCode >= 35 && e.keyCode <= 40)){
    // let it happen, don't do anything
    return;
  }
  // Ensure that it is a number and stop the keypress
  if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
    e.preventDefault();
  }
}

export function checkMinMaxValue(val, min = REPEAT_RANGE.MIN, max = REPEAT_RANGE.MAX) {
  if (parseInt(val) < min || isNaN(parseInt(val)))
    return min;
  else if (parseInt(val) > max)
    return max;
  else return parseInt(val);
}

export function checkIsMatchRegex(val) {
  const regex = new RegExp('^(?=.)([+-]?([0-9]*)(\.([0-9]+))?)$');
  return regex.test(val);
}
