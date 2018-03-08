import * as d3 from 'd3';
import PopUtils from '../../common/utilities/popup.ult';
import {
  EDGE_LINE_TP,
  EDGE_ARROW_FLG,
  HTML_EDGE_CONTAINER_CLASS,
} from '../../const/index';
import _ from "lodash";
import {
  generateObjectId
  , comShowMessage
  , cancleSelectedPath
} from '../../common/utilities/common.ult';

const HTML_EDGE_TYPE_ID = 'editEdgeType';
const OPTIONS_EDGE_LINE_TYPE = 'edgeLineType';
const OPTIONS_EDGE_ARROW_FLAG = 'edgeArrowFlag';
const HTML_EDGE_FORM_ID = 'edgeForm';

class Edge {
  constructor(props) {
    this.svgSelector = props.svgSelector;
    this.dataContainer = props.dataContainer;
    this.objectUtils = props.objectUtils;
    this.bindEventForPopButton();
    this.originEdge = null;
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
  createEdge(options = {}) {
    let source = Object.assign({}, options.source);
    let target = Object.assign({}, options.target);
    let type = options.type;
    let edgeId = options.id ? options.id : generateObjectId('E');
    // Default style is line solid with arrow at end.
    let style = options.style ? options.style : {line: "solid", arrow: "Y"};
    let note = options.note ? options.note : {originNote: '', middleNote: '', destNote: ''}; // Default note for Edge.

    // if (_.isEqual(source, target)) {
    //   comShowMessage("Connect internal is not allowed.");
    //   return;
    // }

    // Push edge info to store.
    let edgeInfo = {
      id: edgeId,
      source: source,
      target: target,
      note: note,
      style: style
    };

    this.dataContainer.edge.push(edgeInfo);

    //append into edge group
    // let group = d3.select("#groupE").append("g");
    let group = this.svgSelector.append("g");
    let pathStr = this.createPath(source, target);
    group.append("path")
      .attr('d', pathStr)
      .attr("class", `${HTML_EDGE_CONTAINER_CLASS} edge solid`) // Default line type is solid
      .attr("id", edgeId)
      .attr('fill', 'none')
      .attr("marker-end", "url(#arrow)") // Make arrow at end path
      .on("click", () => {
        window.udpateEdge = true;
        let currentPath = d3.select(d3.event.target).attr("d");
        d3.select('#groupEdgePoint').style("display", "block");
        d3.select('#edgePath').style("display", "block");
        d3.select("#edgePath").attr("d", currentPath);
        d3.select("#groupEdgePoint").moveToFront();
        d3.select("#edgePath").moveToFront();
        d3.select("#edgePath").attr("ref", edgeId);
        d3.select("#pointStart")
          .attr("cx", source.x)
          .attr("cy", source.y);
        d3.select("#pointEnd")
          .attr("cx", target.x)
          .attr("cy", target.y);
      });

    let originNote = group.append("text")
      .style("font-size", "12px")
      .attr("x", 5)   //Move the text from the start angle of the arc
      .attr("dy", -5); //Move the text down
    let middleNote = group.append("text")
      .style("font-size", "12px")
      .attr("dy", -5); //Move the text down
    let destNote = group.append("text")
      .style("font-size", "12px")
      .attr("x", -5)   //Move the text from the start angle of the arc
      .attr("dy", -5); //Move the text down

    originNote.append("textPath")
      .style("text-anchor", "start")
      .attr("fill", "#000")
      .attr("id", `originNote${edgeId}`)
      .attr("xlink:href", `#${edgeId}`)
      .attr("startOffset", "0%")
      .text(note.originNote);

    middleNote.append("textPath")
      .style("text-anchor", "middle")
      .attr("fill", "#000")
      .attr("id", `middleNote${edgeId}`)
      .attr("xlink:href", `#${edgeId}`)
      .attr("startOffset", "50%")
      .text(note.middleNote);

    destNote.append("textPath")
      .style("text-anchor", "end")
      .attr("fill", "#000")
      .attr("id", `destNote${edgeId}`)
      .attr("xlink:href", `#${edgeId}`)
      .attr("startOffset", "100%")
      .text(note.destNote);

    // window.creatingEdge = false;
    // window.removingEdge = false;
    // window.criterionNode = null;
  }

  /**
   * Bind event and init data
   * for control on popup edit line type
   */
  bindEventForPopButton() {
    // Append content to edge popup
    let $line = $(`#${OPTIONS_EDGE_LINE_TYPE}`);
    EDGE_LINE_TP.forEach((elm) => {
      const $options = $('<option>', {value: elm.value}).text(elm.name).appendTo($line);
    });

    let $arrow = $(`#${OPTIONS_EDGE_ARROW_FLAG}`);
    EDGE_ARROW_FLG.forEach((elm) => {
      const $options = $('<option>', {value: elm.value}).text(elm.name).appendTo($arrow);
    });

    $("#edgeBtnConfirm").click(e => {
      this.updateLineType();
    });
    $("#edgeBtnCancel").click(e => {
      this.closePopEdgeType();
    });
  }

  /**
   * Open popup edit line type
   * @param edgeId
   */
  openPopEditType(edgeId) {
    // Get edge info by ID
    let edgeObj = this.objectUtils.getEdgeInfoById(edgeId);
    this.originEdge = edgeObj;
    let edgeInfo = edgeObj;
    $(`#${OPTIONS_EDGE_LINE_TYPE}`).val(edgeInfo.style.line);
    $(`#${OPTIONS_EDGE_ARROW_FLAG}`).val(edgeInfo.style.arrow);

    let options = {popupId: HTML_EDGE_TYPE_ID, position: 'center', width: 210}
    PopUtils.metSetShowPopup(options);
  }

  /**
   * Close popup edit line type
   */
  closePopEdgeType() {
    let options = {popupId: HTML_EDGE_TYPE_ID}
    PopUtils.metClosePopup(options);
    this.originEdge = null;
  }

  /**
   * Remove edge by id
   * @param edgeId
   */
  removeEdge(edgeId) {
    // Remove from DOM
    d3.select(`#${edgeId}`).node().parentNode.remove();
    // Remove from data container
    let data = $.grep(this.dataContainer.edge, (e) => {
      return e.id != edgeId;
    });

    this.dataContainer.edge = data;
    // If edge seleted then delete so must be hidden edgePath, groupEdgePoint
    if(window.udpateEdge)
      cancleSelectedPath();
  }

  /**
   * Check connect exit between source and target
   * @param source
   * @param target
   */
  checkExistEdge(source, target) {

  }

  /**
   * Create string path
   * @param src
   * @param tar
   * @returns {string}
   */
  createPath(src, tar) {
    let diff = {
      x: tar.x - src.x,
      y: tar.y - src.y
    };

    let pathStr = 'M' + src.x + ',' + src.y + ' ';
    pathStr += 'C';
    pathStr += src.x + diff.x / 3 + ',' + src.y + ' ';
    pathStr += src.x + diff.x / 3 + ',' + tar.y + ' ';
    pathStr += tar.x + ',' + tar.y;

    return pathStr;
  };

  /**
   * Update line type of edge
   */
  updateLineType() {
    let edgeId = this.originEdge.id;
    let lineType = $(`#${OPTIONS_EDGE_LINE_TYPE}`).val();
    let arrowFlag = $(`#${OPTIONS_EDGE_ARROW_FLAG}`).val();
    let style = {line: lineType, arrow: arrowFlag};
    // Update data edge info
    this.originEdge.style = style;
    let dataEdge = this.dataContainer.edge;
    Object.assign(dataEdge[dataEdge.findIndex(el => el.id === this.originEdge.id)], this.originEdge)

    d3.select(`#${edgeId}`)
      .attr('class', `${HTML_EDGE_CONTAINER_CLASS} edge ${lineType}`)
      .attr('marker-end', arrowFlag === 'Y' ? 'url(#arrow)' : '');

    this.closePopEdgeType();
  }

  /**
   * Get edge notes by id
   * @param edgeId
   * @returns {*}
   */
  getEdgeNotes(edgeId) {
    // Get edge info by ID
    let edgeObj = this.objectUtils.getEdgeInfoById(edgeId);
    return edgeObj.note;
  }

  /**
   * Set data for edge note
   * @param edgeId
   * @param notes
   */
  setEdgeNotes(edgeId, notes) {
    let edgeObj = this.objectUtils.getEdgeInfoById(edgeId);
    if (!edgeObj)
      return;
    edgeObj.note = notes;

    // Update notes on view
    d3.select(`#originNote${edgeId}`)
      .text(notes.originNote);
    d3.select(`#middleNote${edgeId}`)
      .text(notes.middleNote);
    d3.select(`#destNote${edgeId}`)
      .text(notes.destNote);
  }

  /**
   * Update attribute d of path (connect)
   * @param edgeId
   * @param options: object
   */
  updatePathConnect(edgeId, options = {}) {
    if (!edgeId)
      return;
    let edgeInfo = this.objectUtils.getEdgeInfoById(edgeId);
    let source = edgeInfo.source;
    let target = edgeInfo.target;
    if (options.source) {
      // Update coordinate source
      // source = options.source;
      edgeInfo.source.x = options.source.x;
      edgeInfo.source.y = options.source.y;
      // edgeInfo.source.vertexId = options.source.vertexId || source.vertexId;
      edgeInfo.source.vertexId = options.source.vertexId;
      // edgeInfo.source.prop = options.source.prop || source.prop;
      edgeInfo.source.prop = options.source.prop;
    }
    if (options.target) {
      // Update coordinate target
      // target = options.target;
      edgeInfo.target.x = options.target.x;
      edgeInfo.target.y = options.target.y;
      // edgeInfo.target.vertexId = options.target.vertexId || target.vertexId;
      edgeInfo.target.vertexId = options.target.vertexId;
      // edgeInfo.target.prop = options.target.prop || target.prop;
      edgeInfo.target.prop = options.target.prop;
    }

    let pathStr = this.createPath(source, target);
    // Get DOM and update attribute
    d3.select(`#${edgeId}`).attr('d', pathStr);
  }
}

export default Edge;
