import FileMgmt from '../file-mgmt/file-mgmt';
import InputMgmt from '../input-mgmt/input-mgmt';
import OutputMgmt from '../output-mgmt/output-mgmt';
import OperationsMgmt from '../operations-mgmt/operations-mgmt';
import ConnectMgmt from '../connect-mgmt/connect-mgmt';
import * as d3 from 'd3';
import _ from 'lodash';
import {
  VERTEX_FORMAT_TYPE,
  COMMON_DATA,
  ID_SVG_CONNECT,
  TYPE_CONNECT,
  ID_CONTAINER_INPUT_MESSAGE,
  ID_CONTAINER_OPERATIONS,
  ID_CONTAINER_OUTPUT_MESSAGE,
  ID_SVG_INPUT_MESSAGE,
  ID_SVG_OPERATIONS,
  ID_SVG_OUTPUT_MESSAGE,
  ID_SVG_CONNECT,
} from '../../const/index';
import ObjectUtils from '../../common/utilities/object.ult';
import {
  createPath,
  setMinBoundaryGraph,
} from '../../common/utilities/common.ult';

class MainMgmt {
  constructor(props) {
    this.storeConnect = props.storeConnect;
    this.storeInputMessage = props.storeInputMessage;
    this.storeOperations = props.storeOperations;
    this.storeOutputMessage = props.storeOutputMessage;
    this.initialize();
  }

  initialize() {
    this.windowHeight = $(window).height();
    this.limitTop = 0;
    this.limitBottom = this.windowHeight;

    this.callbackDragConnection = d3.drag()
      .on("start", this.startConnect(this))
      .on("drag", this.drawConnect(this))
      .on("end", this.endConnect(this));

    this.objectUtils = new ObjectUtils();

    this.operationsDefined = {
      groupVertexOption: {}, // List vertex type have same option.
      vertexFormatType: {}, // Vertex group format type
      vertexFormat: {}, // Data element vertex format
      vertexGroupType: {}, // Group vertex type
      headerForm: {}, // Header group type
      vertexPresentation: {}, // Group vertex presentation
      vertexGroup: null, // Group vertex
    };

    this.inputDefined = {
      groupVertexOption: {}, // List vertex type have same option.
      vertexFormatType: {}, // Vertex group format type
      vertexFormat: {}, // Data element vertex format
      vertexGroupType: {}, // Group vertex type
      headerForm: {}, // Header group type
      vertexPresentation: {}, // Group vertex presentation
      vertexGroup: null, // Group vertex
    };

    this.outputDefined = {
      groupVertexOption: {}, // List vertex type have same option.
      vertexFormatType: {}, // Vertex group format type
      vertexFormat: {}, // Data element vertex format
      vertexGroupType: {}, // Group vertex type
      headerForm: {}, // Header group type
      vertexPresentation: {}, // Group vertex presentation
      vertexGroup: null, // Group vertex
    };

    this.inputMgmt = new InputMgmt({
      mainMgmt: this,
      storeInputMessage: this.storeInputMessage,
      inputDefined: this.inputDefined,
    });

    this.outputMgmt = new OutputMgmt({
      mainMgmt: this,
      storeOutputMessage: this.storeOutputMessage,
      outputDefined: this.outputDefined,
    });

    this.operationsMgmt = new OperationsMgmt({
      mainMgmt: this,
      storeOperations: this.storeOperations,
      operationsDefined: this.operationsDefined,
      objectUtils: this.objectUtils
    });

    this.connectMgmt = new ConnectMgmt({
      storeConnect: this.storeConnect,
      mainMgmt: this,
      storeInputMessage: this.storeInputMessage,
      storeOperations: this.storeOperations,
      storeOutputMessage: this.storeOutputMessage,
    });

    new FileMgmt({
      mainMgmt: this,
      storeInputMessage: this.storeInputMessage,
      storeOperations: this.storeOperations,
      storeOutputMessage: this.storeOutputMessage,
      inputDefined: this.inputDefined,
      outputDefined: this.outputDefined,
      operationsDefined: this.operationsDefined,
    });
    this.initCustomFunctionD3();
    this.initListenerContainerSvgScroll();
    this.initListenerOnWindowResize();
  }

