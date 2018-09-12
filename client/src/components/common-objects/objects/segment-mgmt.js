import _ from 'lodash';
import ColorHash from 'color-hash';
import * as d3 from 'd3';
import Vertex from './vertex';
import PopUtils from '../../../common/utilities/popup.ult';
import ObjectUtils from '../../../common/utilities/object.ult';
import SegmentMenu from '../menu-context/segment-menu';

import {
  REPEAT_RANGE,
  VERTEX_FORMAT_TYPE,
  POPUP_CONFIG,
  VERTEX_GROUP_OPTION,
  TYPE_CONNECT,
  VERTEX_ATTR_SIZE,
  CONNECT_SIDE,
  VIEW_MODE,

} from '../../../common/const/index';

import {
  replaceSpecialCharacter,
  checkMinMaxValue,
  allowInputNumberOnly,
  autoScrollOnMousedrag,
  updateSizeGraph,
  setMinBoundaryGraph,
  checkModePermission,
  getKeyPrefix,
  htmlDecode,
  checkIsMatchRegexNumber,
  comShowMessage,
} from '../../../common/utilities/common.ult';


const HTML_VERTEX_INFO_ID = 'vertexInfo';
const HTML_VERTEX_PROPERTIES_ID = 'vertexProperties';
const HTML_GROUP_BTN_DYNAMIC_DATASET = 'groupBtnDynamicDataSet';
const ATTR_DEL_CHECK_ALL = 'delCheckAll';
const ATTR_DEL_CHECK = 'delCheck';
const CONNECT_KEY = 'Connected';

class SegmentMgmt {
  constructor(props) {
    this.dataContainer            = props.dataContainer; // {[vertex array], [boundary array]} store all vertex and boundary for this SVG
    this.containerId              = props.containerId;
    this.svgId                    = props.svgId;
    this.vertexDefinition         = props.vertexDefinition;
    this.viewMode                 = {value: VIEW_MODE.SEGMENT};
    this.edgeMgmt                 = props.edgeMgmt;
    this.connectSide              = CONNECT_SIDE.NONE;

    this.initialize();
  }

  initialize() {
    this.colorHash = new ColorHash({lightness: 0.7});
    this.colorHashConnection = new ColorHash({lightness: 0.8});
    this.objectUtils = new ObjectUtils();

    this.selectorClass = `_vertex_${this.svgId}`;
    this.currentVertex = null; //vertex is being edited

    new SegmentMenu({
      selector: `.${this.selectorClass}`,
      vertexMgmt: this,
      dataContainer: this.dataContainer,
      viewMode: this.viewMode
    });

    this.initVertexPopupHtml();
    this.bindEventForPopupVertex();

    this.handleDragVertex = d3.drag()
      .on("start", this.startDrag(this))
      .on("drag", this.dragTo(this))
      .on("end", this.endDrag(this));
  }

  initVertexPopupHtml(){

    let sHtml = `
    <!-- Vertex Info Popup (S) -->
    <div id="${HTML_VERTEX_INFO_ID}_${this.svgId}" class="modal fade" role="dialog">
      <div class="modal-dialog">
        <div class="web-dialog modal-content">
          <div class="dialog-title">
            <span class="title">Vertex Info</span>
          </div>

          <div class="dialog-wrapper">
            <form action="#" method="post">
              <div class="dialog-search form-inline">
                <table>
                  <colgroup>
                    <col width="80"/>
                    <col width="*"/>
                  </colgroup>
                  <tbody>
                    <tr>
                      <th>Name</th>
                      <td>
                        <input type="text" class="form-control" id="vertexName_${this.svgId}" name="vertexName">
                      </td>
                    </tr>
                    <tr>
                      <th>Description</th>
                      <td class="full-width">
                        <textarea class="form-control" id="vertexDesc_${this.svgId}" name="vertexDesc" rows="4"></textarea>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </form>
            <div class="dialog-button-top" id="${HTML_GROUP_BTN_DYNAMIC_DATASET}_${this.svgId}">
              <div class="row text-right">
                <button id="vertexBtnAdd_${this.svgId}" class="btn-etc">Add</button>
                <button id="vertexBtnDelete_${this.svgId}" class="btn-etc">Delete</button>
              </div>
            </div>
            <form id="vertexForm_${this.svgId}" action="#" method="post">
              <div class="dialog-search form-inline">
                <table class="vertex-properties" id="${HTML_VERTEX_PROPERTIES_ID}_${this.svgId}" border="1"></table>
              </div>
            </form>
            <div class="dialog-button-top">
              <div class="row text-right">
                <button id="vertexBtnConfirm_${this.svgId}" class="btn-etc">Confirm</button>
                <button id="vertexBtnCancel_${this.svgId}" class="btn-etc">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Vertex Info Popup (E) -->`;
    $($(`#${this.svgId}`)[0].parentNode).append(sHtml);

    
  }

