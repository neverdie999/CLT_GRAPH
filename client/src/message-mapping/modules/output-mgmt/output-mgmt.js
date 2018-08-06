
import VertexMgmt from '../objects-mgmt/vertex-mgmt';
import BoundaryMgmt from '../objects-mgmt/boundary-mgmt';
import ObjectUtils from '../../common/utilities/object.ult';

import {
  ID_SVG_OUTPUT_MESSAGE,
  CONNECT_SIDE,
  ID_CONTAINER_OUTPUT_MESSAGE,
  DEFAULT_CONFIG_GRAPH,
} from '../../const/index';

import { setSizeGraph } from '../../common/utilities/common.ult';


class OutputMgmt {
  constructor(props) {
    this.mainMgmt = props.mainMgmt;
    this.edgeMgmt = props.edgeMgmt;
    this.storeOutputMessage = props.storeOutputMessage;
    this.outputDefined = props.outputDefined;
    this.containerId = ID_CONTAINER_OUTPUT_MESSAGE;
    this.svgId = ID_SVG_OUTPUT_MESSAGE;
    
    this.initialize();
  }

  initialize() {

    this.objectUtils = new ObjectUtils();

    this.defaultOptionsVertex = {
      connectSide: CONNECT_SIDE.LEFT,
    };

    this.vertexMgmt = new VertexMgmt({
      dataContainer : this.storeOutputMessage,
      containerId : this.containerId,
      svgId : this.svgId,
      vertexDefinition : this.outputDefined,
      isEnableEdit: false,
      edgeMgmt : this.edgeMgmt
    });

    this.boundaryMgmt = new BoundaryMgmt({
      dataContainer: this.storeOutputMessage,
      containerId: this.containerId,
      svgId: this.svgId,
      isEnableEdit: false,
      vertexMgmt: this.vertexMgmt
    });
  }

  async drawObjectsOnOutputGraph(data) {
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

    if (this.storeOutputMessage.boundary && this.storeOutputMessage.boundary.length > 0) {
      this.objectUtils.setAllChildrenToShow(this.storeOutputMessage);
      if (this.storeOutputMessage.boundary.length > 0)
        await this.storeOutputMessage.boundary[0].updateHeightBoundary();
    }
  }

  clearAll() {
    this.vertexMgmt.clearAll();
    this.boundaryMgmt.clearAll();

    setSizeGraph({ height: DEFAULT_CONFIG_GRAPH.MIN_HEIGHT }, this.svgId);
  }
}

export default OutputMgmt;
