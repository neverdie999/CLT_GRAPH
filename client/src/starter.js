import MainMenuContext from './modules/menu-context-mgmt/main-menu-context';
import VertexMgmt from './modules/object-mgmt/vertex-mgmt';
import BoundaryMgmt from './modules/object-mgmt/boundary-mgmt';
import * as d3 from 'd3';
import {
  HTML_ALGETA_CONTAINER_ID,
  GRAPH_WIDTH,
  GRAPH_HEIGHT,
} from './const/index';
let nodesData = {
  vertex: [],
  boundary: [],
  edge: []
};

class Starter {
  constructor() {

    this.initialize();
  }

  initialize(){
    const svg = d3.select(`#${HTML_ALGETA_CONTAINER_ID}`)
      .append("svg")
      .attr("class","svg")
      .attr("height", GRAPH_HEIGHT)
      .attr("width", GRAPH_WIDTH)

    this.vertextMgmt = new VertexMgmt({
      svgSelector : svg,
      dataContainer: nodesData
    });

    this.boundaryMgmt = new BoundaryMgmt({
      svgSelector : svg,
      dataContainer: nodesData
    });

    this.mainMenuContext = new MainMenuContext({
      selector: `.${HTML_ALGETA_CONTAINER_ID}`,
      dataContainer: nodesData,
      vertexMgmt: this.vertextMgmt,
      boundaryMgmt: this.boundaryMgmt
    });
  }
}

export default new Starter();
