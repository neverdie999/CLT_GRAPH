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
  comShowMessage,
  createPath,
  setMinBoundaryGraph,
} from '../../common/utilities/common.ult';

class MainMgmt {
  constructor(props) {
    this.storeConnect = props.storeConnect;
    this.storeInputMessage = props.storeInputMessage;
    this.storeOperations = props.storeOperations;
    this.storeOutputMessage = props.storeOutputMessage;

    this.isCreatingEdge = false;
    this.tmpSource = null;
    this.initialize();
  }

  initialize() {
    this.windowHeight = $(window).height();
    this.limitTop = 0;
    this.limitBottom = this.windowHeight;

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

    this.connectMgmt = new ConnectMgmt({
      storeConnect: this.storeConnect,
      mainMgmt: this,
      storeInputMessage: this.storeInputMessage,
      storeOperations: this.storeOperations,
      storeOutputMessage: this.storeOutputMessage,

    });

    this.inputMgmt = new InputMgmt({
      mainMgmt: this,
      edgeMgmt: this.connectMgmt.edgeMgmt,
      storeInputMessage: this.storeInputMessage,
      inputDefined: this.inputDefined,
    });

    this.outputMgmt = new OutputMgmt({
      mainMgmt: this,
      edgeMgmt: this.connectMgmt.edgeMgmt,
      storeOutputMessage: this.storeOutputMessage,
      outputDefined: this.outputDefined,
    });

    this.operationsMgmt = new OperationsMgmt({
      mainMgmt: this,
      edgeMgmt: this.connectMgmt.edgeMgmt,
      storeOperations: this.storeOperations,
      operationsDefined: this.operationsDefined,
      objectUtils: this.objectUtils
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
    if (option === "DATA_INPUT_MESSAGE") {
      await this.handleDataInputMessage(data);

    }else if (option === "DATA_OUTPUT_MESSAGE") {
      await this.handleDataOutputMessage(data);

    }else if (option === "DATA_VERTEX_DEFINE_OPERATIONS") {
      await this.handleDataVertexDefineOperations(data);

    }else if (option === "DATA_MESSAGE_MAPPING_DEFINITION") {
      await this.handleDataMessageMappingDefinition(data);
    }
  }

  /**
   * Import data as "Input Message" type
   * @param {*} data 
   */
  async handleDataInputMessage(data) {

    let resMessage = await this.validateGraphDataStructure(data);

    if(resMessage != "ok"){
      comShowMessage("Format or data in Data Graph Structure is corrupted. You should check it!");

      if(resMessage == "error")
        return;
    }

    let isError = this.validatesSameGraph(data, "I");
    if( isError ){
      comShowMessage("There was duplicate data with Output graph.\nYou should check it or choose another one!");
      return;
    }

    //clear data
    this.connectMgmt.clearInputEdges();
    this.inputMgmt.clearAll();

    //Reload Vertex Define and draw graph
    const {vertexTypes} = data;
    this.processDataVertexTypeDefine(vertexTypes, this.inputDefined);
    this.inputMgmt.drawObjectsOnInputGraph(data);

    setMinBoundaryGraph(this.inputMgmt.storeInputMessage,ID_SVG_INPUT_MESSAGE);
  }

  /**
   * Import data as "Onput Message" type
   * @param {*} data 
   */
  async handleDataOutputMessage(data) {
    const {vertexTypes} = data;

    let resMessage = await this.validateGraphDataStructure(data);

    if(resMessage != "ok"){
      comShowMessage("Format or data in Data Graph Structure is corrupted. You should check it!");

      if(resMessage == "error")
        return;
    }

    let isError= await this.validatesSameGraph(data, "O");
    if( isError ){
      comShowMessage("There was duplicate data with Iutput graph.\nYou should check it or choose another one!");
      return;
    }

    //clear data
    this.connectMgmt.clearOutputEdges();
    this.outputMgmt.clearAll();

    //Reload Vertex Define and draw graph
    await this.processDataVertexTypeDefine(vertexTypes, this.outputDefined);
    await this.outputMgmt.drawObjectsOnOutputGraph(data);

    setMinBoundaryGraph(this.outputMgmt.storeOutputMessage,ID_SVG_OUTPUT_MESSAGE);
  }

  async handleDataEdges(data){
    await this.connectMgmt.drawEdgeOnConnectGraph(data);
  }

  /**
   * Import as "Vertex Define Options" type
   * @param {*} data 
   */
  async handleDataVertexDefineOperations(data) {
    //Validate data struct
    let errorContent = await this.validateVertexDefineStructure(data);
    if (errorContent){
      comShowMessage("Format or data in Data Graph Structure is corrupted. You should check it!");
      return;
    }

    //Reload Vertex Define and init main menu
    await this.processDataVertexTypeDefine(data, this.operationsDefined);
    this.operationsMgmt.initMenuContext();
  }

  /**
   * Import data as "Message Mapping Definition" Type
   * @param {*} data 
   */
  async handleDataMessageMappingDefinition(data) {
    const {inputMessage, outputMessage, operations, edges} = data;

     //Validate Input data
    let resMessage = await this.validateGraphDataStructure(inputMessage);

    if(resMessage != "ok"){
      comShowMessage("Input Message: Format or data in Data Graph Structure is corrupted. You should check it!");

      if(resMessage == "error")
        return;
    }

   //Validate Output data
    resMessage = await this.validateGraphDataStructure(outputMessage);

    if(resMessage != "ok"){
      comShowMessage("Output Message: Format or data in Data Graph Structure is corrupted. You should check it!");

      if(resMessage == "error")
        return;
    }

    //Validate Operations data
    resMessage = await this.validateGraphDataStructure(operations);

    if(resMessage != "ok"){
      comShowMessage("Operations Message: Format or data in Data Graph Structure is corrupted. You should check it!");

      if(resMessage == "error")
        return;
    }

    //Clear all data
    this.inputMgmt.clearAll();
    this.operationsMgmt.clearAll();
    this.outputMgmt.clearAll();
    this.connectMgmt.clearAll();

    //Input Graph - Reload Vertex define and draw new graph
    let vertexTypes = inputMessage.vertexTypes;
    await this.processDataVertexTypeDefine(vertexTypes, this.inputDefined);
    await this.inputMgmt.drawObjectsOnInputGraph(inputMessage);

    //Output Graph - Reload Vertex define and draw new graph
    vertexTypes = {};
    vertexTypes = outputMessage.vertexTypes;
    await this.processDataVertexTypeDefine(vertexTypes, this.outputDefined);
    await this.outputMgmt.drawObjectsOnOutputGraph(outputMessage);

    //Operations Graph - Reload Vertex define and draw new graph.
    vertexTypes = {};
    vertexTypes = operations.vertexTypes;
    await this.processDataVertexTypeDefine(vertexTypes, this.operationsDefined);
    await this.operationsMgmt.drawObjectsOnOperationsGraph(operations);
    this.operationsMgmt.initMenuContext();
    
    //Draw edges
    this.handleDataEdges(edges);

    setMinBoundaryGraph(this.storeInputMessage,ID_SVG_INPUT_MESSAGE);
    setMinBoundaryGraph(this.storeOutputMessage,ID_SVG_OUTPUT_MESSAGE);
    setMinBoundaryGraph(this.storeOperations,ID_SVG_OPERATIONS);

    //Solve in case of save and import from different window size
    this.updatePathConnectOnWindowResize();

    //Solve in case of save and import from different scroll position
    this.onContainerSvgScroll(ID_SVG_OPERATIONS);
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

  initListenerContainerSvgScroll() {
    $(`#${ID_CONTAINER_INPUT_MESSAGE}, #${ID_CONTAINER_OPERATIONS}, #${ID_CONTAINER_OUTPUT_MESSAGE}`).on('scroll', (e) => {

      if (this.connectMgmt.edgeMgmt.isSelectingEdge()){
        this.connectMgmt.edgeMgmt.cancelSelectingEdge();
      }
      let ref = $(e.target).attr("ref");
      this.onContainerSvgScroll(ref);
    });
  }

  onContainerSvgScroll(ref) {
    let vertices = this.storeInputMessage.vertex.concat(this.storeOperations.vertex).concat(this.storeOutputMessage.vertex);
    // Find edge start from this SVG
    const srcEdges = _.filter(this.storeConnect.edge, (e) => {
      return e.source.svgId === ref;
    });
    // Find edge end at this SVG
    const desEdges = _.filter(this.storeConnect.edge, (e) => {
      return e.target.svgId === ref;
    });

    srcEdges.forEach(e => {
      const {source: {vertexId: id, prop}} = e;
      let {x, y, svgId} = _.find(vertices, {'id': id});
      let {x: propX, y: propY} = this.objectUtils.getCoordPropRelativeToParent({
        id,
        x,
        y
      }, prop, TYPE_CONNECT.OUTPUT, svgId);
      e.source.x = propX;
      e.source.y = propY;
      let options = {source: e.source};
      e.updatePathConnect(options);
      e.setStatusEdgeOnCurrentView();
    });

    desEdges.forEach(e => {
      const {target: {vertexId: id, prop}} = e;
      let {x, y, svgId} = _.find(vertices, {'id': id});
      let {x: propX, y: propY} = this.objectUtils.getCoordPropRelativeToParent({
        id,
        x,
        y
      }, prop, TYPE_CONNECT.INPUT, svgId);
      e.target.x = propX;
      e.target.y = propY;
      let options = {target: e.target};
      e.updatePathConnect(options);
      e.setStatusEdgeOnCurrentView();
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
      const {source: {vertexId: idSrc, prop: propSrc}, target: {vertexId: idDes, prop: propDes}} = e;
      let {x: sX, y: sY, svgId: sIdSvg} = _.find(vertices, {'id': idSrc});
      let {x: newSX, y: newSY} = this.objectUtils.getCoordPropRelativeToParent({id: idSrc, x: sX, y: sY}, propSrc, TYPE_CONNECT.OUTPUT, sIdSvg);
      e.source.x = newSX;
      e.source.y = newSY;

      let {x: dX, y: dY, svgId: dIdSvg} = _.find(vertices, {'id': idDes});
      let {x: newDX, y: newDY} = this.objectUtils.getCoordPropRelativeToParent({id: idDes, x: dX, y: dY}, propDes, TYPE_CONNECT.INPUT, dIdSvg);
      e.target.x = newDX;
      e.target.y = newDY;

      let options = {source: e.source, target: e.target};
      e.updatePathConnect(options);
    });
  }

    /**
   * Validate Graph Data Structure
   * with embedded vertex type
   * Validate content
   */
  async validateGraphDataStructure(data) {
    //Validate data exists
    if(data===undefined)
    {
      console.log("Data does not exist");
      return Promise.resolve("error");
    }

    // Validate struct data
    if (!data.vertex || !data.boundary || !data.position || !data.vertexTypes ||
      (Object.keys(data.vertexTypes).length === 0 && data.vertexTypes.constructor === Object)) {
      console.log("Data Graph Structure is corrupted. You should check it!");
      return Promise.resolve("error");
    }

    // Validate embedded vertex type with vertices
    let dataTypes = data.vertexTypes['VERTEX'];
    let vertices = this.removeDuplicates(data.vertex, "vertexType");
    let types = this.getListVertexType(dataTypes);
    for (let vertex of vertices) {

      let type = vertex.vertexType;
      // If vertex type not exit in embedded vertex type
      if (types.indexOf(type) < 0) {
        console.log("[Graph Data Structure] Vertex type not exits in embedded vertex type");
        return Promise.resolve("warning");
      }

      // Validate data key between embedded vertex and vetex in graph.
      let dataSource = vertex.data;
      let dataTarget = _.find(dataTypes, {'vertexType': type});
      let keySource = Object.keys(dataSource[0] || {});
      let keyTarget = Object.keys(dataTarget.data[0] || {});

      // Check length key
      if (this.checkLengthMisMatch(keySource, keyTarget)) {
        console.log("[Graph Data Structure] Data's length is different");
        return Promise.resolve("warning");
      }

      // Check mismatch key
      let flag = await this.checkKeyMisMatch(keySource, keyTarget);

      if (flag) {
        console.log("[Graph Data Structure] Key vertex at source not exit in target");
        return Promise.resolve("warning");
      }
    }

    return Promise.resolve("ok");
  }

  /**
   * Validate Vertex Define Structure
   */
  async validateVertexDefineStructure(data) {

    //Validate data exists
    if(data===undefined)
    {
      return Promise.resolve(true);
    }

    // Option vertex type definition but choose graph type file
    if (data.vertex || data.edge || data.boundary || data.position || data.vertexTypes) {
      return Promise.resolve(true);
    }

    // Option vertex type definition but choose mapping type file
    if (data.inputMessage||data.operations||data.outputMessage||data.edges){
      return Promise.resolve(true);
    }
  }

  /**
   * Removing Duplicate Objects From An Array By Property
   * @param myArr
   * @param prop
   * @author: Dwayne
   * @reference: https://ilikekillnerds.com/2016/05/removing-duplicate-objects-array-property-name-javascript/
   */
  removeDuplicates(myArr, prop) {
    return myArr.filter((obj, pos, arr) => {
      return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
    });
  }

  /**
   * get list vertex type of graph
   * @param array data
   * @returns {*}
   */
  getListVertexType(data) {
    let types = [];
    let len = data.length;
    for (let i = 0; i < len; i++) {
      let type = data[i];
      types.push(type.vertexType);
    }

    return types;
  }

  /**
   * Check length of source and target is match
   * @param src
   * @param tgt
   * @returns {boolean}
   */
  checkLengthMisMatch(src, tgt) {
    return src.length != tgt.length ? true : false;
  }

  /**
   * Check key of source and target is match
   * @param src
   * @param tgt
   * @returns {boolean}
   */
  checkKeyMisMatch(src, tgt) {
    let misMatch = false;
    src.forEach(key => {
      if (tgt.indexOf(key) < 0) {
        misMatch = true;
      }
    });

    return Promise.resolve(misMatch);
  }

  /**
   * Check duplicate data when import Input or Output graph
   * @param dataContainer the data of current graph
   * @param type type current graph (Input: "I", Output: "O")
   */
  validatesSameGraph(dataContainer, type){

    //Variable to store data of the other
    let tmpDataContainer = {};

    if(type == "I"){
      tmpDataContainer = this.storeOutputMessage;
    }else{
      tmpDataContainer = this.storeInputMessage;
    }

    //Check duplicate Vertex ID between Input and Output
    if (tmpDataContainer.vertex.length > 0){
      for (let vertext1 of dataContainer.vertex){
        for (let vertext2 of tmpDataContainer.vertex){
          if(vertext1.id === vertext2.id)
            return true;
        }
      }
    }

    //Check duplicate Boundary ID between Input and Output
    if(tmpDataContainer.boundary.length > 0){
      for (let boudary1 of dataContainer.boundary){
        for (let boudary2 of tmpDataContainer.boundary){
          if(boudary1.id === boudary2.id)
            return true;
        }
      }
    }

   return false;
  }
};
export default MainMgmt;