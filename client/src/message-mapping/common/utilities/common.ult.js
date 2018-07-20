import * as d3 from 'd3';
import _ from "lodash";
import {
  COMMON_DATA,
  ID_SVG_OPERATIONS,
  ID_CONTAINER_OPERATIONS,
  AUTO_SCROLL_CONFIG,
} from '../../const/index';


/**
 * Read file format JSON and return
 * @param file
 * @returns {Promise}
 */
export function readDataFileJson(file) {
  return new Promise((resolve, reject) => {
    let fileReader = new FileReader();
    fileReader.onload = () => {
      try {
        let data = JSON.parse(fileReader.result);
        resolve(data);
      }
      catch (ex) {
        comShowMessage(`Read file error!\n${ex.message}`);
      }
    }

    if (file)
      fileReader.readAsText(file);
  });
}

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
 * Get coordinate mouse when click on SVG
 * relation to parent
 * @param e
 * @param parent
 * @returns {{x: number, y: number}}
 */
export function getCoorMouseClickRelativeToParent(e, parent) {
  let container = $(`${parent}`);
  let x = Math.round(e.clientX + container.scrollLeft() - container.offset().left);
  let y = Math.round(e.clientY + container.scrollTop() - container.offset().top);
  return {x, y};
}

/**
 * Init id for object
 * @param type
 */
export function generateObjectId(type) {
  const date = new Date();
  return `${type}${date.getTime()}`;
}

export function checkIsMatchRegexNumber(val) {
  const regex = new RegExp('^(?=.)([+-]?([0-9]*)(\.([0-9]+))?)$');
  return regex.test(val);
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
    (e.keyCode >= 35 && e.keyCode <= 40)) {
    // let it happen, don't do anything
    return;
  }
  // Ensure that it is a number and stop the key press
  if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
    e.preventDefault();
  }
}

export function checkMinMaxValue(val, min = 0, max = 9999) {
  if (parseInt(val) < min || isNaN(parseInt(val)))
    return min;
  else if (parseInt(val) > max)
    return max;
  else return parseInt(val);
}

/**
 * Remove special character in selector query
 * @param id
 * @returns {string}
 */
export function replaceSpecialCharacter(id) {
  return id.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, "\\$&");
}

export function createPath(src, des) {
  return `M${src.x},${src.y} L${des.x},${des.y}`;
}

//move element in array
export function arrayMove(x, from, to) {
  x.splice((to < 0 ? x.length + to : to), 0, x.splice(from, 1)[0]);
}

export function setSizeGraph(options, SVG_CONTAINER_ID) {
  const offer = 200;
  const {width, height} = options;
  if (width) {
    COMMON_DATA.currentWidth = width + offer;
    $(`#${SVG_CONTAINER_ID}`).css("min-width", COMMON_DATA.currentWidth);
  }

  if (height) {
    COMMON_DATA.currentHeight = height + offer;
    $(`#${SVG_CONTAINER_ID}`).css("min-height", COMMON_DATA.currentHeight);
  }
}

/**
 * Shink graph when object drag end.
 * @param d
 */
export function setMinBoundaryGraph(data, SVG_CONTAINER_ID) {

  // Array store size
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
      let {height} = node.getBBox();
      lstOffsetY.push(height + e.y);
    }
  });

  vertices.forEach(e => {
    let node = d3.select(`#${e.id}`).node()
    if (node) {
      let {height} = node.getBBox();
      lstOffsetY.push(height + e.y);
    }
  });

  // Get max width, max height
  let height = Math.max.apply(null, lstOffsetY);

  setSizeGraph({height},SVG_CONTAINER_ID);
}

/**
 * Auto scroll when drag vertex or boundary
 */
export function autoScrollOnMousedrag(d) {
  // Auto scroll on mouse drag
  let svg = d3.select("svg").node();
  const $parent = $(`#${ID_CONTAINER_OPERATIONS}`);
  let h = $parent.height();
  let sT = $parent.scrollTop();
  let coordinates = d3.mouse(svg);
  // let x = coordinates[0];
  let y = coordinates[1];

  if ((y + AUTO_SCROLL_CONFIG.LIMIT_TO_SCROLL) > h) {
    $parent.scrollTop(sT + ((y + AUTO_SCROLL_CONFIG.LIMIT_TO_SCROLL) - h));
  } else if (y < AUTO_SCROLL_CONFIG.LIMIT_TO_SCROLL) {
    $parent.scrollTop(sT - Math.abs(y));
  }

}

export function updateGraphBoundary(d) {
  const {height} = d3.select(`#${d.id}`).node().getBBox();
  let currentY = d3.event.y;
  let margin = 100;

  if ((currentY + height) > COMMON_DATA.currentHeight) {
    COMMON_DATA.currentHeight = currentY + height + margin;
    $(`#${ID_SVG_OPERATIONS}`).css("min-height", COMMON_DATA.currentHeight);
  }
}