  initCustomFunctionD3() {
    /**
     * Move DOM element to front of others
     */
    d3.selection.prototype.moveToFront = function () {
      return this.each(function () {
        this.parentNode.appendChild(this);
      });
    };

    /**
     * Move DOM element to back of others
     */
    d3.selection.prototype.moveToBack = function () {
      this.each(function () {
        this.parentNode.firstChild && this.parentNode.insertBefore(this, this.parentNode.firstChild);
      });
    };
  }

  /**
   * Validation data input match structure of graph data
   * @param data
   * @param isInput
   */
  async separateDataToManagement(data, option) {
    // Todo validation data before parse
    // const {vertexTypes} = data;
    if (option === "DATA_INPUT_MESSAGE") {
      await this.handleDataInputMessage(data);
    }

    if (option === "DATA_OUTPUT_MESSAGE") {
      await this.handleDataOutputMessage(data);
    }

    if (option === "DATA_VERTEX_DEFINE_OPERATIONS") {
      await this.handleDataVertexDefineOperations(data);
    }

    if (option === "DATA_MESSAGE_MAPPING_DEFINITION") {
      await this.handleDataMessageMappingDefinition(data);
      this.updatePathConnectOnWindowResize();
      this.onContainerSvgScroll(ID_SVG_OPERATIONS);
    }
  }

  async handleDataInputMessage(data) {
    const {vertexTypes} = data;
    await this.processDataVertexTypeDefine(vertexTypes, this.inputDefined);
    this.inputMgmt.drawObjectsOnInputGraph(data);
    setMinBoundaryGraph(this.inputMgmt.storeInputMessage,ID_SVG_INPUT_MESSAGE);
  }

  async handleDataOutputMessage(data) {
    const {vertexTypes} = data;
    await this.processDataVertexTypeDefine(vertexTypes, this.outputDefined);
    this.outputMgmt.drawObjectsOnOutputGraph(data);
    setMinBoundaryGraph(this.outputMgmt.storeOutputMessage,ID_SVG_OUTPUT_MESSAGE);
  }

  async handleDataOperations(data) {
    const {vertexTypes} = data;
    await this.processDataVertexTypeDefine(vertexTypes, this.operationsDefined);
    this.operationsMgmt.initMenuContext();
    this.operationsMgmt.drawObjectsOnOperationsGraph(data);
    setMinBoundaryGraph(this.operationsMgmt.storeOperations,ID_SVG_OPERATIONS);
  }

  async handleDataEdges(data){
    await this.connectMgmt.drawEdgeOnConnectGraph(data);
  }


  async handleDataVertexDefineOperations(data) {
    await this.processDataVertexTypeDefine(data, this.operationsDefined);
    this.operationsMgmt.initMenuContext();
    setMinBoundaryGraph(this.operationsMgmt.storeOperations,ID_SVG_OPERATIONS);
  }

  async handleDataMessageMappingDefinition(data) {
    //Clear all data
    this.inputMgmt.clearAll();
    this.operationsMgmt.clearAll();
    this.outputMgmt.clearAll();
    this.connectMgmt.clearAll();

    //start to draw with new data
    const {inputMessage, outputMessage, operations, edges} = data;
    this.handleDataInputMessage(inputMessage);
    this.handleDataOutputMessage(outputMessage);
    this.handleDataOperations(operations);
    this.handleDataEdges(edges);
  }

  processDataVertexTypeDefine(data, container) {
    const {VERTEX, VERTEX_GROUP} = data;
    container.vertexTypes = VERTEX;
    container.vertexGroup = VERTEX_GROUP;
    this.getVertexFormatType(VERTEX_GROUP, container);
    this.getVertexTypesShowFull(data, container);
  }

