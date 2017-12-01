import MainMenuContext from './modules/menu-context-mgmt/main-menu-context';
import VertexMenuContext from './modules/menu-context-mgmt/vertex-menu-context';
import VertexMgmt from './modules/object-mgmt/vertex-mgmt';
import BoundaryMgmt from './modules/object-mgmt/boundary-mgmt';
import * as d3 from 'd3';
import {
  HTML_ALGETA_CONTAINER_CLASS,
  HTML_ALGETA_CONTAINER_ID,
  HTML_VERTEX_CONTAINER_CLASS,
  GRAPH_WIDTH,
  GRAPH_HEIGHT,
} from './const/index';
import './styles/index.scss';

let nodesData = {
  vertex: [],
  boundary: [],
  edge: []
};

let vertexTypes = {
  "Grunt": {
    "hp": 500,
    "atk": "M20",
    "def": "H2",
    "spd": 1
  },
  "Troll": {
    "hp": 300,
    "atk": "P30",
    "def": "L0",
    "spd": 1.1
  }
};

class Starter {
  constructor() {

    this.initialize();
  }

  initialize(){
    //Create SVG element
    const svg = d3.select(`#${HTML_ALGETA_CONTAINER_ID}`)
      .append("svg")
      .attr("class","svg")
      .attr("height", GRAPH_HEIGHT)
      .attr("width", GRAPH_WIDTH)

    this.vertextMgmt = new VertexMgmt({
      svgSelector : svg,
      dataContainer: nodesData,
      vertexTypes: vertexTypes
    });

    this.boundaryMgmt = new BoundaryMgmt({
      svgSelector : svg,
      dataContainer: nodesData
    });

    this.mainMenuContext = new MainMenuContext({
      selector: `.${HTML_ALGETA_CONTAINER_CLASS}`,
      dataContainer: nodesData,
      vertexMgmt: this.vertextMgmt,
      boundaryMgmt: this.boundaryMgmt,
      vertexTypes: vertexTypes
    });

    this.vertexMenuContext = new VertexMenuContext({
      selector: `.${HTML_VERTEX_CONTAINER_CLASS}`,
      dataContainer: nodesData,
      vertexMgmt: this.vertextMgmt,
      boundaryMgmt: this.boundaryMgmt
    });
  }
}

export default new Starter();
