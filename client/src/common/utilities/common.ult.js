import * as d3 from 'd3';
import _ from "lodash";
import {
  HTML_ALGETA_CONTAINER_ID
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
  return id.replace(/(:|\.|\[|\]|,|=|@)/g, "\\\\$1");
}

/**
 * Create string path
 * @param src
 * @param tar
 * @returns {string}
 */
export function createPath(src, tar) {
  // Curved line
  // let diff = {
  //   x: tar.x - src.x,
  //   y: tar.y - src.y
  // };
  //
  // let pathStr = 'M' + src.x + ',' + src.y + ' ';
  // pathStr += 'C';
  // pathStr += src.x + diff.x / 3 + ',' + src.y + ' ';
  // pathStr += src.x + diff.x / 3 + ',' + tar.y + ' ';
  // pathStr += tar.x + ',' + tar.y;
  //
  // return pathStr;

  // Polylines
  // Clone points coordinate
  // let srcDeep = _.cloneDeep(src);
  // let tarDeep = _.cloneDeep(tar);
  // let factor = Math.pow(10, 0);
  // let midPoint = {x: Math.round(((srcDeep.x + tarDeep.x) / 2) * factor) / factor, y: Math.round(((srcDeep.y + tarDeep.y) / 2) * factor) / factor};
  // let srcMidPoint = {x: midPoint.x, y: src.y};
  // let tarMidPoint = {x: midPoint.x, y: tar.y};
  // let pathStr = `M${srcDeep.x},${srcDeep.y} L${srcMidPoint.x},${srcMidPoint.y} L${tarMidPoint.x},${tarMidPoint.y} L${tarDeep.x - 0.5},${tarDeep.y}`;

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

export function getCoordinateMouseOnClick(e) {
  let container = $(`#${HTML_ALGETA_CONTAINER_ID}`);
  let x = e.clientX + container.scrollLeft();
  let y = e.clientY + container.scrollTop();
  return {x, y};
}

export function autoScrollOnMousedrag(e) {
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

