import MainMenuContext from './modules/menu-context-mgmt/main-menu-context';
import VertexMenuContext from './modules/menu-context-mgmt/vertex-menu-context';
import BoundaryMenuContext from './modules/menu-context-mgmt/boundary-menu-context';
import VertexMgmt from './modules/object-mgmt/vertex-mgmt';
import BoundaryMgmt from './modules/object-mgmt/boundary-mgmt';
import FileMgmt from './modules/file-mgmt/file-mgmt';
import EdgeMgmt from './modules/object-mgmt/edge-mgmt';
import EdgeMenuContext from './modules/menu-context-mgmt/edge-menu-context';
import ObjectUtils from  './common/utilities/object.ult';
import MenuItemsBoundary from './modules/menu-context-mgmt/menu-items-boundary';
import {comShowMessage} from './common/utilities/common.ult';

import * as d3 from 'd3';
import {
  HTML_ALGETA_CONTAINER_CLASS,
  HTML_ALGETA_CONTAINER_ID,
  HTML_VERTEX_CONTAINER_CLASS,
  HTML_BOUNDARY_CONTAINER_CLASS,
  HTML_EDGE_CLASS,
  GRAPH_WIDTH,
  GRAPH_HEIGHT,
} from './const/index';
import './styles/index.scss';

// const vertexTypes = {
//   "Grunt": {
//     "name":"Grunt",
//     "hp": 500,
//     "atk": "M20",
//     "def": "H2",
//     "spd": 1
//   },
//   "Troll": {
//     "date":"Troll",
//     "day": 300,
//     "hour": "P30",
//     "min": "L0",
//     "sec": 1.1
//   }
// };

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

d3.selection.prototype.moveToBack = function() {
  this.each(function() {
    this.parentNode.firstChild && this.parentNode.insertBefore(this, this.parentNode.firstChild);
  });
};

class Starter {
  constructor() {
    this.dataContainer = {
      vertex: [],
      boundary: [],
      edge: [],
      vertexTypes: {},
    };
    this.initialize();
  }

  initialize(){
    //Create SVG element
    this.svgSelector = d3.select(`#${HTML_ALGETA_CONTAINER_ID}`)
      .append("svg")
      .attr("class","svg")
      .attr("height", GRAPH_HEIGHT)
      .attr("width", GRAPH_WIDTH);

    this.initMarkerArrow();

    /**
     * Init file mgmt
     */
    new FileMgmt({
      mainMgmt: this,
      dataContainer: this.dataContainer
    });

    /**
     * Init object ultils
     */
    this.objectUtils = new ObjectUtils({
      svgSelector : this.svgSelector,
      dataContainer: this.dataContainer
    });

    this.initObjectsMgmt();
  }

  /**
   * Init object mgmt: vertex, edge, boundary
   */
  initObjectsMgmt() {
    /**
     * Init boundary mgmt
     */
    this.boundaryMgmt = new BoundaryMgmt({
      svgSelector : this.svgSelector,
      dataContainer: this.dataContainer,
      objectUtils: this.objectUtils
    });

    /**
     * Init edge mgmt
     */
    this.edgeMgmt = new EdgeMgmt({
      svgSelector : this.svgSelector,
      dataContainer: this.dataContainer,
      objectUtils: this.objectUtils
    });

    /**
     * Init Vertex Mgmt
     * @type {VertexMgmt}
     */
    this.vertextMgmt = new VertexMgmt({
      svgSelector : this.svgSelector,
      dataContainer: this.dataContainer,
      edgeMgmt: this.edgeMgmt,
      objectUtils: this.objectUtils
    });
  }

  /**
   * Reload data vertex types when user import
   * For main context and vertex.
   * @param data
   */
  async reloadVertexTypes(data){
    // Set global vertex types
    window.vertexTypes = data;
    // Validate vertex type
    let isMisMatch = await this.validateVertexTypesInGraph();
    // Now just show message warning for user. Not stop working
    if(isMisMatch)
      comShowMessage("Vertex type in Vertex Type Definition and Data Graph Structure is mismatch. Please check again!");

    this.initContextMenuForObject();
    // window.disabledCommand = false;
  }

  /**
   * Draw graph with data import by user
   * @param data
   */
  async drawGraphFromData(data){
    this.clearAll();
    // Store vertex types
    window.vertexTypesTmp = data.vertexTypes;

    // Validate content
    let errorContent = await this.validateGraphDataStructure(data);
    if(errorContent) {
      comShowMessage("Data Graph Structure wrong format or invalid content!");
      return;
    }

    // Validate vertex type
    let isMisMatch = await this.validateVertexTypesInGraph();
    // Now just show message warning for user. Not stop working
    if(isMisMatch)
      comShowMessage("Vertex type in Vertex Type Definition and Data Graph Structure is mismatch. Please check again!");

    // Draw vertex
    let arrVertex = data.vertex;
    arrVertex.forEach(vertex => {
      this.vertextMgmt.create(vertex);
    });

    // Draw edge
    let arrEdge = data.edge;
    arrEdge.forEach(edge => {
      this.edgeMgmt.create(edge);
    });

    // Draw boundary
    for (let opt of Object.keys(data.boundary)) {
      // this.boundaryMgmt.create(Object.assign(data.boundary[opt], data.coordinate[opt]));
    }

    this.initContextMenuForObject();
    // $.contextMenu('update');
  }

