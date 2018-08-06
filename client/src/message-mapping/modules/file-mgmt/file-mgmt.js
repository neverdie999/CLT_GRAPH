import{
  COMMON_DATA,
} from '../../const/index';
import {readDataFileJson, comShowMessage} from '../../common/utilities/common.ult'

const ID_FOLDER_OPEN_FILE_MGMT = 'folderOpenFileMgmt';
const ID_CONTAINER_FILE_MGMT = 'containerFileMgmt';
const ID_OPTION_FILE_TYPE_INPUT = 'optionFileTypeInput';
const ID_INPUT_FILE_DATA = 'inputFileData';
const GROUP_OPTION_MODE_GRAPH = 'input:radio[name=graphMode]';
const ID_OUTPUT_FILE_NAME = 'outputFileName';
const ID_BUTTON_DOWNLOAD_FILE = 'btnDownloadFile';

class FileMgmt {
  constructor(props) {
    this.mainMgmt = props.mainMgmt;
    this.storeInputMessage = props.storeInputMessage,
    this.storeOperations = props.storeOperations,
    this.storeOutputMessage = props.storeOutputMessage,
    this.inputDefined = props.inputDefined,
    this.outputDefined = props.outputDefined,
    this.operationsDefined = props.operationsDefined,
    this.initialize();
  }

  initialize() {
    this.bindEventListenerToControls();
  }

  bindEventListenerToControls() {
    $(`#${ID_FOLDER_OPEN_FILE_MGMT}`).click(() => {
      $(`#${ID_CONTAINER_FILE_MGMT}`).slideToggle();
    });

    $(`#${ID_INPUT_FILE_DATA}`).change((event) => {
      this.readJsonFile(event);
    });

    // Handle event click on button Download
    $(`#${ID_BUTTON_DOWNLOAD_FILE}`).click((event) => {
      this.writeJsonFile();
    });

    // Handle event press enter on input file name
    $(`#${ID_OUTPUT_FILE_NAME}`).keypress((event) => {
      if (event.keyCode == 13) {
        this.writeJsonFile();
        event.preventDefault();
      }
    });
  }

  /**
   * Read content file Vertex Type Definition
   * or  read content file Graph Data Structure
   * @param event
   */
  async readJsonFile(event) {
    let file = event.target.files[0];
    if (!file)
      return;

    const data = await readDataFileJson(file);
    if (!data)
      return;

    const options = $(`#${ID_OPTION_FILE_TYPE_INPUT}`).val();
    this.mainMgmt.separateDataToManagement(data, options);

    //Hide file managememnt area
    $(`#${ID_CONTAINER_FILE_MGMT}`).slideToggle();
    $(`#${ID_INPUT_FILE_DATA}`).val(null);
  }

  writeJsonFile() {
    let fileName = $(`#${ID_OUTPUT_FILE_NAME}`).val();
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

      this.clearOutFileName();
      $(`#${ID_CONTAINER_FILE_MGMT}`).slideToggle();
    }).catch(err => {
      comShowMessage(err);
    });
  }

  clearOutFileName() {
    $(`#${ID_OUTPUT_FILE_NAME}`).val(null);
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

    const cloneVertexInputDefine = _.cloneDeep(this.inputDefined);

    let inputVertexDefine = {};
    if(this.inputDefined.vertexGroup){
      inputVertexDefine = {
        "VERTEX_GROUP": cloneVertexInputDefine.vertexGroup,
        "VERTEX": cloneVertexInputDefine.vertexTypes
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

    const cloneVertexOutputDefine = _.cloneDeep(this.outputDefined);

    let outputVertexDefine = {};
    if(this.outputDefined.vertexGroup){
      outputVertexDefine = {
        "VERTEX_GROUP": cloneVertexOutputDefine.vertexGroup,
        "VERTEX": cloneVertexOutputDefine.vertexTypes
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

    const cloneVertexOperationDefine = _.cloneDeep(this.operationsDefined);
    let operationVertexDefine = {};
    if(this.outputDefined.vertexGroup){
      operationVertexDefine = {
        "VERTEX_GROUP": cloneVertexOperationDefine.vertexGroup,
        "VERTEX": cloneVertexOperationDefine.vertexTypes
      };
    }
    operations.vertexTypes = operationVertexDefine;

    //Edges    
    let edges = [];
    const cloneEdgesData = _.cloneDeep(this.mainMgmt.storeConnect);
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
        destNote: edge.destNote
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
}

export default FileMgmt;
