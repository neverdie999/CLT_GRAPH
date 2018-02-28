import MainMgmt from './modules/main-mgmt/main-mgmt';
import ObjectUtils from './common/utilities/object.ult';
import {cancleSelectedPath} from './common/utilities/common.ult';

import * as d3 from 'd3';
import {
  HTML_ALGETA_CONTAINER_ID,
  GRAPH_WIDTH,
  GRAPH_HEIGHT,
} from './const/index';
import './styles/index.scss';

d3.selection.prototype.moveToFront = function () {
  return this.each(function () {
    this.parentNode.appendChild(this);
  });
};

d3.selection.prototype.moveToBack = function () {
  this.each(function () {
    this.parentNode.firstChild && this.parentNode.insertBefore(this, this.parentNode.firstChild);
  });
};

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
      .append("svg")
      .on("mouseup", function() {
        let mouse = d3.mouse(this);
        let elem = document.elementFromPoint(mouse[0], mouse[1]);
        // console.log("mouseup", elem.tagName)
        if(!elem.tagName || elem.tagName != 'path') {
          cancleSelectedPath();
        }
      })
      .attr("class", "svg")
      .attr("height", GRAPH_HEIGHT)
      .attr("width", GRAPH_WIDTH);

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
