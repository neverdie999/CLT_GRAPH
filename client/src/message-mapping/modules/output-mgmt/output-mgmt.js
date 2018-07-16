import Vertex from '../objects-mgmt/vertex';
import Boundary from '../objects-mgmt/boundary';
import * as d3 from 'd3';
import {
  ID_SVG_OUTPUT_MESSAGE,
  CONNECT_SIDE,
} from '../../const/index';
import _ from 'lodash';

class OutputMgmt {
  constructor(props) {
    this.mainMgmt = props.mainMgmt;
    this.storeOutputMessage = props.storeOutputMessage;
    this.outputDefined = props.outputDefined;
    this.vertex = new Vertex();
    this.boundary = new Boundary();
    this.initialize();
  }

  initialize() {
    this.svgSelector = d3.select(`#${ID_SVG_OUTPUT_MESSAGE}`);

    this.defaultOptionsVertex = {
      connectSide: CONNECT_SIDE.LEFT,
      svgSelector: this.svgSelector,
      containerClass: '_drag_vertex_output_message',
      callbackDragConnection: this.mainMgmt.callbackDragConnection,
    };

    this.defaultOptionsBoundary = {
      svgSelector: this.svgSelector,
      containerClass: '_drag_boundary_output_message',
    };

    this.initScrollEvent();
  }

  initScrollEvent(){
    $(`#${ID_SVG_OUTPUT_MESSAGE}`).parent().scroll(()=>{
      this.onScrollHandle(this);
    });
  }

  onScrollHandle(main){
    this.storeOutputMessage.vertex.forEach(v => {
      this.mainMgmt.updatePathConnect(v, ID_SVG_OUTPUT_MESSAGE);
    });
  }

  drawObjectsOnOutputGraph(data) {
    const {boundary : boundaries, vertex : vertices, position} = data;
    // Draw boundary
    boundaries.forEach(e => {
      let {x, y} = position.find(pos => {
        return pos.id === e.id;
      });
      e.x = x;
      e.y = y;
      e.idSvg = ID_SVG_OUTPUT_MESSAGE;
      this.storeOutputMessage.boundary.push(e);
      const originConfig = _.cloneDeep(this.defaultOptionsBoundary);
      let options = _.merge(originConfig, e);
      this.boundary.create(options, this.storeOutputMessage.boundary);
    });

    // Draw vertex
    vertices.forEach(e => {
      const {x, y} = position.find(pos => {
        return pos.id === e.id;
      });
      e.x = x;
      e.y = y;
      e.idSvg = ID_SVG_OUTPUT_MESSAGE;
      this.storeOutputMessage.vertex.push(e);
      const originConfig = _.cloneDeep(this.defaultOptionsVertex);
      let presentation = this.outputDefined.vertexPresentation[e.groupType];
      let options = _.merge(originConfig, e); // Merged config
      options.presentation = presentation;
      this.vertex.create(options, this.storeOutputMessage.vertex);
    });
  }
}

export default OutputMgmt;
