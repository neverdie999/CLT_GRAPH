import * as d3 from 'd3';
import PopUtils from '../../common/utilities/popup.ult';
import {
  EDGE_LINE_TP,
  EDGE_ARROW_FLG
} from '../../const/index';

const HTML_EDGE_TYPE_ID = 'editEdgeType';
const OPTIONS_EDGE_LINE_TYPE = 'edgeLineType';
const OPTIONS_EDGE_ARROW_FLAG = 'edgeArrowFlag';
const HTML_EDGE_FORM_ID = 'edgeForm';

class EdgeMgmt{
  constructor(props) {
    this.svgSelector = props.svgSelector;
    this.dataContainer = props.dataContainer;
    this.bindEventForPopButton();
    this.originEdge = null;
  }

  create(options = {}) {
    let source = options.source;
    let target = options.target;
    let type = options.type;
    if (source == target) {
      alert("Connect loop is not allowed.");
      return;
    }

    let edgeId = this.generateEdgeId();
    // Push edge info to store.
    let edgeInfo = {
      id: edgeId,
      source: source,
      target: target,
      note: ["Origin Note", "Mid Note", "Destination Note"], // Default note for Edge.
      connect: [],
      style: {line:"solid", arrow: "Y"} // Default style is line solid with arrow at end.
    };

    this.dataContainer.edge.push(edgeInfo);
    let pathStr = this.createPath(source, target);
    let line = this.svgSelector.append("path")
      .attr('d', pathStr)
      .attr("class", "edge solid") // Default line type is solid
      .attr("id", edgeId)
      .attr('fill', 'none')
      .attr("marker-end", "url(#arrow)"); // Make arrow at end path

    window.creatingEdge = false;
    window.removingEdge = false;
    window.criterionNode = null;
  }

  editType(edgeId) {
    // Get edge info by ID
    let edgeObj = this.getEdgeInfoById(edgeId);
    this.originEdge = edgeObj[0];
    this.openPopEdgeType(edgeObj[0]);
  }

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

  openPopEdgeType(edgeInfo) {
    $(`#${OPTIONS_EDGE_LINE_TYPE}`).val(edgeInfo.style.line);
    $(`#${OPTIONS_EDGE_ARROW_FLAG}`).val(edgeInfo.style.arrow);

    let options = {popupId : HTML_EDGE_TYPE_ID, position: 'center', width: 210}
    PopUtils.metSetShowPopup(options);
  }

  closePopEdgeType() {
    let options = {popupId : HTML_EDGE_TYPE_ID}
    PopUtils.metClosePopup(options);
    this.originEdge = null;
  }

  remove(edgeId) {
    // Remove from DOM
    console.log(d3.select(`#${edgeId}`));
    d3.select(`#${edgeId}`).remove();
    // Remove from data container
    let data = $.grep(this.dataContainer.edge, (e) => {
      return e.id != edgeId;
    });

    this.dataContainer.edge = data;
  }

  existEdge(source, target){

  }

  createPath(src, tar){
    let diff = {
      x: tar.x - src.x,
      y: tar.y - src.y
    };

    let pathStr = 'M' + src.x + ',' + src.y + ' ';
    pathStr += 'C';
    pathStr += src.x + diff.x / 3 * 2 + ',' + src.y + ' ';
    pathStr += src.x + diff.x / 3 + ',' + tar.y + ' ';
    pathStr += tar.x + ',' + tar.y;

    return pathStr;
  };

  // Edge ID = 'E' + Date.now()
  generateEdgeId() {
    return `E${Date.now()}`;
  }

  getEdgeInfoById(edgeId) {
    let edgeObj = $.grep(this.dataContainer.edge, (e) =>
      { return e.id === edgeId; }
    );

    return edgeObj;
  }

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
      .attr('class', `edge ${lineType}`)
      .attr('marker-end', arrowFlag === 'Y' ? 'url(#arrow)' : '');

    this.closePopEdgeType();
  }
}

export default EdgeMgmt;
