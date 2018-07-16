import {
  ID_SVG_CONNECT,
  TYPE_CONNECT,
} from '../../const/index';
import {
  generateObjectId,
  createPath,
} from '../../common/utilities/common.ult';
import * as d3 from 'd3';
import _ from 'lodash';
import Edge from '../objects-mgmt/edge';
import ObjectUtils from '../../common/utilities/object.ult';
import EdgeMenu from './menu-context/edge-menu';

class ConnectMgmt {
  constructor(props) {
    this.mainMgmt = props.mainMgmt;
    this.storeConnect = props.storeConnect;
    this.storeInputMessage = props.storeInputMessage;
    this.storeOperations = props.storeOperations;
    this.storeOutputMessage = props.storeOutputMessage;

    this.initialize();
  }

  initialize() {
    this.objectUtils = new ObjectUtils();
    this.edge = new Edge();
    this.svgSelector = d3.select(`#${ID_SVG_CONNECT}`);

    this.defaultConfigs = {
      lineType: "S",
      useMarker: "Y",
      originNote: null,
      middleNote: null,
      destNote: null,
      containerClass: 'selector_on_edge',
      callbackOnClick: this.callbackOnClick.bind(this),
      callbackOnKeyDown: this.callbackOnKeyDown.bind(this),
      callbackOnFocusOut: this.callbackOnFocusOut.bind(this),
      svgSelector: this.svgSelector,
      selectorArrow: '#arrow',
    };

    this.dragPointConnector = d3.drag()
      .on("start", this.dragPointStarted(this))
      .on("drag", this.draggedPoint(this))
      .on("end", this.dragPointEnded(this));

    this.svgSelector = d3.select(`#${ID_SVG_CONNECT}`);
    this.initMarkerArrow();
    this.initPathConnect();
    this.initEdgePath();
    new EdgeMenu({
      selector: '.selector_on_edge',
      connectMgmt: this,
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

    // Append point to drag start or end connect point
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
  createEdge(sOptions) {
    const originConfig = _.cloneDeep(this.defaultConfigs);
    let options = _.merge(originConfig, sOptions);

    let {id, source, target, lineType, useMarker, originNote, middleNote, destNote} = options;
    if (!id)
      id = generateObjectId('E');

    // Push edge info to store.
    const info = {
      id,
      source,
      target,
      lineType,
      useMarker,
      originNote,
      middleNote,
      destNote,
    };
    this.storeConnect.edge.push(info);

    const configs = _.merge(originConfig, info);
    let pathStr = createPath(source, target);
    configs.pathStr = pathStr;

    this.edge.create(configs);
  }

  callbackOnClick(id) {
    this.handlerOnClickEdge(id);
  }

  callbackOnKeyDown(id, event) {
    if (event.keyCode === 46 || event.keyCode === 8) {
      this.removeEdge(id);
    }
  }

  callbackOnFocusOut() {
    d3.select('#groupEdgePath').style("display", "none");
    d3.select('#groupEdgePoint').style("display", "none");
    d3.select("#groupEdgePoint").moveToBack();
    d3.select("#groupEdgePath").moveToBack();
  }

  /**
   * Remove edge by id
   * @param edgeId
   */
  removeEdge(id) {
    // Remove from DOM
    let selected = d3.select(`#${id}`);
    if (selected) {
      selected.node().parentNode.remove();
      // Mutates array edge
      _.remove(this.storeConnect.edge, (e) => {
        return e.id === id;
      });
    }
  }

  /**
   * Handler on click a path connection
   * @param edgeId
   * @param source
   * @param target
   */
  handlerOnClickEdge(id) {
    let selected = d3.select(`#${id}`);
    let currentPath = selected.attr("d");
    let markerEnd = selected.attr('marker-end');
    const {source, target} = _.find(this.storeConnect.edge, {'id': id});
    d3.select('#groupEdgePoint')
      .style("display", "block")
      .moveToFront();
    d3.select('#groupEdgePath')
      .style("display", "block")
      .moveToFront();
    d3.select("#edgePath")
      .attr("d", currentPath)
      .attr("marker-end", markerEnd)
      .attr("ref", id);

    d3.select("#pointStart")
      .attr("cx", source.x)
      .attr("cy", source.y);
    d3.select("#pointEnd")
      .attr("cx", target.x)
      .attr("cy", target.y);
  }

  dragPointStarted(main) {
    return function () {
      d3.select('#arrow path').style('stroke', '#2795ee');
      let edgeId = d3.select('#edgePath').attr('ref');
      main.handlerOnClickEdge(edgeId);
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
      main.handlerOnClickEdge(edgeId);
      let pathStr = null;
      let x = d3.mouse(d3.select(`#${ID_SVG_CONNECT}`).node())[0];
      let y = d3.mouse(d3.select('svg').node())[1];
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
      if (d3.event.sourceEvent.target.tagName == "rect" && this != d3.event.sourceEvent.target) {
        const type = d3.select(this).attr("type");
        let id = d3.select(d3.event.sourceEvent.target.parentNode).attr("id");
        let prop = d3.select(d3.event.sourceEvent.target).attr("prop");
        let edgeId = d3.select('#edgePath').attr('ref');
        let vertices = main.storeInputMessage.vertex.concat(main.storeOperations.vertex).concat(main.storeOutputMessage.vertex);
        let info = _.find(vertices, {'id': id});
        const {idSvg, x, y} = info;
        const newPoint = main.objectUtils.getCoordPropRelativeToParent({x, y, id}, prop, type, idSvg);
        newPoint.vertexId = id;
        newPoint.prop = prop;
        newPoint.idSvg = idSvg;
        type === "O" ? main.updatePathConnect(edgeId, {source: newPoint}) : main.updatePathConnect(edgeId, {target: newPoint});
        main.handlerOnClickEdge(edgeId);
        // Set focus after change
        let selected = d3.select(`#${edgeId}`);
        if (selected) {
          selected.node().parentNode.focus();
        }
      } else {
        d3.select('#groupEdgePath')
          .style("display", "none")
          .moveToBack();
        d3.select("#edgePath").moveToBack();
        d3.select('#groupEdgePoint')
          .style("display", "none")
          .moveToBack();
      }

      d3.select('#arrow path').style('stroke', '#000000');
    }
  }

  /**
   * Update attribute d of path (connect)
   * @param id
   * @param options: object
   */
  updatePathConnect(id, sOptions = {}) {
    if (!id) return;

    let info = _.find(this.storeConnect.edge, {'id': id});
    _.merge(info, sOptions);
    const {source, target} = info;
    let pathStr = createPath(source, target);
    // Get DOM and update attribute
    d3.selectAll(`#${id}`).attr('d', pathStr);
  }

  /**
   * Get edge notes by id
   * @param id
   * @returns {*}
   */
  getEdgeInfo(id) {
    return _.find(this.storeConnect.edge, {'id': id});
  }

  /**
   * Set text note on edge
   * @param id
   * @param note
   * @param targetNote
   */
  setEdgeNote(id, note, targetNote) {
    let edgeObj = _.find(this.storeConnect.edge, {'id': id});
    if (!edgeObj)
      return;
    edgeObj[targetNote] = note;

    // Update note on view
    d3.select(`#${targetNote}${id}`)
      .text(note);
  }

  /**
   * Set style path connect solid, dash
   * @param id
   * @param type
   */
  setLineType(id, type) {
    let edge = _.find(this.storeConnect.edge, {'id': id});
    edge.lineType = type;
    let path = d3.selectAll(`#${id}`).filter((d, i) => {
      return i == 1;
    });
    path.style('stroke-dasharray', type === 'S' ? '0 0' : '3 3');
  }

  /**
   * Set use arrow marker
   * @param id
   * @param flag
   */
  setUseMarker(id, flag) {
    let edge = _.find(this.storeConnect.edge, {'id': id});
    edge.useMarker = flag;
    d3.selectAll(`#${id}`).attr('marker-end', flag === 'Y' ? `url(${this.defaultConfigs.selectorArrow})` : '');
  }
}

export default ConnectMgmt;
