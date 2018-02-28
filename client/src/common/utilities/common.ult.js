import * as d3 from 'd3';

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
  let diff = {
    x: tar.x - src.x,
    y: tar.y - src.y
  };

  let pathStr = 'M' + src.x + ',' + src.y + ' ';
  pathStr += 'C';
  pathStr += src.x + diff.x / 3 + ',' + src.y + ' ';
  pathStr += src.x + diff.x / 3 + ',' + tar.y + ' ';
  pathStr += tar.x + ',' + tar.y;

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
