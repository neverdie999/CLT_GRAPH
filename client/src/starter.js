import MainMenuContext from './modules/menu-context-mgmt/main-menu-context';
import VertexMenuContext from './modules/menu-context-mgmt/vertex-menu-context';
import VertexMgmt from './modules/object-mgmt/vertex-mgmt';
import BoundaryMgmt from './modules/object-mgmt/boundary-mgmt';
import FileMgmt from './modules/file-mgmt/file-mgmt';
import EdgeMgmt from './modules/object-mgmt/edge-mgmt';
import EdgeMenuContext from './modules/menu-context-mgmt/edge-menu-context';

import * as d3 from 'd3';
import {
  HTML_ALGETA_CONTAINER_CLASS,
  HTML_ALGETA_CONTAINER_ID,
  HTML_VERTEX_CONTAINER_CLASS,
  HTML_EDGE_CLASS,
  GRAPH_WIDTH,
  GRAPH_HEIGHT,
} from './const/index';
import './styles/index.scss';

const nodesData = {
  vertex: [],
  boundary: [],
  edge: []
};

window.creatingEdge = false;
window.removingEdge = false;
window.criterionNode = null;

const vertexTypes = {
  "Grunt": {
    "name":"Grunt",
    "hp": 500,
    "atk": "M20",
    "def": "H2",
    "spd": 1
  },
  "Troll": {
    "name":"Troll",
    "hp": 300,
    "atk": "P30",
    "def": "L0",
    "spd": 1.1
  }
};

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

class Starter {
  constructor() {
    this.initialize();
    this.svgSelector = null;
  }

  initialize(){
    //Create SVG element
    this.svgSelector = d3.select(`#${HTML_ALGETA_CONTAINER_ID}`)
      .append("svg")
      .attr("class","svg")
      .attr("height", GRAPH_HEIGHT)
      .attr("width", GRAPH_WIDTH)

    this.initMarkerArrow();

    /**
     * Init file mgmt
     */
    new FileMgmt({
      mainMgmt: this
    });

    /**
     * Init boundary mgmt
     */
    this.boundaryMgmt = new BoundaryMgmt({
      svgSelector : this.svgSelector,
      dataContainer: nodesData
    });

    /**
     * Init edge mgmt
     */
    this.edgeMgmt = new EdgeMgmt({
      svgSelector : this.svgSelector,
      dataContainer: nodesData
    });

    /**
     * Init edge menu context
     */
    this.edgeMenuContext = new EdgeMenuContext({
      selector: `.${HTML_EDGE_CLASS}`,
      dataContainer: nodesData,
      edgeMgmt: this.edgeMgmt
    });

    /**
     * Init vertex mgmt
     */
    this.vertextMgmt = new VertexMgmt({
      svgSelector : this.svgSelector,
      dataContainer: nodesData,
      vertexTypes: vertexTypes,
      edgeMgmt: this.edgeMgmt
    });

    /**
     * Init vertex menu context
     */
    this.vertexMenuContext = new VertexMenuContext({
      selector: `.${HTML_VERTEX_CONTAINER_CLASS}`,
      dataContainer: nodesData,
      vertexMgmt: this.vertextMgmt
    });

    /**
     * Init main menu context
     */
    this.mainMenuContext = new MainMenuContext({
      selector: `.${HTML_ALGETA_CONTAINER_CLASS}`,
      dataContainer: nodesData,
      vertexMgmt: this.vertextMgmt,
      boundaryMgmt: this.boundaryMgmt,
      vertexTypes: vertexTypes
    });
  }

  /**
   * Reload menu Vertex
   */
  reloadMenuVertex(data){
    this.mainMenuContext.vertexTypes = data;
    this.vertextMgmt.vertexTypes = data;
  }

  /**
   * Redraw Graph
   */
  reDrawGraph(data){
    for (let opt of Object.keys(data.vertex)) {
      this.vertextMgmt.create(Object.assign(data.vertex[opt], data.coordinate[opt]));
    }

    for (let opt of Object.keys(data.boundary)) {
      this.boundaryMgmt.create(Object.assign(data.boundary[opt], data.coordinate[opt]));
    }
  }

  initMarkerArrow(){
    // Define arrow use for edge.
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
}

export default new Starter();
