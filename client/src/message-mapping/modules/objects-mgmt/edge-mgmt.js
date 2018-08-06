import * as d3 from 'd3';
import _ from 'lodash';
import Edge from './edge';
import ObjectUtils from '../../common/utilities/object.ult';
import EdgeMenu from './menu-context/edge-menu';

import {
  TYPE_CONNECT,
} from '../../const/index';

import {
  createPath,
} from '../../common/utilities/common.ult';

class EdgeMgmt {
  constructor(props) {
    this.dataContainer    = props.dataContainer;
    this.svgId            = props.svgId;
    this.vertexContainer  = props.vertexContainer;

    this.selectorArrow    = '#arrow';
    this.selectorClass    = `_edge_${this.svgId}`;

    this.isCreatingEdge   = false;
    this.tmpSource        = null;
    this.selectingEdge  = null;

    this.initialize();
  }

  initialize() {
    this.objectUtils = new ObjectUtils();
    this.svgSelector = d3.select(`#${this.svgId}`);


    this.dragPointConnector = d3.drag()
      .on("start", this.dragPointStarted(this))
      .on("drag", this.draggedPoint(this))
      .on("end", this.dragPointEnded(this));

    this.handleDragConnection = d3.drag()
      .on("start", this.startConnect(this))
      .on("drag", this.drawConnect(this))
      .on("end", this.endConnect(this));

    this.svgSelector = d3.select(`#${this.svgId}`);

    this.initMarkerArrow();
    this.initPathConnect();
    this.initEdgePath();

    new EdgeMenu({
      selector: `.${this.selectorClass}`,
      dataContainer: this.dataContainer
    });
  }