  bindEventForPopupVertex() {
    const main = this;
    
    $(`#vertexBtnConfirm_${main.svgId}`).click(() => {
      this.confirmEditVertexInfo();
    });

    $(`#vertexBtnAdd_${main.svgId}`).click(() => {
      this.addDataElement();
    });

    $(`#vertexBtnDelete_${main.svgId}`).click(() => {
      this.removeDataElement();
    });

    $(`#vertexBtnCancel_${main.svgId}`).click(() => {
      this.closePopVertexInfo();
    });
  }

  create(sOptions) {
    let {vertexType} = sOptions;

    if (!vertexType)
      return;

    let newVertex = new Vertex({
      vertexMgmt: this
    });

    newVertex.create(sOptions, this.handleDragVertex, this.edgeMgmt.handleDragConnection);
  }

  startDrag(main) {
    return function (d) {
      if (main.edgeMgmt.isSelectingEdge())
        main.edgeMgmt.cancleSelectedPath();

      // Resize boundary when vertex dragged
      if (!d.parent)
        main.objectUtils.reSizeBoundaryWhenObjectDragged(d);

      main.edgeMgmt.emphasizePathConnectForVertex(this);

      d.moveToFront();
    }
  }

  dragTo(main) {
    return function (d) {
      updateSizeGraph(d);
      autoScrollOnMousedrag(d.svgId, d.containerId);
      
      // Prevent drag object outside the window
      let {x, y} = main.objectUtils.setPositionObjectJustInSvg(d3.event, `#${d.svgId}`, `#${d.id}`);
      d.x = x;
      d.y = y;
      // Transform group
      d3.select(`#${d.id}`).attr("transform", "translate(" + [d.x, d.y] + ")");
      main.edgeMgmt.updatePathConnectForVertex(d);
    }
  }

  endDrag(main) {
    return function (d) {
      if (d.parent) {
        //If object not out boundary parent , object change postion in boundary parent, so change index object
        if (main.objectUtils.checkDragObjectOutsideBoundary(d) == false) {
          main.objectUtils.changeIndexInBoundaryForObject(d);
        }
      } else {
        main.objectUtils.checkDragObjectInsideBoundary(d);
        main.objectUtils.restoreSizeBoundary(d);
      }
      
      setMinBoundaryGraph(main.dataContainer, main.svgId);
    }
  }

  /**
   * Make popup edit vertex info
   * @param vertex
   */
  makePopupEditVertex(vertex) {

    this.currentVertex = vertex;
    // Use in function updateVertexInfo()
    let {name, description, data, groupType} = vertex;

    // Get vertex group with group type
    if (!groupType) {
      groupType = this.vertexDefinition.vertexGroupType[Object.keys(this.vertexDefinition.vertexGroupType)[0]].groupType;
    }
    this.currentVertex.groupType = groupType;

    // Append content to popup
    $(`#vertexName_${this.svgId}`).val(name);
    $(`#vertexDesc_${this.svgId}`).val(description);

    // Generate properties vertex
    let keyHeader = this.vertexDefinition.headerForm[groupType];
    let cols = keyHeader.length;
    let rows = data.length;
    const typeData = this.vertexDefinition.vertexFormatType[groupType];
    const dataFormat = this.vertexDefinition.vertexFormat[groupType];

    let $table = $(`#${HTML_VERTEX_PROPERTIES_ID}_${this.svgId}`).empty();
    let $contentHeader = $('<thead>');
    // Generate header table
    let $headerRow = $('<tr>');
    let $colGroup = $('<colgroup>');
    let $popWidth = 0;
    for (let i = 0; i < cols; i++) {
      let $colHdr = $('<th>').text(this.capitalizeFirstLetter(keyHeader[i]));
      $colHdr.attr('class', 'col_header');
      $colHdr.appendTo($headerRow);

      // Init col in col group
      let prop = keyHeader[i];
      let type = typeData[prop];
      let def = dataFormat[prop];
      let width = this.findLongestContent({data, prop, type, def});
      $popWidth += width;
      let $colWidth = $('<col>').attr('width', width);
      $colWidth.appendTo($colGroup);
    }

    // Prepend col group del check
    let $colWidth = $('<col>').attr('width', POPUP_CONFIG.WIDTH_COL_DEL_CHECK);
    $colWidth.prependTo($colGroup);

    let $colHdr = this.initCellDelCheck({
      'className': 'col_header',
      'name': `${ATTR_DEL_CHECK_ALL}_${this.svgId}`,
      'checked': false,
      'colType': '<th>',
      'isCheckAll': true,
    });
    $colHdr.prependTo($headerRow);

    $colGroup.appendTo($table);
    $headerRow.appendTo($contentHeader);
    $contentHeader.appendTo($table);

    // Generate content table
    let $contentBody = $('<tbody>');
    for (let i = 0; i < rows; i++) {
      const dataRow = data[i];
      const $row = $('<tr>');
      for (let j = 0; j < cols; j++) {
        let prop = keyHeader[j];
        let type = typeData[prop];
        let val = dataRow[prop];
        let opt = [];

        const $col = $('<td>');
        // Get option if type is array
        if (type === VERTEX_FORMAT_TYPE.ARRAY) {
          opt = dataFormat[prop];
        } else if (type === VERTEX_FORMAT_TYPE.BOOLEAN) {
          $col.attr('class', 'checkbox_center');
        }

        let $control = this.generateControlByType({i, type, val, prop, opt, groupType});
        $control.appendTo($col);
        $col.appendTo($row);
      }

      // Append del check to row
      let $col = this.initCellDelCheck({
        'className': 'checkbox_center',
        'name': `${ATTR_DEL_CHECK}_${this.svgId}` ,
        'checked': false,
        'colType': '<td>'
      });
      $col.prependTo($row);

      $row.appendTo($contentBody);
    }

    $contentBody.appendTo($table);

    let options = {
      popupId: `${HTML_VERTEX_INFO_ID}_${this.svgId}`,
      position: 'center',
      width: $popWidth + POPUP_CONFIG.PADDING_CHAR + 45
    }

    PopUtils.metSetShowPopup(options);
  }

