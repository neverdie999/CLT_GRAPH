import * as d3 from 'd3';
import _ from "lodash";
import {
  TYPE_POINT,
  VERTEX_ATTR_SIZE,
  BOUNDARY_ATTR_SIZE
} from '../../const/index';

class ObjectUtils {
  constructor(props){
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
    return _.find(this.dataContainer.vertex, (e) => { return e.id === vertexId; });
  }

  /**
   * Find all path (edge, connect) with source from this vertex
   * @param vertexId: string, required
   */
  findEdgeStartFromVertex(vertexId) {
    if(!vertexId)
      return [];

    return _.filter(this.dataContainer.edge, (e) =>
      { return e.source.vertexId === vertexId; }
    );
  }

  /**
   * Find all path (edge, connect) with target at this vertex
   * @param vertexId: string, required
   */
  findEdgeConnectToVertex(vertexId) {
    if(!vertexId)
      return [];

    return _.filter(this.dataContainer.edge, (e) =>
      { return e.target.vertexId === vertexId; }
    );
  }

  /**
   * Clone vertex info by id
   * @param vertexId
   */
  cloneVertexInfo(vertexId) {
    const obj = this.getVertexInfoById(vertexId);
    // Clone and return
    return Object.assign({}, obj);
  }

  /* Vertex utils (E)*/

  /* Edge utils (S)*/
  /**
   * Get edge info by id
   * @param edgeId
   * @returns {*}
   */
  getEdgeInfoById(edgeId) {
    return _.find(this.dataContainer.edge, (e) => { return e.id === edgeId; });
  }
  /* Edge utils (E)*/

  /* Boundary utils (S)*/
  /**
   * Get boundary info by id
   * @param boundaryId
   * @returns {*}
   */
  getBoundaryInfoById(boundaryId) {
    return _.find(this.dataContainer.boundary, (e) => { return e.id === boundaryId; });
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
    let select =  _.find(member, (e) => { return e.id === childId; });
    if(select) {
      select.show = status;
    }
  }
  /* Boundary utils (E)*/
}

export default ObjectUtils;