  /**
   * Init Marker Arrow use for edge
   */
  initMarkerArrow() {
    this.svgSelector.append("svg:defs").append("svg:marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 10)
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 z")
      .style("stroke", "black");
  }

  /**
   * Init path connect used to create path
   */
  initPathConnect() {
    this.svgSelector.append("svg:g").append("svg:path")
      .attr("id", "dummyPath")
      .attr("class", "dummy-edge solid")
      .attr("fill", "none")
      .attr("marker-end", "url(#arrow)");
  }

  /**
   * Init path use for simulate change source or target connect
   */
  initEdgePath() {

    let group = this.svgSelector.append("g")
      .attr("transform", `translate(0.5, 0.5)`)
      .attr("id", "groupEdgePath");
    group.append("path")
      .attr("id", "edgePath")
      .attr("class", "dummy-path dash")
      .attr("fill", "none")
      .attr("stroke", "#2795EE");
    let groupPoint = this.svgSelector.append("g")
      .attr("transform", `translate(0.5, 0.5)`)
      .attr("id", "groupEdgePoint");
    groupPoint.append("circle")
      .attr("id", "pointStart")
      .attr("class", "dragPoint")
      .attr("type", TYPE_CONNECT.OUTPUT)
      .attr("fill", "#2795EE")
      .attr("pointer-events", "all")
      .attr("r", 4)
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .attr("stroke", "#2795EE");

    groupPoint.append("circle")
      .attr("id", "pointEnd")
      .attr("class", "dragPoint")
      .attr("type", TYPE_CONNECT.INPUT)
      .attr("fill", "#2795EE")
      .attr("pointer-events", "all")
      .attr("r", 4)
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .attr("stroke", "#2795EE");

    d3.selectAll('.dragPoint').call(this.dragPointConnector);
    d3.select('#groupEdgePoint').style("display", "none");
  }

  /**
   *
   * @param options
   * source: object, required {x: 1, y: 2, vertexId: 'V***', prop: 'spd'}
   * target: object, required {x: 1, y: 2, vertexId: 'V***', prop: 'spd'}
   * note: object, option {originNote: 'src', middleNote: 'to', destNote: 'des'}
   * style: object, option {line: 'solid', arrow: 'Y'} | line: solid, dash; arrow: Y, N
   * id: string, option E*********
   * Ex
   */
  create(sOptions) {
    let newEdge = new Edge({
      edgeMgmt: this
    });

    newEdge.create(sOptions);
  }

  dragPointStarted(main) {
    return function () {
      let edgeId = d3.select('#edgePath').attr('ref');
      let edgeObj = _.find(main.dataContainer.edge, {"id":edgeId});
      edgeObj.handlerOnClickEdge();
    }
  }

  /**
   * Drag connect belong to mouse position
   * @param self
   * @returns {Function}
   */
  draggedPoint(main) {
    return function () {
      let edgeId = d3.select('#edgePath').attr('ref');
      let edgeObj = _.find(main.dataContainer.edge, {"id":edgeId});
      edgeObj.handlerOnClickEdge();

      let pathStr = null;
      let x = d3.mouse(main.svgSelector.node())[0];
      let y = d3.mouse(main.svgSelector.node())[1];
      const type = d3.select(this).attr("type");
      if (type === "O") {
        let px = Number(d3.select("#pointEnd").attr("cx"));
        let py = Number(d3.select("#pointEnd").attr("cy"));
        pathStr = createPath({x, y}, {x: px, y: py});
      } else {
        let px = Number(d3.select("#pointStart").attr("cx"));
        let py = Number(d3.select("#pointStart").attr("cy"));
        pathStr = createPath({x: px, y: py}, {x, y});
      }

      d3.select('#edgePath').attr('d', pathStr);
      d3.select('#groupEdgePath').style("display", "block");
    }
  }

  /**
   * End creation connect if destination is connect point
   * @param self
   * @returns {Function}
   */
  dragPointEnded(main) {
    return function () {
      //Editing edge
      let edgeId = d3.select('#edgePath').attr('ref');
      let edgeObj = _.find(main.dataContainer.edge, {"id":edgeId});

      if (d3.event.sourceEvent.target.tagName == "rect") {
        //Data use for processing
        const pointType = d3.select(this).attr("type");
        let dropVertexId = d3.select(d3.event.sourceEvent.target.parentNode).attr("id");
        let prop = d3.select(d3.event.sourceEvent.target).attr("prop");
  
        //Prevent drag on same vertex
        if ((pointType === "O" && edgeObj.target.vertexId == dropVertexId)
            || (pointType === "I" && edgeObj.source.vertexId == dropVertexId)) 
        {
          edgeObj.handleOnFocusOut();
          return;
        }

        let vertices = [];
        main.vertexContainer.forEach(arrVertex => {
          vertices = vertices.concat(arrVertex.vertex);
        });

        //Vertex that draged to
        let targetVertexObj = _.find(vertices, {'id': dropVertexId});
        const {svgId, x, y} = targetVertexObj;

        //Calculate new coordinate of ended point on CONNECT SVG for redraw edge
        const newPoint = main.objectUtils.getCoordPropRelativeToParent({x, y, id: dropVertexId}, prop, pointType, svgId);
        newPoint.vertexId = dropVertexId;
        newPoint.prop = prop;
        newPoint.svgId = svgId;

        pointType === "O" ? edgeObj.updatePathConnect({source: newPoint}) : edgeObj.updatePathConnect({target: newPoint});

        edgeObj.handlerOnClickEdge();

      } else {
        edgeObj.handleOnFocusOut();
      }
    }
  }

  startConnect(main) {
    return function () {
      main.isCreatingEdge = true;
      let prop = d3.select(d3.event.sourceEvent.target).attr("prop");
      let vertexId = d3.select(d3.event.sourceEvent.target.parentNode).attr("id");

      let vertices = [];
      main.vertexContainer.forEach(arrVertex => {
        vertices = vertices.concat(arrVertex.vertex);
      });

      let vertexObj = _.find(vertices, {'id': vertexId});
      const {svgId, x, y} = vertexObj;
      const src = main.objectUtils.getCoordPropRelativeToParent({id: vertexId, x, y}, prop, TYPE_CONNECT.OUTPUT, svgId);
      src.vertexId = vertexId;
      src.prop = prop;
      src.svgId = svgId;
      main.tmpSource = src;
    }
  }

  drawConnect(main) {
    return function () {
      if (main.isCreatingEdge) {
        const {x: x1, y: y1} = main.tmpSource;
        let x2 = d3.mouse(d3.select(`#${main.svgId}`).node())[0];
        let y2 = d3.mouse(d3.select(`#${main.svgId}`).node())[1];
        let pathStr = createPath({x: x1, y: y1}, {x: x2, y: y2});
        d3.select('#dummyPath').attr('d', pathStr);
        d3.select('#dummyPath').style("display", "block");
      }
    }
  }

  endConnect(main) {
    return function () {
      main.isCreatingEdge = false;
      if (d3.event.sourceEvent.target.tagName == "rect" 
          && this != d3.event.sourceEvent.target 
          && d3.select(d3.event.sourceEvent.target.parentNode).attr("id") != main.tmpSource.vertexId) 
      {
        let vertextId = d3.select(d3.event.sourceEvent.target.parentNode).attr("id");
        let prop = d3.select(d3.event.sourceEvent.target).attr("prop");

        let vertices = [];
        main.vertexContainer.forEach(arrVertex => {
          vertices = vertices.concat(arrVertex.vertex);
        });

        let vertexObj = _.find(vertices, {'id': vertextId});
        const {svgId, x, y} = vertexObj;
        const des = main.objectUtils.getCoordPropRelativeToParent({id: vertextId, x, y}, prop, TYPE_CONNECT.INPUT, svgId);
        des.vertexId = vertextId;
        des.prop = prop;
        des.svgId = svgId;
        let options = {source: main.tmpSource, target: des};

        main.create(options);
      }

      d3.select('#dummyPath').attr('d', null);
      d3.select('#dummyPath').style("display", "none");
      main.tmpSource = null;
    }
  }

  /**
  * Find and update position connect to vertex when in move
  * @param vertex
  * @param dataContainer edge container
  */
  updatePathConnectForVertex(vertex) {
    const {x, y, id, svgId} = vertex;

    // Find edge start from this vertex
    const arrSrcPaths = _.filter(this.dataContainer.edge, (e) => {
      return e.source.vertexId === id;
    });
    // Find edge end at this vertex
    const arrDesPaths = _.filter(this.dataContainer.edge, (e) => {
      return e.target.vertexId === id;
    });

    arrSrcPaths.forEach(src => {
      let prop = src.source.prop;
      let newPos = this.objectUtils.getCoordPropRelativeToParent({x, y, id}, prop, TYPE_CONNECT.OUTPUT, svgId);
      src.source.x = newPos.x;
      src.source.y = newPos.y;
      let options = {source: src.source};
      src.updatePathConnect(options);
      src.setStatusEdgeOnCurrentView();
    });

    arrDesPaths.forEach(des => {
      let prop = des.target.prop;
      let newPos = this.objectUtils.getCoordPropRelativeToParent({x, y, id}, prop, TYPE_CONNECT.INPUT, svgId);
      des.target.x = newPos.x;
      des.target.y = newPos.y;
      let options = {target: des.target};
      des.updatePathConnect(options);
      des.setStatusEdgeOnCurrentView();
    });
  }

  clearAll(){
    this.dataContainer.edge = [];
    d3.select(`#${this.svgId}`).selectAll(`.${this.selectorClass}`).remove();
  }

  /**
   * Remove edge connect to this vertexs
   * @param vertex vertex list
   */
  removeAllEdgeConnectToVertex(vertex)
  {
    this.findEdgeRelateToVertex(vertex.id).forEach(edge=>{
      edge.remove();
    })
  }

  /**
   * Remove edge connect to these vertexs
   * @param vertex vertex list
   */
  removeAllEdgeConnectToTheseVertex(lstVertex)
  {
    lstVertex.forEach(e=>{
      this.findEdgeRelateToVertex(e.id).forEach(edge=>{
        edge.remove();
      })
    })
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

  /**
   * Remove edge that lost prop connect on vertex edit
   * @param vertex
   */
  removeEdgeLostPropOnVertex(vertex) {
    // Find edge start from this vertex
    const arrSrcPaths = _.filter(this.dataContainer.edge, (e) => {
      return e.source.vertexId === vertex.id;
    });

    // Find edge end at this vertex
    const arrDesPaths = _.filter(this.dataContainer.edge, (e) => {
      return e.target.vertexId === vertex.id;
    });

    arrSrcPaths.forEach(src => {
      const {source: {prop, vertexId}} = src;

      if(this.objectUtils.findIndexPropInVertex(vertexId, prop) === null)
        src.remove();
    });

    arrDesPaths.forEach(des => {
      const {target: {prop, vertexId}} = des;

      if(this.objectUtils.findIndexPropInVertex(vertexId, prop) === null)
        des.remove();
    });
  }

  hideAllEdgeRelatedToVertex(vertexId, flag) {
    // Find all edge relate
    let edges = _.filter(this.dataContainer.edge, e => {
      return e.source.vertexId === vertexId || e.target.vertexId === vertexId;
    });

    edges.forEach(e => {
      let node = d3.select(`#${e.id}`);
      if (node.node())
        d3.select(node.node().parentNode).classed('hide-edge-on-menu-items', !flag);
    });
  }

  isSelectingEdge(){
    return this.selectingEdge != null;
  }

  cancelSelectingEdge(){
    if (this.selectingEdge) this.selectingEdge.handleOnFocusOut();
  }

  
}

export default EdgeMgmt;