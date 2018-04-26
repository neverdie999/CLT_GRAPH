import MainMgmt from './modules/main-mgmt/main-mgmt';
import ObjectUtils from './common/utilities/object.ult';
import {cancleSelectedPath} from './common/utilities/common.ult';

import * as d3 from 'd3';
import {
  HTML_ALGETA_CONTAINER_ID,
  SVG_CONTAINER_ID,
  GRAPH_WIDTH,
  GRAPH_HEIGHT,
} from './const/index';
import './styles/index.scss';

/**
 * Move DOM element to front of others
 */
d3.selection.prototype.moveToFront = function () {
  return this.each(function () {
    this.parentNode.appendChild(this);
  });
};

/**
 * Move DOM element to back of others
 */
d3.selection.prototype.moveToBack = function () {
  this.each(function () {
    this.parentNode.firstChild && this.parentNode.insertBefore(this, this.parentNode.firstChild);
  });
};



// $('#algetaContainer').scrollLeft($(document).outerWidth());

class Starter {
  constructor() {
    this.initialize();
  }

  initialize() {
    this.dataContainer = {
      vertex: [],
      boundary: [],
      edge: [],
      vertexTypes: {},
    };

    this.svgSelector = d3.select(`#${HTML_ALGETA_CONTAINER_ID}`)
      .append("svg:svg")
      .on("mouseup", function() {
        let mouse = d3.mouse(this);
        let elem = document.elementFromPoint(mouse[0], mouse[1]);
        if((!elem || !elem.tagName || elem.tagName != 'path') && window.udpateEdge) {
          cancleSelectedPath();
        }
      })
      .attr("id", `${SVG_CONTAINER_ID}`)
      .attr("class", "svg");

    /**
     * Init Object Utils
     * @type {ObjectUtils}
     */
    this.objectUtils = new ObjectUtils({
      dataContainer: this.dataContainer
    });

    /**
     * Init Main Mgmt
     * @type {MainMgmt}
     */
    this.mainMgmt = new MainMgmt({
      svgSelector: this.svgSelector,
      objectUtils: this.objectUtils,
      dataContainer: this.dataContainer
    });
  }
}

export default new Starter();
