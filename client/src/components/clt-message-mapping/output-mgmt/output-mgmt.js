import MainMenu from '../../common-objects/menu-context/main-menu';
import VertexMgmt from '../../common-objects/objects/vertex-mgmt';
import BoundaryMgmt from '../../common-objects/objects/boundary-mgmt';
import ObjectUtils from '../../../common/utilities/object.ult';

import {
  CONNECT_SIDE,
  DEFAULT_CONFIG_GRAPH,
  VIEW_MODE,
	DATA_ELEMENT_TYPE,
} from '../../../common/const/index';

import { setSizeGraph } from '../../../common/utilities/common.ult';

const CONNECT_KEY = 'Connected';

class OutputMgmt {
  constructor(props) {
    this.edgeMgmt = props.edgeMgmt;
    this.dataContainer = props.dataContainer;
    this.containerId = props.containerId;
    this.svgId = props.svgId;
    this.isShowReduced = false;
    this.viewMode = {value: VIEW_MODE.OUTPUT_MESSAGE};
    
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
      viewMode: this.viewMode,
      connectSide: CONNECT_SIDE.LEFT,
      edgeMgmt : this.edgeMgmt
    });

    this.boundaryMgmt = new BoundaryMgmt({
      dataContainer: this.dataContainer,
      containerId: this.containerId,
      svgId: this.svgId,
      viewMode: this.viewMode,
      vertexMgmt: this.vertexMgmt,
      edgeMgmt: this.edgeMgmt
    });
  }

  initMenuContext() {
    new MainMenu({
      selector: `#${this.svgId}`,
      containerId: `#${this.containerId}`,
      parent: this,
      vertexDefinition: this.vertexMgmt.vertexDefinition,
      viewMode: this.viewMode,
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
      e.isImport = true;

      this.vertexMgmt.create(e);
    });

    if (this.dataContainer.boundary && this.dataContainer.boundary.length > 0) {
      this.objectUtils.setAllChildrenToShow(this.dataContainer);
      if (this.dataContainer.boundary.length > 0)
        await this.dataContainer.boundary[0].updateHeightBoundary();
    }

    this.setCenterAlignmentGarph();
  }

  clearAll() {
    this.vertexMgmt.clearAll();
    this.boundaryMgmt.clearAll();

    setSizeGraph({ height: DEFAULT_CONFIG_GRAPH.MIN_HEIGHT }, this.svgId);
  }

  showReduced(){
    this.isShowReduced = true;
    this.objectUtils.showReduced(this.dataContainer, this.edgeMgmt.dataContainer, this.vertexMgmt.vertexDefinition, this.svgId);
  }

  showFull(){
    this.isShowReduced = false;
    this.objectUtils.showFull(this.dataContainer, this.vertexMgmt.vertexDefinition, this.svgId);
  }

  /**
   * set position graph by center align
   */
  setCenterAlignmentGarph(){
    const parentBoundary = _.find(this.dataContainer.boundary, {"parent": null});

    const rightScrollWidth = 10;
    const marginTop = 10;
    const marginLeft = 5;
    const marginRight = 5;

    let newX = marginLeft;
    let newY = marginTop;

    if (parentBoundary){

      $('.right-svg').css('left', `calc(100% - ${parentBoundary.width + rightScrollWidth + marginLeft + marginRight}px)`);
      $('.right-svg').css('width', `${parentBoundary.width + rightScrollWidth + marginLeft + marginRight}px`);

      const inputRec = $('.left-svg')[0].getBoundingClientRect();
      const outputRec = $('.right-svg')[0].getBoundingClientRect();
      $('.middle-svg').css('width', `calc(100% - ${inputRec.width + outputRec.width}px)`);

      const containerRect  = $(`#${parentBoundary.svgId}`)[0].parentNode.getBoundingClientRect();

      if ( containerRect.width - rightScrollWidth  - marginLeft - marginRight >= parentBoundary.width ){
        newX = newX + ((containerRect.width - rightScrollWidth  - marginLeft - marginRight - parentBoundary.width) / 2)
      }

      const offsetX = newX - parentBoundary.x;
      const offsetY = newY - parentBoundary.y;

      if (offsetX != 0 || offsetY != 0){
        parentBoundary.move(offsetX, offsetY);
      }
    }
  }

  processDataVertexTypeDefine(vertexDefinitionData){
    this.vertexMgmt.processDataVertexTypeDefine(vertexDefinitionData);
	}
	
	/**
	 * 
	 */
	validateConnectionByUsage() {
		let bFlag = true;

		$(`#${this.svgId} .property`).css('background-color', '');

		if (this.dataContainer.boundary.length > 0) {
			let parent = this.dataContainer.boundary[0].findAncestorOfMemberInNestedBoundary();
			for (let i = 0; i < parent.member.length; i++) {
				let mem = parent.member[i];
				if (!this.doValidateConnectionByUsage(mem, parent) && bFlag)  bFlag = false;
			}
		} else {

		}

		return bFlag;
	}

	/**
	 * 
	 * @param {*} mem 
	 * @param {*} parent 
	 */
	doValidateConnectionByUsage(mem, parent) {
		let bFlag = true;
		let obj = null;
		if (mem.type == "V") {
			obj = _.find(this.dataContainer.vertex, {"id": mem.id})
			if (obj) {
				let dataElement = _.cloneDeep(obj.data);
				this.getConnectionStatus(obj.id, dataElement);

				for (let i = 0; i < dataElement.length; i++) {
					if ( ((dataElement[i].usage && dataElement[i].usage == "M") || (dataElement[i].mandatory))
							&& (dataElement[i].type && dataElement[i].type != DATA_ELEMENT_TYPE.COMPOSITE)
							&& !dataElement[i].hasConnection) {
						if (parent.mandatory && obj.mandatory) {
							// GRP[M] - SGM[M] - DE[M]
							if (bFlag) bFlag = false;
							$(`#${obj.id} .property[prop='${obj.id}${CONNECT_KEY}${i}']`).css('background-color', '#ff8100');

						} else if (this.hasAnyConnectionOfOtherDataElement(dataElement, i)){
							// GRP[M] - SGM[C] - DE[M]
							// GRP[C] - SGM[M] - DE[M]
							// GRP[C] - SGM[C] - DE[M]
							if (bFlag) bFlag = false;
							$(`#${obj.id} .property[prop='${obj.id}${CONNECT_KEY}${i}']`).css('background-color', '#ff8100');
						}
					}
				}
			}
		} else {
			obj = _.find(this.dataContainer.boundary, {"id": mem.id})
			obj.member.forEach(item => {
				if (!this.doValidateConnectionByUsage(item, obj) && bFlag) {
					bFlag = false;
				}
			})
		}

		return bFlag;
	}

	/**
	 * 
	 * @param {*} vertexId 
	 * @param {*} indexOfDataElement 
	 */
	haveConnectionToDataElement(vertexId, indexOfDataElement) {
		for (let i = 0; i < this.storeConnect.edge.length; i++) {
			let edge = this.storeConnect.edge[i];
			if (parseInt(edge.target.prop.replace(`${vertexId}${CONNECT_KEY}`, '')) == indexOfDataElement) {
				return true;
			}
		}

		return false;
	}

	/**
	 * 
	 * @param {*} vertexId 
	 * @param {*} dataElement 
	 */
	getConnectionStatus(vertexId, dataElement) {
		for (let i = 0; i < this.edgeMgmt.dataContainer.edge.length; i++) {
			let edge = this.edgeMgmt.dataContainer.edge[i];
			for (let indexOfDataElement = 0; indexOfDataElement < dataElement.length; indexOfDataElement++) {
				if (parseInt(edge.target.prop.replace(`${vertexId}${CONNECT_KEY}`, '')) == indexOfDataElement) {
					dataElement[indexOfDataElement].hasConnection = true;
				}
			}
		}
	}

	/**
	 * 
	 * @param {*} dataElement 
	 * @param {*} idxCurDataElement 
	 */
	hasAnyConnectionOfOtherDataElement(dataElement, idxCurDataElement) {
		for (let i = 0; i < dataElement.length; i++) {
			if (i != idxCurDataElement && dataElement[i].hasConnection) return true;
		}

		return false;
	}
}

export default OutputMgmt;