  /**
   * Generate control with options
   * @param options
   * @returns {*}
   */
  generateControlByType(options) {
    let $control = null;
    let {i, type, val, prop, opt, groupType} = options;
    let defaultVal = this.vertexDefinition.vertexFormat[groupType][prop];
    i = 0;
    switch (type) {
      case VERTEX_FORMAT_TYPE.BOOLEAN:
        $control = $('<input>');
        $control.attr('type', 'checkbox');
        $control.attr('name', `${prop}`);
        $control.prop('checked', typeof(val) == 'boolean' ? val : defaultVal);
        $control.attr("value", val);
        break;
      case VERTEX_FORMAT_TYPE.ARRAY:
        let firstOpt = opt[0];
        $control = $('<select>');
        $control.attr('name', `${prop}`);
        $control.attr('class', 'form-control');
        $.each(opt, (key, value) => {
          $control
            .append($("<option></option>")
              .attr("value", value || firstOpt)
              .prop('selected', value === (val || firstOpt))
              .text(value));
        });
        break;
      case VERTEX_FORMAT_TYPE.NUMBER:
        $control = $('<input>');
        $control.attr('type', 'text');
        $control.attr('name', `${prop}`);
        $control.attr("value", !isNaN(val) ? val : defaultVal);
        $control.attr('class', 'form-control');
        $control
          .on('keydown', function (e) {
            allowInputNumberOnly(e);
          })
          .on('focusout', function (e) {
            if (this.value && !checkIsMatchRegexNumber(this.value)) {
              comShowMessage("Input invalid");
              this.value = "";
            } else {
              if (isNaN(this.value)) {
                comShowMessage("Input invalid");
                this.value = "";
              }
            }
          });
        break;
      default:
        $control = $('<input>');
        $control.attr('type', 'text');
        $control.attr('autocomplete', 'off');
        $control.attr('name', `${prop}`);
        $control.attr("value", val != undefined ? val : defaultVal);
        $control.attr('class', 'form-control');
    }

    return $control;
  }

  /**
   * Upper case first letter
   */
  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  findLongestContent(configs) {
    let {data, prop, type, def} = configs;
    let firstRow = data[0];
    let arr = [];

    // If type is boolean or first undefined or firstRow is empty
    if ((type === VERTEX_FORMAT_TYPE.BOOLEAN) || !firstRow)
      return this.getLongestSpecialCase(prop, def);
    // prop.toString().length * POPUP_CONFIG.WIDTH_CHAR + POPUP_CONFIG.PADDING_CHAR;

    //  If object firstRow hasn't it own the specified property
    if (!firstRow.hasOwnProperty(prop)) {
      return this.getLongestSpecialCase(prop, def);
    }

    // From an array of objects, extract value of a property as array
    if (type === VERTEX_FORMAT_TYPE.ARRAY) {
      arr = def;
    } else {
      arr = data.map(e => e[prop]);
    }
    let longest = this.getLongestContentFromArry(arr);
    if (longest.toString().length < prop.toString().length)
      return prop.toString().length * POPUP_CONFIG.WIDTH_CHAR + POPUP_CONFIG.PADDING_CHAR;

    return longest.toString().length * (type === VERTEX_FORMAT_TYPE.ARRAY ? POPUP_CONFIG.WIDTH_CHAR_UPPER : POPUP_CONFIG.WIDTH_CHAR) + POPUP_CONFIG.PADDING_CHAR;
  }