  /**
   * Init Marker Arrow use for edge
   */
  initMarkerArrow(){
    this.svgSelector.append("svg:defs").append("svg:marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 10)
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 z")
      .style("stroke", "black");
  }

  /**
   * Init context menu on object
   * When read file vertex type
   * And when read file graph data
   */
  initContextMenuForObject() {
    this.removeAllDomConentMenu();

    /**
     * Init edge menu context
     */
    this.edgeMenuContext = new EdgeMenuContext({
      selector: `.${HTML_EDGE_CLASS}`,
      dataContainer: this.dataContainer,
      edgeMgmt: this.edgeMgmt
    });



    /**
     * Init Vertex Menu Context
     * @type {VertexMenuContext}
     */
    this.vertexMenuContext = new VertexMenuContext({
      selector: `.${HTML_VERTEX_CONTAINER_CLASS}`,
      dataContainer: this.dataContainer,
      vertexMgmt: this.vertextMgmt
    });


    /**
     * Init Boundary Menu Context
     * @type {BoundaryMenuContext}
     */
    this.boundaryMenuContext = new BoundaryMenuContext({
      selector: `.${HTML_BOUNDARY_CONTAINER_CLASS}`,
      dataContainer: this.dataContainer,
      boundaryMgmt: this.boundaryMgmt
    });

    /**
     * Init Main Menu Context
     * @type {MainMenuContext}
     */
    this.mainMenuContext = new MainMenuContext({
      selector: `.${HTML_ALGETA_CONTAINER_CLASS}`,
      dataContainer: this.dataContainer,
      vertexMgmt: this.vertextMgmt,
      boundaryMgmt: this.boundaryMgmt,
      mainMgmt: this
    });

    // this.menuItemsBoundary = new MenuItemsBoundary();
  }

  /**
   * Clear all element on graph
   * And reinit marker def
   */
  clearAll(){
    // Delete all element inside SVG
    d3.select("svg").selectAll("*").remove();

    // Clear all data cotainer for vertex, boundary, edge
    this.dataContainer.vertex = [];
    this.dataContainer.boundary = [];
    this.dataContainer.edge = [];

    this.initMarkerArrow();
  }

  removeAllDomConentMenu() {
    d3.selectAll(".context-menu-list").remove();
  }

  /**
   * Validate Vertices in Graph Data
   * Structure using Vertex Type Definition
   */
  async validateVertexTypesInGraph() {
    let isMisMatch = false;
    if(!window.vertexTypes || !window.vertexTypesTmp)
    {
      console.log("Targe or soruce is null");
      return Promise.resolve(false);
    }

    // Compare length
    let vertexUse = Object.keys(window.vertexTypes);
    let vertexTmp = Object.keys(window.vertexTypesTmp);
    if(this.checkLengthMisMatch(vertexUse, vertexTmp))
    {
      console.log("Length is different");
      return Promise.resolve(true);
    }

    // Check key exit
    let flag = await this.checkKeyMisMatch(vertexUse, vertexTmp);

    if(flag){
      console.log("Key vertex at source not exit in target");
      return Promise.resolve(true);
    }

    // Check data key in every vertex type
    for (let key of vertexUse) {
      let src = Object.keys(window.vertexTypes[key]);
      let tgt = Object.keys(window.vertexTypesTmp[key]);
      if(this.checkLengthMisMatch(src, tgt))
      {
        console.log("Length of vertex element is different");
        return Promise.resolve(true);
      }

      let misMatchKey = await this.checkKeyMisMatch(src, tgt);
      if(misMatchKey) {
        console.log("Key of vertex element is different");
        return Promise.resolve(true);
      }
    }
    return Promise.resolve(isMisMatch);
  }

  /**
   * Check length of source and target is match
   * @param src
   * @param tgt
   * @returns {boolean}
   */
  checkLengthMisMatch(src, tgt) {
    return src.length != tgt.length ? true : false;
  }

  /**
   * Check key of source and target is match
   * @param src
   * @param tgt
   * @returns {boolean}
   */
  checkKeyMisMatch(src, tgt) {
    let misMatch = false;
    src.forEach(key => {
      if(tgt.indexOf(key) < 0)
      {
        misMatch = true;
      }
    });

    return Promise.resolve(misMatch);
  }

  /**
   * Validate Graph Data Structure
   * Validate content
   */
  validateGraphDataStructure(data) {
    if(!data.vertex || !data.edge || !data.boundary || !data.vertexTypes) {
      return Promise.resolve(true);
    }
  }
}

export default new Starter();