  getVertexFormatType(vertexGroup, container) {
    vertexGroup.forEach(group => {
      const {groupType, dataElementFormat, vertexPresentation} = group;
      container.headerForm[groupType] = Object.keys(dataElementFormat);
      container.vertexPresentation[groupType] = vertexPresentation;
      container.vertexFormat[groupType] = dataElementFormat;
      container.vertexGroupType[groupType] = group;
      let formatType = {};
      let header = container.headerForm[groupType];
      let len = header.length;
      for (let i = 0; i < len; i++) {
        let key = header[i];
        let value = dataElementFormat[key];
        let type = typeof(value);

        formatType[key] = VERTEX_FORMAT_TYPE.STRING; // For string and other type
        if (type === "boolean")
          formatType[key] = VERTEX_FORMAT_TYPE.BOOLEAN; // For boolean

        if (type === "object" && Array.isArray(value))
          formatType[key] = VERTEX_FORMAT_TYPE.ARRAY; // For array

        if (type === "number")
          formatType[key] = VERTEX_FORMAT_TYPE.NUMBER; // For number
      }

      container.vertexFormatType[groupType] = formatType;
    });
  }

  getVertexTypesShowFull(data, container) {
    const group = data["VERTEX_GROUP"];
    const vertex = data["VERTEX"];
    let len = group.length;
    for (let i = 0; i < len; i++) {
      let groupType = group[i].groupType;
      let groupOption = group[i].option;
      let lenOpt = groupOption.length;
      for (let j = 0; j < lenOpt; j++) {
        let option = groupOption[j];
        let groupVertex = _.filter(vertex, (e) => {
            return e.groupType === groupType;
          }
        );
        let groupAction = [];
        groupVertex.forEach(e => {
          groupAction.push(e.vertexType);
        });
        container.groupVertexOption[option] = groupAction;
      }
    }
  }

  startConnect(main) {
    return function () {
      COMMON_DATA.isCreatingEdge = true;
      let prop = d3.select(d3.event.sourceEvent.target).attr("prop");
      let id = d3.select(d3.event.sourceEvent.target.parentNode).attr("id");
      let vertices = main.storeInputMessage.vertex.concat(main.storeOperations.vertex).concat(main.storeOutputMessage.vertex);
      let info = _.find(vertices, {'id': id});
      const {idSvg, x, y} = info;
      const src = main.objectUtils.getCoordPropRelativeToParent({id, x, y}, prop, TYPE_CONNECT.OUTPUT, idSvg);
      src.vertexId = id;
      src.prop = prop;
      src.idSvg = idSvg;
      COMMON_DATA.tmpSource = src;
    }
  }

  drawConnect() {
    return function () {
      if (COMMON_DATA.isCreatingEdge) {
        const {x: x1, y: y1} = COMMON_DATA.tmpSource;
        let x2 = d3.mouse(d3.select(`#${ID_SVG_CONNECT}`).node())[0];
        let y2 = d3.mouse(d3.select(`#${ID_SVG_CONNECT}`).node())[1];
        let pathStr = createPath({x: x1, y: y1}, {x: x2, y: y2});
        d3.select('#dummyPath').attr('d', pathStr);
        d3.select('#dummyPath').style("display", "block");
      }
    }
  }

  endConnect(main) {
    return function () {
      COMMON_DATA.isCreatingEdge = false;
      if (d3.event.sourceEvent.target.tagName == "rect" && this != d3.event.sourceEvent.target) {
        let id = d3.select(d3.event.sourceEvent.target.parentNode).attr("id");
        let prop = d3.select(d3.event.sourceEvent.target).attr("prop");
        let vertices = main.storeInputMessage.vertex.concat(main.storeOperations.vertex).concat(main.storeOutputMessage.vertex);
        let info = _.find(vertices, {'id': id});
        const {idSvg, x, y} = info;
        const des = main.objectUtils.getCoordPropRelativeToParent({id, x, y}, prop, TYPE_CONNECT.INPUT, idSvg);
        des.vertexId = id;
        des.prop = prop;
        des.idSvg = idSvg;
        let options = {source: COMMON_DATA.tmpSource, target: des};

        main.createConnect(options);
      }

      d3.select('#dummyPath').attr('d', null);
      d3.select('#dummyPath').style("display", "none");
      COMMON_DATA.tmpSource = null;
    }
  }

  createConnect(options) {
    this.connectMgmt.createEdge(options);
  }