  getLongestSpecialCase(prop, def) {
    let lengthProp = prop.toString().length;
    let lengthDef = def.toString().length;
    let type = typeof(def);
    // Has type is array
    if (type === "object" && Array.isArray(def)) {
      type = VERTEX_FORMAT_TYPE.ARRAY
      lengthDef = this.getLongestContentFromArry(def).toString().length;
    }

    return (lengthProp > lengthDef ? lengthProp * POPUP_CONFIG.WIDTH_CHAR :
      lengthDef * (type === VERTEX_FORMAT_TYPE.ARRAY ? POPUP_CONFIG.WIDTH_CHAR_UPPER : POPUP_CONFIG.WIDTH_CHAR ))
      + POPUP_CONFIG.PADDING_CHAR;
  }

  getLongestContentFromArry(arr) {
    return arr.reduce((a, b) => {
      let firstTmp = a + "";
      let secondTmp = b + "";
      return firstTmp.length > secondTmp.length ? firstTmp : secondTmp;
    });
  }

  addDataElement() {
    const groupType = this.currentVertex.groupType;
    const keyHeader = this.vertexDefinition.headerForm[groupType];
    let cols = keyHeader.length;
    const typeData = this.vertexDefinition.vertexFormatType[groupType];
    const dataFormat = this.vertexDefinition.vertexFormat[groupType];
    let $appendTo = $(`#${HTML_VERTEX_PROPERTIES_ID}_${this.svgId} > tbody`);

    const $row = $('<tr>');
    for (let j = 0; j < cols; j++) {
      let prop = keyHeader[j];
      let type = typeData[prop];
      // let val = dataRow[prop];
      let opt = [];

      const $col = $('<td>');
      // Get option if type is array
      if (type === VERTEX_FORMAT_TYPE.ARRAY) {
        opt = dataFormat[prop];
      } else if (type === VERTEX_FORMAT_TYPE.BOOLEAN) {
        $col.attr('class', 'checkbox_center');
      }

      let $control = this.generateControlByType({'i': j, type, prop, opt, groupType});
      $control.appendTo($col);
      $col.appendTo($row);
    }

    // Append del check to row
    let $col = this.initCellDelCheck({
      'className': 'checkbox_center',
      'name': `${ATTR_DEL_CHECK}_${this.svgId}`,
      'checked': false,
      'colType': '<td>'
    });
    $col.prependTo($row);

    $row.appendTo($appendTo);
  }

  removeDataElement() {
    $(`#${HTML_VERTEX_PROPERTIES_ID}_${this.svgId} > tbody`).find(`input[name=${ATTR_DEL_CHECK}_${this.svgId}]`).each(function () {
      if ($(this).is(":checked")) {
        $(this).parents("tr").remove();
      }
    });

    // Uncheck all
    $(`#${ATTR_DEL_CHECK_ALL}_${this.svgId}`).prop('checked', false);
  }

  initCellDelCheck(options) {
    const {className, name, checked, colType, isCheckAll} = options;
    
    let $col = $(colType);
    $col.attr('class', className);
    let $chk = $('<input>');
    $chk.attr('type', 'checkbox');
    if (isCheckAll){
      $chk.attr('id', name);
    }
    $chk.prop('checked', checked);

    const main = this;
    $chk.attr('name', name)
      .on('click', function () {
        if (isCheckAll)
          $(this).closest('table').find(`tbody :checkbox[name=${ATTR_DEL_CHECK}_${main.svgId}]`)
            .prop('checked', this.checked);
        else {
          $(`#${ATTR_DEL_CHECK_ALL}_${main.svgId}`).prop('checked',
            ($(this).closest('table').find(`tbody :checkbox[name=${ATTR_DEL_CHECK}_${main.svgId}]:checked`).length ==
              $(this).closest('table').find(`tbody :checkbox[name=${ATTR_DEL_CHECK}_${main.svgId}]`).length));
        }
      });
    $chk.appendTo($col);

    return $col;
  }

