import MainMenu from './menu-context/main-menu';
import VertexMgmt from '../objects-mgmt/vertex-mgmt';
import BoundaryMgmt from '../objects-mgmt/boundary-mgmt';
import ObjectUtils from '../../common/utilities/object.ult';

import {
  ID_CONTAINER_OPERATIONS,
  ID_SVG_OPERATIONS,
  DEFAULT_CONFIG_GRAPH

} from '../../const/index';

import {
  setSizeGraph
} from '../../common/utilities/common.ult';

class OperationsMgmt {
  constructor(props) {
    this.mainMgmt = props.mainMgmt;
    this.edgeMgmt = props.edgeMgmt;
    this.storeOperations = props.storeOperations;
    this.objectUtils = props.objectUtils;
    this.operationsDefined = props.operationsDefined;
    this.svgId = ID_SVG_OPERATIONS;
    this.containerId = ID_CONTAINER_OPERATIONS;

    this.initialize();
  }

  initialize() {

    this.objectUtils = new ObjectUtils();

    this.vertexMgmt = new VertexMgmt({
      dataContainer : this.storeOperations,
      containerId : this.containerId,
      svgId : this.svgId,
      vertexDefinition : this.operationsDefined,
      isEnableEdit: true,
      edgeMgmt : this.edgeMgmt
    });

    this.boundaryMgmt = new BoundaryMgmt({
      dataContainer: this.storeOperations,
      containerId: ID_CONTAINER_OPERATIONS,
      svgId: ID_SVG_OPERATIONS,
      isEnableEdit: true,
      vertexMgmt: this.vertexMgmt
    });
  }

  initMenuContext() {
    new MainMenu({
      selector: `#${this.svgId}`,
      containerId: `#${this.containerId}`,
      operationsMgmt: this,
      operationsDefined: this.operationsDefined
    });
  }

  createVertex(opt) {
    this.vertexMgmt.create(opt);
  }

  createBoundary(opt) {
    this.boundaryMgmt.create(opt);
  }

  /**
   * Clear all element on graph
   * And reinit marker def
   */
  clearAll() {
    this.vertexMgmt.clearAll();
    this.boundaryMgmt.clearAll();

    setSizeGraph({ height: DEFAULT_CONFIG_GRAPH.MIN_HEIGHT }, this.svgId);
  }

  async drawObjectsOnOperationsGraph(data) {
    const { boundary: boundaries, vertex: vertices, position } = data;
    // Draw boundary
    boundaries.forEach(e => {
      let { x, y } = position.find(pos => {
        return pos.id === e.id;
      });

      e.x = x;
      e.y = y;
      e.isImport = true;
      this.boundaryMgmt.create(e);
    });
    // Draw vertex
    vertices.forEach(e => {
      const { x, y } = position.find(pos => {
        return pos.id === e.id;
      });

      e.x = x;
      e.y = y;
      e.presentation = this.operationsDefined.vertexPresentation[e.groupType];
      e.isImport = true;

      this.vertexMgmt.create(e);
    });

    if (this.storeOperations.boundary && this.storeOperations.boundary.length > 0){
      this.objectUtils.setAllChildrenToShow(this.storeOperations);
      if (this.storeOperations.boundary.length > 0)
        await this.storeOperations.boundary[0].updateHeightBoundary();
    }
  }
}

export default OperationsMgmt;
