import * as d3 from 'd3';
import _ from "lodash";
import {
  TYPE_POINT,
  VERTEX_ATTR_SIZE
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
}

export default ObjectUtils;
