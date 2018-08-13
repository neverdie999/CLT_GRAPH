import MainMenu from '../../objects-mgmt/menu-context/main-menu';
import VertexMgmt from '../../objects-mgmt/objects/vertex-mgmt';
import BoundaryMgmt from '../../objects-mgmt/objects/boundary-mgmt';
import ObjectUtils from '../../../common/utilities/object.ult';

import {
  CONNECT_SIDE,
  DEFAULT_CONFIG_GRAPH,
} from '../../../const/index';

import { setSizeGraph } from '../../../common/utilities/common.ult';


class OutputMgmt {
  constructor(props) {
    this.edgeMgmt = props.edgeMgmt;
    this.dataContainer = props.dataContainer;
    this.vertexDefinition = props.vertexDefinition;
    this.containerId = props.containerId;
    this.svgId = props.svgId;
    this.isShowReduced = false;
    
    this.initialize();
  }

  initialize() {

    this.objectUtils = new ObjectUtils();

    this.defaultOptionsVertex = {
      connectSide: CONNECT_SIDE.LEFT,
    };

    this.vertexMgmt = new VertexMgmt({
      dataContainer : this.dataContainer,
      containerId : this.containerId,
      svgId : this.svgId,
      vertexDefinition : this.vertexDefinition,
      isEnableEdit: false,
      edgeMgmt : this.edgeMgmt
    });

    this.boundaryMgmt = new BoundaryMgmt({
      dataContainer: this.dataContainer,
      containerId: this.containerId,
      svgId: this.svgId,
      isEnableEdit: false,
      vertexMgmt: this.vertexMgmt
    });
  }

  initMenuContext() {
    new MainMenu({
      selector: `#${this.svgId}`,
      containerId: `#${this.containerId}`,
      parent: this,
      vertexDefinition: this.vertexDefinition,
      isEnableEdit: false
    });
  }

  async drawObjectsOnOutputGraph(data) {
    this.isShowReduced = false;
    
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

    if (this.dataContainer.boundary && this.dataContainer.boundary.length > 0) {
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

export default OutputMgmt;
