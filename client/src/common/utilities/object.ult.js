import * as d3 from 'd3';
import _ from "lodash";
import {
  TYPE_POINT,
  VERTEX_ATTR_SIZE,
  BOUNDARY_ATTR_SIZE
} from '../../const/index';

class ObjectUtils {
  constructor(props){
    this.svgSelector = props.svgSelector;
    this.dataContainer = props.dataContainer;
  }

  /**
   * Gernerate object id with format 'prefix' + Date.now()
   * Ex for vertex: V1234234234
   * Ex for edge: E1234234234
   * Ex for boundary: B1234234234
   * @returns {string}
   */
  generateObjectId(prefix = 'V') {
    return `${prefix}${Date.now()}`;
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
   * Find all path (edge, connect) start or end at this vertex
   * @param vertexId
   * @returns {Array}
   */
  findEdgeRelateToVertex(vertexId) {
    if(!vertexId)
      return [];

    return _.filter(this.dataContainer.edge, (e) =>
      { return e.target.vertexId === vertexId || e.source.vertexId === vertexId; }
    );
  }

  /**
   * Get vertex info by id
   * @param vertexId
   * @returns {*}
   */
  getVertexInfoById(vertexId) {
    return _.find(this.dataContainer.vertex, (e) => { return e.id === vertexId; });
  }

  /**
   * Get boundary info by id
   * @param boundaryId
   * @returns {*}
   */
  getBoundaryInfoById(boundaryId) {
    return _.find(this.dataContainer.boundary, (e) => { return e.id === boundaryId; });
  }

  /**
   * Get BBox of object by id
   * @param objectId
   * @returns {*}
   */
  getBBoxObjectById(objectId) {
    return d3.select(`#${objectId}`).node().getBBox();
  }

  /**
   * Reset the boundary change height when drag vertices that
   * height larger than boundary
   */
  resetSizeAllBoundary() {
    d3.select("svg").selectAll(".groupBoundary").each((d, i, node) => {
      let orderObject = 0;
      let heightBeforeElements = 42;
      let marginTop = 5;
      let widthBoundary = BOUNDARY_ATTR_SIZE.BOUND_WIDTH;
      let boundaryId = d.id;
      let boundaryScope = d.boundaryScope;
      let boundaryMembers = d.member;

      boundaryMembers.forEach(member => {
        if(member.show) {
          let objectId = member.id;
          let boxObject = this.getBBoxObjectById(objectId);
          orderObject ++;
          heightBeforeElements += boxObject.height;
          if(boxObject.width > widthBoundary)
            widthBoundary = boxObject.width + (member.type === "B" ? 10: 0);
        }
      });

      let boundaryHeight = heightBeforeElements + marginTop*orderObject;
      boundaryScope.setHeightBoundary(boundaryId, boundaryHeight);
      boundaryScope.setWidthBoundary(boundaryId, widthBoundary);
    });
  }

  /**
   * Clone vertex info by id
   * @param vertexId
   */
  cloneVertexInfoById(vertexId) {
    const obj = this.getVertexInfoById(vertexId);
    // Clone and return
    return Object.assign({}, obj);
  }

  /**
   * Clone boundary info by id
   * @param boundaryId
   */
  cloneBoundaryInfoById(boundaryId) {
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
    let boundaryInfo = this.getBoundaryInfoById(boundaryId);
    let members = boundaryInfo.member;
    let select =  _.find(members, (e) => { return e.id === childId; });
    if(select) {
      select.show = status;
    }
  }
}

export default ObjectUtils;