  initListenerContainerSvgScroll() {
    $(`#${ID_CONTAINER_INPUT_MESSAGE}, #${ID_CONTAINER_OPERATIONS}, #${ID_CONTAINER_OUTPUT_MESSAGE}`).on('scroll', (e) => {
      if(COMMON_DATA.isSelectingEdge)
        this.connectMgmt.callbackOnFocusOut();
      let ref = $(e.target).attr("ref");
      this.onContainerSvgScroll(ref);
    });
  }

  onContainerSvgScroll(ref) {
    let vertices = this.storeInputMessage.vertex.concat(this.storeOperations.vertex).concat(this.storeOutputMessage.vertex);
    // Find edge start from this SVG
    const srcEdges = _.filter(this.storeConnect.edge, (e) => {
      return e.source.idSvg === ref;
    });
    // Find edge end at this SVG
    const desEdges = _.filter(this.storeConnect.edge, (e) => {
      return e.target.idSvg === ref;
    });

    srcEdges.forEach(e => {
      const {source: {vertexId: id, prop}, id: edgeId} = e;
      let {x, y, idSvg} = _.find(vertices, {'id': id});
      let {x: propX, y: propY} = this.objectUtils.getCoordPropRelativeToParent({
        id,
        x,
        y
      }, prop, TYPE_CONNECT.OUTPUT, idSvg);
      e.source.x = propX;
      e.source.y = propY;
      let options = {source: e.source};
      this.connectMgmt.updatePathConnect(edgeId, options);
      this.setStatusEdgeOnCurrentView(e);
    });

    desEdges.forEach(e => {
      const {target: {vertexId: id, prop}, id: edgeId} = e;
      let {x, y, idSvg} = _.find(vertices, {'id': id});
      let {x: propX, y: propY} = this.objectUtils.getCoordPropRelativeToParent({
        id,
        x,
        y
      }, prop, TYPE_CONNECT.INPUT, idSvg);
      e.target.x = propX;
      e.target.y = propY;
      let options = {target: e.target};
      this.connectMgmt.updatePathConnect(edgeId, options);
      this.setStatusEdgeOnCurrentView(e);
    });
  }

  setStatusEdgeOnCurrentView(sOptions) {
    const {id, source: {y: ySrc, idSvg: svgSrc}, target: {y: yDes, idSvg: svgDes}} = sOptions;
    const pointSrcToTop = ySrc - $(`#${svgSrc}`).scrollTop();
    const pointDesToTop = yDes - $(`#${svgDes}`).scrollTop();
    const node = d3.select(`#${id}`);
    if ((pointSrcToTop > this.limitTop && pointSrcToTop < this.limitBottom) && (pointDesToTop > this.limitTop && pointDesToTop < this.limitBottom)) {
      if (node.node()) {
        d3.select(node.node().parentNode).classed('hide-edge-on-parent-scroll', false);
      }
    } else {
      if (node.node()) {
        d3.select(node.node().parentNode).classed('hide-edge-on-parent-scroll', true);
      }
    }
  }

  /**
   * Find and update position connect to vertex when in move
   * @param vertexInfo
   * @param idSvg
   */
  updatePathConnect(vertexInfo, idSvg) {
    const {x, y, id} = vertexInfo;

    // Find edge start from this vertex
    const arrSrcPaths = _.filter(this.storeConnect.edge, (e) => {
      return e.source.vertexId === id;
    });
    // Find edge end at this vertex
    const arrDesPaths = _.filter(this.storeConnect.edge, (e) => {
      return e.target.vertexId === id;
    });

    arrSrcPaths.forEach(src => {
      let edgeId = src.id;
      let prop = src.source.prop;
      let newPos = this.objectUtils.getCoordPropRelativeToParent({x, y, id}, prop, TYPE_CONNECT.OUTPUT, idSvg);
      src.source.x = newPos.x;
      src.source.y = newPos.y;
      let options = {source: src.source};
      this.connectMgmt.updatePathConnect(edgeId, options);
      this.setStatusEdgeOnCurrentView(src);
    });

    arrDesPaths.forEach(des => {
      let edgeId = des.id;
      let prop = des.target.prop;
      let newPos = this.objectUtils.getCoordPropRelativeToParent({x, y, id}, prop, TYPE_CONNECT.INPUT, idSvg);
      des.target.x = newPos.x;
      des.target.y = newPos.y;
      let options = {target: des.target};
      this.connectMgmt.updatePathConnect(edgeId, options);
      this.setStatusEdgeOnCurrentView(des);
    });
  }

