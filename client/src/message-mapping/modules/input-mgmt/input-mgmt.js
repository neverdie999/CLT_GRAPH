import VertexMgmt from '../objects-mgmt/vertex-mgmt';
import BoundaryMgmt from '../objects-mgmt/boundary-mgmt';
import ObjectUtils from '../../common/utilities/object.ult';

import {
  ID_SVG_INPUT_MESSAGE,
  CONNECT_SIDE,
  ID_CONTAINER_INPUT_MESSAGE,
  DEFAULT_CONFIG_GRAPH,
} from '../../const/index';

import { setSizeGraph } from '../../common/utilities/common.ult';

class InputMgmt {
  constructor(props) {
    this.mainMgmt = props.mainMgmt;
    this.edgeMgmt = props.edgeMgmt;
    this.storeInputMessage = props.storeInputMessage;
    this.inputDefined = props.inputDefined;
    this.containerId = ID_CONTAINER_INPUT_MESSAGE;
    this.svgId = ID_SVG_INPUT_MESSAGE;

    this.initialize();
  }

  initialize() {

    this.objectUtils = new ObjectUtils();

    this.defaultOptionsVertex = {
      connectSide: CONNECT_SIDE.RIGHT,
    };

    this.vertexMgmt = new VertexMgmt({
      dataContainer : this.storeInputMessage,
      containerId : this.containerId,
      svgId : this.svgId,
      vertexDefinition : this.inputDefined,
      isEnableEdit: false,
      edgeMgmt : this.edgeMgmt
    });

    this.boundaryMgmt = new BoundaryMgmt({
      dataContainer: this.storeInputMessage,
      containerId: this.containerId,
      svgId: this.svgId,
      isEnableEdit: false,
      vertexMgmt: this.vertexMgmt
    });
  }

  async drawObjectsOnInputGraph(data) {
    const { boundary: boundaries, vertex: vertices, position } = data;
    // Draw boundary
    boundaries.forEach(e => {
      let { x, y } = position.find(pos => {
        return pos.id === e.id;
      });

      e.x = x;
      e.y = y;
      e.isEnableDrag = false;
      e.isEnableItemVisibleMenu = false;
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
      e.connectSide = this.defaultOptionsVertex.connectSide;
      e.isEnableDrag = false;
      e.isImport = true;
      
      this.vertexMgmt.create(e);
    });

    if (this.storeInputMessage.boundary && this.storeInputMessage.boundary.length > 0){
      this.objectUtils.setAllChildrenToShow(this.storeInputMessage);
      if (this.storeInputMessage.boundary.length > 0)
        await this.storeInputMessage.boundary[0].updateHeightBoundary();
    }
  }

  clearAll() {
    this.vertexMgmt.clearAll();
    this.boundaryMgmt.clearAll();

    setSizeGraph({ height: DEFAULT_CONFIG_GRAPH.MIN_HEIGHT }, this.svgId);
  }
}

export default InputMgmt;
