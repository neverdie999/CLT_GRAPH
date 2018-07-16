import Vertex from '../objects-mgmt/vertex';
import Boundary from '../objects-mgmt/boundary';
import * as d3 from 'd3';
import {
  ID_SVG_INPUT_MESSAGE,
  CONNECT_SIDE,
} from '../../const/index';
import _ from 'lodash';

class InputMgmt {
  constructor(props) {
    this.mainMgmt = props.mainMgmt;
    this.storeInputMessage = props.storeInputMessage;
    this.inputDefined = props.inputDefined;
    this.vertex = new Vertex();
    this.boundary = new Boundary();
    this.initialize();
  }

  initialize() {
    this.svgSelector = d3.select(`#${ID_SVG_INPUT_MESSAGE}`);

    this.defaultOptionsVertex = {
      connectSide: CONNECT_SIDE.RIGHT,
      svgSelector: this.svgSelector,
      containerClass: '_drag_vertex_input_message',
      callbackDragConnection: this.mainMgmt.callbackDragConnection,
    };

    this.defaultOptionsBoundary = {
      svgSelector: this.svgSelector,
      containerClass: '_drag_boundary_input_message',
    };

    this.initScrollEvent();
  }

  initScrollEvent(){
    $(`#${ID_SVG_INPUT_MESSAGE}`).parent().scroll(()=>{
      this.onScrollHandle(this);
    });
  }

  onScrollHandle(main){
    this.storeInputMessage.vertex.forEach(v => {
      this.mainMgmt.updatePathConnect(v, ID_SVG_INPUT_MESSAGE);
    });
  }

  drawObjectsOnInputGraph(data) {
    const {boundary : boundaries, vertex : vertices, position} = data;
    // Draw boundary
    boundaries.forEach(e => {
      let {x, y} = position.find(pos => {
        return pos.id === e.id;
      });
      e.x = x;
      e.y = y;
      e.idSvg = ID_SVG_INPUT_MESSAGE;
      this.storeInputMessage.boundary.push(e);
      const originConfig = _.cloneDeep(this.defaultOptionsBoundary);
      let options = _.merge(originConfig, e);
      this.boundary.create(options, this.storeInputMessage.boundary);
    });

    // Draw vertex
    vertices.forEach(e => {
      const {x, y} = position.find(pos => {
        return pos.id === e.id;
      });
      e.x = x;
      e.y = y;
      e.idSvg = ID_SVG_INPUT_MESSAGE;
      this.storeInputMessage.vertex.push(e);
      const originConfig = _.cloneDeep(this.defaultOptionsVertex);
      let presentation = this.inputDefined.vertexPresentation[e.groupType];
      let options = _.merge(originConfig, e);
      options.presentation = presentation;
      this.vertex.create(options, this.storeInputMessage.vertex);
    });
  }
}

export default InputMgmt;
