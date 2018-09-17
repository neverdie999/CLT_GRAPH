import * as d3 from 'd3';
import _ from 'lodash';
import InputMgmt from './input-mgmt/input-mgmt';
import OutputMgmt from './output-mgmt/output-mgmt';
import OperationsMgmt from './operations-mgmt/operations-mgmt';
import ConnectMgmt from './connect-mgmt/connect-mgmt';
import ObjectUtils from '../../common/utilities/object.ult';

import {
  comShowMessage,
  setMinBoundaryGraph,
  disableHorizontalScroll,
} from '../../common/utilities/common.ult';

import { 
  VERTEX_FORMAT_TYPE
} from '../../common/const/index';


class CltMessageMapping {
  constructor(props) {
    this.selector     = props.selector;
    this.selectorName = this.selector.selector.replace(/[\.\#]/,'');

    this.inputMessageContainerId  = `inputMessageContainer_${this.selectorName}`;
    this.inputMessageSvgId        = `inputMessageSvg_${this.selectorName}`;
    this.outputMessageContainerId = `outputMessageContainer_${this.selectorName}`;
    this.outputMessageSvgId       = `outputMessageSvg_${this.selectorName}`;
    this.operationsContainerId    = `operationsContainer_${this.selectorName}`;
    this.operationsSvgId          = `operationsSvg_${this.selectorName}`;
    this.connectSvgId             = `connectSvg_${this.selectorName}`;

    this.initialize();
  }

  initialize() {

   disableHorizontalScroll();

    this.objectUtils = new ObjectUtils();
    this.initSvgHtml();

    this.storeConnect = {
      edge: [],
    };
    this.storeInputMessage = {
      vertex: [],
      boundary: [],
    };
    this.storeOperations = {
      vertex: [],
      boundary: [],
    };
    this.storeOutputMessage = {
      vertex: [],
      boundary: [],
    };

    this.connectMgmt = new ConnectMgmt({
      mainSelector: this.selector,
      svgId: this.connectSvgId,
      storeConnect: this.storeConnect,
      storeInputMessage: this.storeInputMessage,
      storeOperations: this.storeOperations,
      storeOutputMessage: this.storeOutputMessage,

    });

    this.inputMgmt = new InputMgmt({
      mainSelector: this.selector,
      containerId: this.inputMessageContainerId,
      svgId: this.inputMessageSvgId,
      edgeMgmt: this.connectMgmt.edgeMgmt,
      dataContainer: this.storeInputMessage
    });

    this.outputMgmt = new OutputMgmt({
      mainSelector: this.selector,
      containerId: this.outputMessageContainerId,
      svgId: this.outputMessageSvgId,
      edgeMgmt: this.connectMgmt.edgeMgmt,
      dataContainer: this.storeOutputMessage
    });

    this.operationsMgmt = new OperationsMgmt({
      mainSelector: this.selector,
      containerId: this.operationsContainerId,
      svgId: this.operationsSvgId,
      edgeMgmt: this.connectMgmt.edgeMgmt,
      dataContainer: this.storeOperations
    });

    this.initCustomFunctionD3();
    this.objectUtils.initListenerContainerScroll(this.inputMessageContainerId, this.connectMgmt.edgeMgmt, [this.storeInputMessage, this.storeOperations, this.storeOutputMessage]);
    this.objectUtils.initListenerContainerScroll(this.operationsContainerId, this.connectMgmt.edgeMgmt, [this.storeInputMessage, this.storeOperations, this.storeOutputMessage]);
    this.objectUtils.initListenerContainerScroll(this.outputMessageContainerId, this.connectMgmt.edgeMgmt, [this.storeInputMessage, this.storeOperations, this.storeOutputMessage]);
    this.initListenerOnWindowResize();
    this.initOnMouseUpBackground();
  };

  initSvgHtml(){
    let sHtml = 
    `<div id="${this.inputMessageContainerId}" class="left-svg container-svg" ref="${this.inputMessageSvgId}">
        <svg id="${this.inputMessageSvgId}" class="svg"></svg>
      </div>
      <div id="${this.operationsContainerId}" class="middle-svg container-svg" ref="${this.operationsSvgId}">
        <svg id="${this.operationsSvgId}" class="svg"></svg>
      </div>
      <div id="${this.outputMessageContainerId}" class="right-svg container-svg" ref="${this.outputMessageSvgId}">
        <svg id="${this.outputMessageSvgId}" class="svg"></svg>
      </div>
      <svg id="${this.connectSvgId}" class="connect-svg"></svg>`;

    this.selector.append(sHtml);
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

  initListenerOnWindowResize() {
    $(window).resize(() => {

      if(this.connectMgmt.edgeMgmt.isSelectingEdge()){
        this.connectMgmt.edgeMgmt.cancleSelectedPath();
      }

      this.inputMgmt.setCenterAlignmentGarph();
      this.outputMgmt.setCenterAlignmentGarph();
      
      this.objectUtils.updatePathConnectOnWindowResize(this.connectMgmt.edgeMgmt, [this.storeInputMessage, this.storeOperations, this.storeOutputMessage]);
    });
  }

  initOnMouseUpBackground() {
    let selector = this.selector.prop("id");

    if (selector == ""){
      selector = `.${this.selector.prop("class")}`;
    }else{
      selector = `#${selector}`;
    }
    
    let tmpEdgeMgmt = this.connectMgmt.edgeMgmt;
    d3.select(selector).on("mouseup", function(){
      let mouse = d3.mouse(this);
      let elem = document.elementFromPoint(mouse[0], mouse[1]);

      //disable selecting effect if edge is selecting
      if((!elem || !elem.tagName || elem.tagName != 'path') && tmpEdgeMgmt.isSelectingEdge()) {
        tmpEdgeMgmt.cancleSelectedPath();
      }
    })
  }

  async LoadInputMessage(graphData){
    
    let resMessage = await this.validateGraphDataStructure(graphData);

    if(resMessage != "ok"){
      comShowMessage("Format or data in Data Graph Structure is corrupted. You should check it!");

      if(resMessage == "error")
        return;
    }

    let isError = this.validatesSameGraph(graphData, "I");
    if( isError ){
      comShowMessage("There was duplicate data with Output graph.\nYou should check it or choose another one!");
      return;
    }

    //clear data
    this.connectMgmt.clearInputEdges();
    this.inputMgmt.clearAll();

    //Reload Vertex Define and draw graph
    const {vertexTypes} = graphData;
    this.inputMgmt.processDataVertexTypeDefine(vertexTypes);
    this.inputMgmt.drawObjectsOnInputGraph(graphData);
    this.inputMgmt.initMenuContext();

    setMinBoundaryGraph(this.storeInputMessage,this.inputMessageSvgId);
  }

  async LoadOutputMessage(graphData){
    const {vertexTypes} = graphData;

    let resMessage = await this.validateGraphDataStructure(graphData);

    if(resMessage != "ok"){
      comShowMessage("Format or data in Data Graph Structure is corrupted. You should check it!");

      if(resMessage == "error")
        return;
    }

    let isError= await this.validatesSameGraph(graphData, "O");
    if( isError ){
      comShowMessage("There was duplicate data with Iutput graph.\nYou should check it or choose another one!");
      return;
    }

    //clear data
    this.connectMgmt.clearOutputEdges();
    this.outputMgmt.clearAll();

    //Reload Vertex Define and draw graph
    await this.outputMgmt.processDataVertexTypeDefine(vertexTypes);
    await this.outputMgmt.drawObjectsOnOutputGraph(graphData);
    this.outputMgmt.initMenuContext();

    setMinBoundaryGraph(this.storeOutputMessage,this.outputMessageSvgId);
  }

  async LoadMesseageMapping(messageMappingData){
    const {inputMessage, outputMessage, operations, edges} = messageMappingData;

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
    await this.inputMgmt.processDataVertexTypeDefine(vertexTypes);
    await this.inputMgmt.drawObjectsOnInputGraph(inputMessage);
    this.inputMgmt.initMenuContext();

    //Output Graph - Reload Vertex define and draw new graph
    vertexTypes = {};
    vertexTypes = outputMessage.vertexTypes;
    await this.outputMgmt.processDataVertexTypeDefine(vertexTypes);
    await this.outputMgmt.drawObjectsOnOutputGraph(outputMessage);
    this.outputMgmt.initMenuContext();

    //Operations Graph - Reload Vertex define and draw new graph.
    vertexTypes = {};
    vertexTypes = operations.vertexTypes;
    await this.operationsMgmt.processDataVertexTypeDefine(vertexTypes);
    await this.operationsMgmt.drawObjectsOnOperationsGraph(operations);
    this.operationsMgmt.initMenuContext();
    
    //Draw edges
    this.edgeVerifySvgId(edges);
    await this.connectMgmt.drawEdgeOnConnectGraph(edges);

    setMinBoundaryGraph(this.storeInputMessage,this.inputMessageSvgId);
    setMinBoundaryGraph(this.storeOutputMessage,this.outputMessageSvgId);
    setMinBoundaryGraph(this.storeOperations,this.operationsSvgId);

    //Solve in case of save and import from different window size
    await this.objectUtils.updatePathConnectOnWindowResize(this.connectMgmt.edgeMgmt, [this.storeInputMessage, this.storeOperations, this.storeOutputMessage]);
  }

  save(fileName) {

    if (!fileName) {
      comShowMessage("Please input file name");
      return;
    }

    this.getContentGraphAsJson().then(content => {
      if (!content) {
        comShowMessage("No content to export");
        return;
      }
      // stringify with tabs inserted at each level
      let graph = JSON.stringify(content, null, "\t");
      let blob = new Blob([graph], {type: "application/json", charset: "utf-8"});

      if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, fileName);
        return;
      }

      let fileUrl = window.URL.createObjectURL(blob);
      let downLink = $('<a>');
      downLink.attr("download", `${fileName}.json`);
      downLink.attr("href", fileUrl);
      downLink.css("display", "none");
      $("body").append(downLink);
      downLink[0].click();
      downLink.remove();
    }).catch(err => {
      comShowMessage(err);
    });
  }

  LoadOperationsVertexDefinition(vertexDefinitionData){
    if (this.operationsMgmt.LoadVertexDefinition(vertexDefinitionData)) {
      this.operationsMgmt.initMenuContext();
    }
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

  getContentGraphAsJson() {
    let dataContent = {inputMessage: {}, outputMessage: {}, operations: {}, edges: []};

    let inputMessage  = {vertex: [], boundary: [],position: [], vertexTypes: {}};
    let outputMessage = {vertex: [], boundary: [],position: [], vertexTypes: {}};
    let operations    = {vertex: [], boundary: [],position: [], vertexTypes: {}};

    if (this.isEmptyContainerData(this.storeInputMessage)){
      return Promise.reject("There is no Input data. Please import!");
    } 
    if (this.isEmptyContainerData(this.storeOutputMessage)){
      return Promise.reject("There is no Output data. Please import!");
    } 
    if (this.isEmptyContainerData(this.storeOperations)){
      return Promise.reject("There is no Operations data!");
    } 

    // Process data to export
    // Need clone data cause case user export
    // later continue edit then lost parent scope
    // Purpose prevent reference data.

    //Input data
    const cloneInputData = _.cloneDeep(this.storeInputMessage);
    cloneInputData.vertex.forEach(vertex => {
      let pos = new Object({
        "id": vertex.id,
        "x": vertex.x,
        "y": vertex.y
      });

      inputMessage.vertex.push(this.getSaveDataVertex(vertex));
      inputMessage.position.push(pos);
    });

    cloneInputData.boundary.forEach(boundary => {
      let pos = new Object({
        "id": boundary.id,
        "x": boundary.x,
        "y": boundary.y
      });

      inputMessage.boundary.push(this.getSaveDataBoundary(boundary));
      inputMessage.position.push(pos);
    });

    const cloneVertexInputDefine = _.cloneDeep(this.inputMgmt.vertexMgmt.vertexDefinition);

    let inputVertexDefine = {};
    if(cloneVertexInputDefine.vertexGroup){
      inputVertexDefine = {
        "VERTEX_GROUP": this.getSaveVertexGroup(cloneVertexInputDefine.vertexGroup),
        "VERTEX": cloneVertexInputDefine.vertex
      };
    }
    inputMessage.vertexTypes = inputVertexDefine;

    //Output data

    const cloneOutputData = _.cloneDeep(this.storeOutputMessage);
    cloneOutputData.vertex.forEach(vertex => {
      let pos = new Object({
        "id": vertex.id,
        "x": vertex.x,
        "y": vertex.y
      });

      outputMessage.vertex.push(this.getSaveDataVertex(vertex));
      outputMessage.position.push(pos);
    });

    cloneOutputData.boundary.forEach(boundary => {
      let pos = new Object({
        "id": boundary.id,
        "x": boundary.x,
        "y": boundary.y
      });

      outputMessage.boundary.push(this.getSaveDataBoundary(boundary));
      outputMessage.position.push(pos);
    });

    const cloneVertexOutputDefine = _.cloneDeep(this.outputMgmt.vertexMgmt.vertexDefinition);

    let outputVertexDefine = {};
    if(cloneVertexOutputDefine.vertexGroup){
      outputVertexDefine = {
        "VERTEX_GROUP": this.getSaveVertexGroup(cloneVertexOutputDefine.vertexGroup),
        "VERTEX": cloneVertexOutputDefine.vertex
      };
    }
    outputMessage.vertexTypes = outputVertexDefine;

    //Operations data
    const cloneOperationsData = _.cloneDeep(this.storeOperations);
    cloneOperationsData.vertex.forEach(vertex => {
      let pos = new Object({
        "id": vertex.id,
        "x": vertex.x,
        "y": vertex.y
      });

      operations.vertex.push(this.getSaveDataVertex(vertex));
      operations.position.push(pos);
    });

    cloneOperationsData.boundary.forEach(boundary => {
      let pos = new Object({
        "id": boundary.id,
        "x": boundary.x,
        "y": boundary.y
      });

      operations.boundary.push(this.getSaveDataBoundary(boundary));
      operations.position.push(pos);
    });

    const cloneVertexOperationDefine = _.cloneDeep(this.operationsMgmt.vertexMgmt.vertexDefinition);
    let operationVertexDefine = {};
    if(cloneVertexOperationDefine.vertexGroup){
      operationVertexDefine = {
        "VERTEX_GROUP": this.getSaveVertexGroup(cloneVertexOperationDefine.vertexGroup),
        "VERTEX": cloneVertexOperationDefine.vertex
      };
    }
    operations.vertexTypes = operationVertexDefine;

    //Edges    
    let edges = [];
    const cloneEdgesData = _.cloneDeep(this.storeConnect);
    cloneEdgesData.edge.forEach(edge => {
      edges.push(this.getSaveDataEdge(edge));
    })

    //Data content
    dataContent.inputMessage = inputMessage;
    dataContent.outputMessage = outputMessage;
    dataContent.operations = operations;
    dataContent.edges = edges;

    return Promise.resolve(dataContent);
  }

  /**
   * Filter properties that need to save
   * @param {*} boundary 
   */
  getSaveDataBoundary(boundary){
    return {
      name: boundary.name,
      description: boundary.description,
      member: boundary.member,
      id: boundary.id,
      width: boundary.width,
      height: boundary.height,
      parent: boundary.parent,
      mandatory: boundary.mandatory,
      repeat: boundary.repeat,
      svgId: boundary.svgId
    };
  }

  /**
   * Filter properties that need to save
   * @param {*} vertex 
   */
  getSaveDataVertex(vertex){
    return {
      vertexType: vertex.vertexType,
      name: vertex.name,
      description: vertex.description,
      data: vertex.data,
      id: vertex.id,
      groupType: vertex.groupType,
      parent: vertex.parent,
      mandatory: vertex.mandatory,
      repeat: vertex.repeat,
      svgId: vertex.svgId
    };
  }

  /**
   * Filter properties that need to save
   * @param {*} edge 
   */
  getSaveDataEdge(edge){
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      note: {
        originNote: edge.originNote,
        middleNote: edge.middleNote,
        destNote: edge.destNote,

      },
      style:{
        line: edge.lineType,
        arrow: edge.useMarker
      }
    };
  }

  isEmptyContainerData(containerData){
    return (containerData.vertex.length == 0 && containerData.boundary.length == 0)
  }

  /**
   * If loading from another svgId, then correct by curent svgId
   */
  edgeVerifySvgId(edges){
    if (edges.length > 0){
      let oldSvgId = edges[0].source.svgId;
      let index = edges[0].source.svgId.indexOf('_');
      let oldSelectorName = oldSvgId.substring(index + 1, oldSvgId.length);

      if (oldSelectorName != this.selectorName){
        edges.forEach(e => {
          e.source.svgId = e.source.svgId.replace(oldSelectorName, this.selectorName);
          e.target.svgId = e.target.svgId.replace(oldSelectorName, this.selectorName);
        });
      }
    }
  }

  /**
   * Filter properties that need to save
   * @param {*} vertexGroup 
   */
  getSaveVertexGroup(vertexGroup){
    let resObj = [];

    vertexGroup.forEach(group => {
      let tmpGroup = {};

      tmpGroup.groupType          = group.groupType;
      tmpGroup.option             = group.option;
      tmpGroup.dataElementFormat  = group.dataElementFormat;
      tmpGroup.vertexPresentation = group.vertexPresentation;

      resObj.push(tmpGroup);
    })
    
    return resObj;
  }
}
  
export default CltMessageMapping;