  /**
   * Close popup edit vertex info
   */
  closePopVertexInfo() {
    this.currentVertex = null;
    let options = {popupId: `${HTML_VERTEX_INFO_ID}_${this.svgId}`}
    PopUtils.metClosePopup(options);
  }

  /**
   * Get data vertex change
   */
  confirmEditVertexInfo() {

    if ($(`#vertexName_${this.svgId}`).val() === ''){
      comShowMessage("Please enter Name.");
      $(`#vertexName_${this.svgId}`).focus();
      return;
    }

    // Get data on form
    this.currentVertex.name = this.currentVertex.vertexType = $(`#vertexName_${this.svgId}`).val();
    this.currentVertex.description = $(`#vertexDesc_${this.svgId}`).val();
    const groupType = this.currentVertex.groupType;    
    const typeData = this.vertexDefinition.vertexFormatType[groupType];
    
    let elements = [];
    // Get data element
    $(`#${HTML_VERTEX_PROPERTIES_ID}_${this.svgId}`).find('tr').each(function () {
      let row = {};
      $(this).find("td input:text, td input:checkbox, td select").each(function () {
        let prop = $(this).attr("name");
        let type = typeData[prop];
        if (prop != `${ATTR_DEL_CHECK}_${this.svgId}`)
          row[prop] = type === VERTEX_FORMAT_TYPE.BOOLEAN ? ($(this).is(':checked') ? true : false) : this.value;
      });
      elements.push(row);
    });

    // Remove first row (header table)
    elements.shift();

    this.currentVertex.data = elements;
    this.currentVertex.groupType = groupType;

    if (this.currentVertex.id) {
      this.updateVertexInfo(this.currentVertex);
    } else {
      //Create New
      this.create(this.currentVertex);
    }

    this.closePopVertexInfo();
  }

  /**
   * Update vertex info
   * Update value properties
   * Update name, type, ...
   * Update present (DOM)
   */
  updateVertexInfo(forms) {
    const {id} = forms;

    d3.select(`#${id}`).selectAll("*").remove();
    this.reRenderContentInsideVertex(this.currentVertex);
  }

  async reRenderContentInsideVertex(vertex) {
    const {name, description, data: elements, id, vertexType, groupType, connectSide} = vertex;

    if (!vertexType)
      return;

    // To do: Read or load from config.
    let group = d3.select(`#${id}`);

    let htmlContent = '';
    let len = elements.length;
    let presentation = this.vertexDefinition.vertexPresentation[groupType];

    const hasLeftConnector = (connectSide == CONNECT_SIDE.LEFT || connectSide == CONNECT_SIDE.BOTH) ? " has_left_connect" : "";
    const hasRightConnector = (connectSide == CONNECT_SIDE.RIGHT || connectSide == CONNECT_SIDE.BOTH) ? " has_right_connect" : "";

    for (let i = 0; i < len; i++) {
      let data = elements[i];
      htmlContent += `
        <div class="property" prop="${id}${CONNECT_KEY}${i}" style="height: ${VERTEX_ATTR_SIZE.PROP_HEIGHT}px">
          <label class="key${hasLeftConnector}" id="${id}${presentation.key}${i}" title="${data[presentation.keyTooltip] || "No data to show"}">${htmlDecode(getKeyPrefix(data, this.vertexDefinition, groupType))}${data[presentation.key] || ""}</label>
          <label class="data${hasRightConnector}" id="${id}${presentation.value}${i}" title="${data[presentation.valueTooltip] || "No data to show"}">${data[presentation.value] || ""}</label>
        </div>`;
    }

    let vertexHeight = VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * len;
    group.append("foreignObject")
      .attr("width", VERTEX_ATTR_SIZE.GROUP_WIDTH)
      .attr("height", vertexHeight)
      .append("xhtml:div")
      .attr("class", "vertex_content")
      .html(`
        <p class="header_name" id="${id}Name" title="${description}"
          style="height: ${VERTEX_ATTR_SIZE.HEADER_HEIGHT}px; background-color: ${this.colorHash.hex(name)};
          cursor: move; pointer-events: all">${name}</p>
        <div class="vertex_data">
          ${htmlContent}
        </div>`
    );

    setMinBoundaryGraph(this.dataContainer, this.svgId);
  }

  hideAllEdgeRelatedToVertex(vertexId, status){
    this.edgeMgmt.hideAllEdgeRelatedToVertex(vertexId, status);
  }

  updatePathConnectForVertex(vertex){
    this.edgeMgmt.updatePathConnectForVertex(vertex);
  }

  clearAll(){
    d3.select(`#${this.svgId}`).selectAll(`.${this.selectorClass}`).remove();
    this.dataContainer.vertex = [];
  }
}

export default SegmentMgmt;