  /* Vertex utils (S)*/
  /**
   * Find all path (edge, connect) with source from this vertex
   * @param vertexId: string, required
   */
  findEdgeStartFromVertex(vertexId) {
    if (!vertexId)
      return [];

    return _.filter(this.storeConnect.edge, (e) => {
        return e.source.vertexId === vertexId;
      }
    );
  }

  /**
   * Find all path (edge, connect) with target at this vertex
   * @param vertexId: string, required
   */
  findEdgeConnectToVertex(vertexId) {
    if (!vertexId)
      return [];

    return _.filter(this.storeConnect.edge, (e) => {
        return e.target.vertexId === vertexId;
      }
    );
  }

  /**
   * Find all path (edge, connect) start or end at this vertex
   * @param vertexId
   * @returns {Array}
   */
  findEdgeRelateToVertex(vertexId) {
    if (!vertexId)
      return [];

    return _.filter(this.storeConnect.edge, (e) => {
        return e.target.vertexId === vertexId || e.source.vertexId === vertexId;
      }
    );
  }

  hideEdgeOnBoundaryMemberVisibleClick(id, flag) {
    // Find all edge relate
    let edges = _.filter(this.storeConnect.edge, e => {
      return e.source.vertexId === id || e.target.vertexId === id;
    });

    edges.forEach(e => {
      let node = d3.select(`#${e.id}`);
      if (node.node())
        d3.select(node.node().parentNode).classed('hide-edge-on-menu-items', !flag);
    });
  }

  initListenerOnWindowResize() {
    $(window).resize(() => {
      this.updatePathConnectOnWindowResize();
    });
  }

  updatePathConnectOnWindowResize() {
    const edges = this.storeConnect.edge;
    const vertices = this.storeInputMessage.vertex.concat(this.storeOperations.vertex).concat(this.storeOutputMessage.vertex);

    edges.forEach(e => {
      const {source: {vertexId: idSrc, prop: propSrc}, id: edgeId, target: {vertexId: idDes, prop: propDes}} = e;
      let {x: sX, y: sY, idSvg: sIdSvg} = _.find(vertices, {'id': idSrc});
      let {x: newSX, y: newSY} = this.objectUtils.getCoordPropRelativeToParent({id: idSrc, x: sX, y: sY}, propSrc, TYPE_CONNECT.OUTPUT, sIdSvg);
      e.source.x = newSX;
      e.source.y = newSY;

      let {x: dX, y: dY, idSvg: dIdSvg} = _.find(vertices, {'id': idDes});
      let {x: newDX, y: newDY} = this.objectUtils.getCoordPropRelativeToParent({id: idDes, x: dX, y: dY}, propDes, TYPE_CONNECT.INPUT, dIdSvg);
      e.target.x = newDX;
      e.target.y = newDY;

      let options = {source: e.source, target: e.target};
      this.connectMgmt.updatePathConnect(edgeId, options);
    });
  }

  /**
   * Remove edge that lost prop connect on vertex edit
   * @param id
   */
  removeEdgeLostPropOnVertex(id) {
    // Find edge start from this vertex
    const arrSrcPaths = _.filter(this.storeConnect.edge, (e) => {
      return e.source.vertexId === id;
    });
    // Find edge end at this vertex
    const arrDesPaths = _.filter(this.storeConnect.edge, (e) => {
      return e.target.vertexId === id;
    });

    arrSrcPaths.forEach(src => {
      const {id, source: {prop, vertexId}} = src;

      if(this.objectUtils.findIndexPropInVertex(vertexId, prop) === null)
        this.connectMgmt.removeEdge(id);
    });

    arrDesPaths.forEach(des => {
      const {id, target: {prop, vertexId}} = des;

      if(this.objectUtils.findIndexPropInVertex(vertexId, prop) === null)
        this.connectMgmt.removeEdge(id);
    });
  }
};
export default MainMgmt;
