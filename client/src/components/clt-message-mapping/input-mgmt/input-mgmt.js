import MainMenu from '../../common-objects/menu-context/main-menu';
import VertexMgmt from '../../common-objects/objects/vertex-mgmt';
import BoundaryMgmt from '../../common-objects/objects/boundary-mgmt';
import ObjectUtils from '../../../common/utilities/object.ult';

import {
  CONNECT_SIDE,
  DEFAULT_CONFIG_GRAPH,
  VIEW_MODE,
} from '../../../common/const/index';

import { setSizeGraph } from '../../../common/utilities/common.ult';

class InputMgmt {
  constructor(props) {
    this.edgeMgmt = props.edgeMgmt;
    this.dataContainer = props.dataContainer;
    this.vertexDefinition = props.vertexDefinition;
    this.containerId = props.containerId;
    this.svgId = props.svgId;
    this.isShowReduced = false;
    this.viewMode = VIEW_MODE.SHOW_ONLY;

    this.initialize();
  }

  initialize() {

    this.objectUtils = new ObjectUtils();

    this.defaultOptionsVertex = {
      connectSide: CONNECT_SIDE.RIGHT,
    };

    this.vertexMgmt = new VertexMgmt({
      dataContainer : this.dataContainer,
      containerId : this.containerId,
      svgId : this.svgId,
      vertexDefinition : this.vertexDefinition,
      viewMode: this.viewMode,
      edgeMgmt : this.edgeMgmt
    });

    this.boundaryMgmt = new BoundaryMgmt({
      dataContainer: this.dataContainer,
      containerId: this.containerId,
      svgId: this.svgId,
      viewMode: this.viewMode,
      vertexMgmt: this.vertexMgmt
    });
  }

  initMenuContext() {
    new MainMenu({
      selector: `#${this.svgId}`,
      containerId: `#${this.containerId}`,
      parent: this,
      vertexDefinition: this.vertexDefinition,
      viewMode: this.viewMode
    });
  }

  async drawObjectsOnInputGraph(data) {
    this.isShowReduced = false;
    
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
      e.connectSide = this.defaultOptionsVertex.connectSide;
      e.isImport = true;
      
      this.vertexMgmt.create(e);
    });

    if (this.dataContainer.boundary && this.dataContainer.boundary.length > 0){
      this.objectUtils.setAllChildrenToShow(this.dataContainer);
      if (this.dataContainer.boundary.length > 0)
        await this.dataContainer.boundary[0].updateHeightBoundary();
    }
  }

  clearAll() {
    this.vertexMgmt.clearAll();
    this.boundaryMgmt.clearAll();

    setSizeGraph({ height: DEFAULT_CONFIG_GRAPH.MIN_HEIGHT }, this.svgId);
  }

  showReduced(){
    this.isShowReduced = true;
    this.objectUtils.showReduced(this.dataContainer, this.edgeMgmt.dataContainer, this.vertexDefinition.groupVertexOption, this.svgId);
  }

  showFull(){
    this.isShowReduced = false;
    this.objectUtils.showFull(this.dataContainer, this.edgeMgmt.dataContainer, this.vertexDefinition.groupVertexOption, this.svgId);
  }
}

export default InputMgmt;
