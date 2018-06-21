import * as d3 from 'd3';
import _ from "lodash";
import {
  COMMON_DATA,
} from '../../const/index';

class ObjectUtils {
  constructor(props) {
    this.dataContainer = props.dataContainer;
  }

  /**
   * Get BBox of object by id
   * @param objectId
   * @returns {*}
   */
  getBBoxObject(objectId) {
    return d3.select(`#${objectId}`).node().getBBox();
  }

  /* Vertex utils (S)*/
  /**
   * Get vertex info by id
   * @param vertexId
   * @returns {*}
   */
  getVertexInfoById(vertexId) {
    return _.find(this.dataContainer.vertex, (e) => {
      return e.id === vertexId;
    });
  }

  /* Vertex utils (S)*/
  /**
   * Get vertex info by id from array
   * @param vertexId
   * @returns {*}
   */
  getVertexInfoByIdFromArray(vertexId, arrVertex) {
    return _.find(arrVertex, (e) => {
      return e.id === vertexId;
    });
  }

  /**
   * Find all path (edge, connect) with source from this vertex
   * @param vertexId: string, required
   */
  findEdgeStartFromVertex(vertexId) {
    if (!vertexId)
      return [];

    return _.filter(this.dataContainer.edge, (e) => {
        return e.source.vertexId === vertexId;
      }
    );
  }

  /**
   * get root parent of Boundary
   */

  getRootParent(obj, arr, count = 0) {
    let {parent} = this.getBoundaryInfoByIdFromArray(obj, arr);
    if (parent != null) {
      count++;
      return this.getRootParent(parent, arr, count);
    }
    return {parent: obj, count: count};
  }

  /**
   * Find all path (edge, connect) with target at this vertex
   * @param vertexId: string, required
   */
  findEdgeConnectToVertex(vertexId) {
    if (!vertexId)
      return [];

    return _.filter(this.dataContainer.edge, (e) => {
        return e.target.vertexId === vertexId;
      }
    );
  }

  /**
   * Get index of object from drop position
   * @param boundaryId boundaryId tagert drop
   * @param srcInfos Object drap
   * Function using get index for insert to boundary
   */
  getIndexFromPositionForObject(boundaryId, srcInfos) {
    let {member} = this.getBoundaryInfoById(boundaryId);
    let xSrc = srcInfos.x;
    let ySrc = srcInfos.y;
    let index = 0;
    let memberAvailable = _.filter(member, (e) => {
      return e.show === true
    });
    for (let mem of memberAvailable) {
      let {x, y} = this.getLocationForObject(mem);
      if (y > ySrc) {
        break;
      }
      if (mem.id === srcInfos.id) continue;
      index++;
    }
    return index;
  }

  /**
   * Get current location of object
   */
  getLocationForObject(member) {
    if (member.type === "B") {
      return this.getBoundaryInfoById(member.id);
    }
    else {
      return this.getVertexInfoById(member.id);
    }
  }

  /**
   * Clone vertex info by id
   * @param vertexId
   */
  cloneVertexInfo(vertexId) {
    // Clone and return
    // const obj = this.getVertexInfoById(vertexId);
    // return Object.assign({}, obj);
    return _.cloneDeep(this.getVertexInfoById(vertexId));
  }

  /**
   * Find all path (edge, connect) start or end at this vertex
   * @param vertexId
   * @returns {Array}
   */
  findEdgeRelateToVertex(vertexId) {
    if (!vertexId)
      return [];

    return _.filter(this.dataContainer.edge, (e) => {
        return e.target.vertexId === vertexId || e.source.vertexId === vertexId;
      }
    );
  }

  checkExitEdgeConnectToVertex(vertexId) {
    let numEdges = this.findEdgeRelateToVertex(vertexId);
    if (numEdges.length)
      return true;
    else
      return false;
  }


  getDataDefineByOption(options) {
    return _.find(COMMON_DATA.vertexTypes, options);
  }

  /* Vertex utils (E)*/

  /* Edge utils (S)*/
  /**
   * Get edge info by id
   * @param edgeId
   * @returns {*}
   */
  getEdgeInfoById(edgeId) {
    return _.find(this.dataContainer.edge, (e) => {
      return e.id === edgeId;
    });
  }

  /* Edge utils (E)*/

  /* Boundary utils (S)*/
  /**
   * Get boundary info by id
   * @param boundaryId
   * @returns {*}
   */
  getBoundaryInfoById(boundaryId) {
    return _.find(this.dataContainer.boundary, (e) => {
      return e.id === boundaryId;
    });
  }

/**
 * Get boundary info by if from array
 * @param {*} boundaryId
 * @param {*} arrBoundary
 */
  getBoundaryInfoByIdFromArray(boundaryId,arrBoundary) {
    return _.find(arrBoundary, (e) => {
      return e.id === boundaryId;
    });
  }

  /**
   * Get boundary info by if from array
   * @param {*} boundaryId
   * @param {*} arrBoundary
   */
  getBoundaryInfoByIdFromArray(boundaryId, arrBoundary) {
    return _.find(arrBoundary, (e) => {
      return e.id === boundaryId;
    });
  }

  /**
   * Clone boundary info by id
   * @param boundaryId
   */
  cloneBoundaryInfo(boundaryId) {
    const obj = this.getBoundaryInfoById(boundaryId);
    // Clone and return
    return Object.assign({}, obj);
  }

  /**
   * Update status for child boundary
   * child match with childId
   * @param boundaryId
   * @param childId
   * @param status
   */
  setBoundaryMemberStatus(boundaryId, childId, status) {
    const {member} = this.getBoundaryInfoById(boundaryId);
    let select = _.find(member, (e) => {
      return e.id === childId;
    });
    if (select) {
      select.show = status;
    }
  }

  /* Boundary utils (E)*/
}

export default ObjectUtils;
