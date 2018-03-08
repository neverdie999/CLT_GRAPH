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

/**
 * Move DOM element to front of others
 * @param elementId
 * @param listDataContainer
 * @returns {Array|Object|*|void}
 */
// d3.selection.prototype.moveToFront = function (elementId, listDataContainer) {
//   return this.each(function () {
//     let childElements = [];
//
//     for (let i = 0; i < this.parentNode.childNodes.length; i++) {
//       if (this.parentNode.childNodes[i].nodeType === 1 && this.parentNode.childNodes[i].nodeName === 'g')
//         childElements.push(this.parentNode.childNodes[i]);
//     }
//     let selectedChild = childElements.find(child => child.id === elementId);
//     this.parentNode.appendChild(selectedChild);
//
//     let selectedData = listDataContainer.find(element => element.id === elementId);
//     listDataContainer.splice(listDataContainer.indexOf(selectedData), 1);
//     listDataContainer.push(selectedData);
//   });
// };


/**
 * Move DOM element to back of others
 * @param elementId
 * @param listDataContainer
 */
// d3.selection.prototype.moveToBack = function(elementId, listDataContainer) {
//   this.each(function() {
//     //change position
//     let childElements = [];
//     for (let i = 0; i < this.parentNode.childNodes.length; i++) {
//       if (this.parentNode.childNodes[i].nodeType === 1 && this.parentNode.childNodes[i].nodeName === 'g')
//         childElements.push(this.parentNode.childNodes[i]);
//     }
//     let selectedChild = childElements.find(child => child.id === elementId);
//     this.parentNode.insertBefore(selectedChild, childElements[0]);
//
//     //reorder index datacontainer
//     let selectedData = listDataContainer.find(element => element.id === elementId);
//     listDataContainer.splice(listDataContainer.indexOf(selectedData), 1);
//     listDataContainer.unshift(selectedData);
//   });
// };

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
        if((!elem.tagName || elem.tagName != 'path') && window.udpateEdge) {
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
