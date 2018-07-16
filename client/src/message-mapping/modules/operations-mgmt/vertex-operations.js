import _ from 'lodash';
import ColorHash from 'color-hash';
import * as d3 from 'd3';
import Vertex from '../objects-mgmt/vertex';
import PopUtils from '../../common/utilities/popup.ult';

import {
  CONNECT_SIDE,
  ID_SVG_OPERATIONS,
  REPEAT_RANGE,
  VERTEX_FORMAT_TYPE,
  POPUP_CONFIG,
  VERTEX_GROUP_OPTION,
  TYPE_CONNECT,
  VERTEX_ATTR_SIZE,

} from '../../const/index';

import {
  generateObjectId,
  replaceSpecialCharacter
} from '../../common/utilities/common.ult';

const HTML_VERTEX_INFO_ID = 'vertexInfo';
const HTML_VERTEX_PROPERTIES_ID = 'vertexProperties';
const HTML_VERTEX_FORM_ID = 'vertexForm';
const HTML_GROUP_BTN_DYNAMIC_DATASET = 'groupBtnDynamicDataSet';
const ATTR_DEL_CHECK_ALL = 'delCheckAll';
const ATTR_DEL_CHECK = 'delCheck';
const CONNECT_KEY = 'Connected';

class VertexOperations {
  constructor(props) {
    this.storeOperations = props.storeOperations;
    this.operationsMgmt = props.operationsMgmt;
    this.operationsDefined = props.operationsDefined;
    this.svgSelector = props.svgSelector;
    this.objectUtils = props.objectUtils;
    this.initialize();
    this.bindEventForPopupVertex();

    this.currentId = null;

  }

  initialize() {
    this.colorHash = new ColorHash({lightness: 0.7});
    this.colorHashConnection = new ColorHash({lightness: 0.8});
    this.callbackDragVertexOperations = d3.drag()
      .on("start", this.startDrag(this))
      .on("drag", this.dragTo(this))
      .on("end", this.endDrag(this));

    this.vertex = new Vertex();

    this.defaultOptions = {
      connectSide: CONNECT_SIDE.BOTH,
      svgSelector: this.svgSelector,
      containerClass: '_drag_vertex_operations',
      callbackDragVertex: this.callbackDragVertexOperations,
      callbackDragConnection: this.operationsMgmt.mainMgmt.callbackDragConnection,
    }
  }

  bindEventForPopupVertex() {

    $("#vertexBtnConfirm").click(() => {
      this.confirmEditVertexInfo();
    });

    $("#vertexBtnCancel").click(() => {
      this.closePopVertexInfo();
    });

    $("#vertexBtnAdd").click(() => {
      this.addDataElement();
    });

    $("#vertexBtnDelete").click(() => {
      this.removeDataElement();
    });

    // Validate input number
    $("#vertexRepeat").keydown(function (e) {
      allowInputNumberOnly(e);
    });

    $("#isVertexMandatory").change(function () {
      if (this.checked && $("#vertexRepeat").val() < 1) {
        $("#vertexRepeat").val(1);
      }
    });

    $("#vertexRepeat").keydown(function (e) {
      allowInputNumberOnly(e);
    });

    $("#vertexRepeat").focusout(function () {
      let rtnVal = checkMinMaxValue(this.value, $('#isVertexMandatory').prop('checked') == true ? 1 : REPEAT_RANGE.MIN, REPEAT_RANGE.MAX);
      this.value = rtnVal;
    });
  }

  create(sOptions) {
    let {x, y, name, description, data, id, parent, mandatory, repeat, isMenu, vertexType, isImport, groupType} = sOptions;
    if (!vertexType)
      return;

    // Deep clone vertex define
    if (isMenu) {
      let info = _.cloneDeep(_.find(this.operationsDefined.vertexTypes, {'vertexType': vertexType}));
      data = info.data;
      description = info.description;
      groupType = info.groupType;
    }
    if (!id)
      id = generateObjectId('V');

    const info = {
      x: x || 0,
      y: y || 0,
      vertexType,
      name: name || vertexType,
      description: description || "Description",
      data: data || [],
      id,
      groupType,
      parent: parent || null,
      mandatory: mandatory || false,
      repeat: repeat || 1,
      idSvg: ID_SVG_OPERATIONS,
    };
    this.storeOperations.vertex.push(info);

    const originConfig = _.cloneDeep(this.defaultOptions);
    let options = _.merge(originConfig, info); // Merged config
    let presentation = this.operationsDefined.vertexPresentation[groupType];
    options.presentation = presentation;
    this.vertex.create(options, this.storeOperations.vertex);
  }

  startDrag(main) {
    return function (d) {
      //console.log("startDrag VertexOperations", d);

      // If selected path to purpose update, but then move vertex then cancle it.
      // if (COMMON_DATA.isUpdateEdge)
      //   cancleSelectedPath();
      // Resize boundary when vertex dragged
      if (!d.parent)
        main.operationsMgmt.reSizeBoundaryAsObjectDragged(d);
    }
  }

  dragTo(main) {
    return function (d) {
      // console.log("dragTo VertexOperations", d);
      // let {x, y} = main.objectUtils.setPositionObjectJustInSvg(d3.event, `#${ID_SVG_OPERATIONS}`, `#${d.id}`);
      // d.x = x;
      // d.y = y;
      // // Transform group
      // d3.select(`#${d.id}`).attr("transform", (d) => {
      //   return "translate(" + [d.x, d.y] + ")"
      // });

      // autoScrollOnMousedrag(d);
      // updateGraphBoundary(d);
      // Prevent drag object outside the window
      let {x, y} = main.objectUtils.setPositionObjectJustInSvg(d3.event, `#${ID_SVG_OPERATIONS}`, `#${d.id}`);
      d.x = x;
      d.y = y;
      // Transform group
      d3.select(`#${d.id}`).attr("transform", "translate(" + [d.x, d.y] + ")");
      main.operationsMgmt.mainMgmt.updatePathConnect(d, ID_SVG_OPERATIONS);
    }
  }

  endDrag(main) {
    return function (d) {
      if (d.parent) {
        //If object not out boundary parent , object change postion in boundary parent, so change index object
        if (main.operationsMgmt.checkDragObjectOutsideBoundary(d) == false) {
          main.operationsMgmt.changeIndexInBoundaryForObject(d, "V");
        }
      } else {
        main.operationsMgmt.checkDragObjectInsideBoundary(d, "V");
        main.operationsMgmt.restoreSizeBoundary(d);
      }
      // setMinBoundaryGraph(main.dataContainer);
    }
  }

  /**
   * Copy vertex selected
   * @param vertexId
   */
  copyVertex(vertexId) {
    let {x, y, name, description, vertexType, data, repeat, mandatory, groupType} = _.cloneDeep(_.find(this.storeOperations.vertex, {"id": vertexId}));
    x = x + VERTEX_ATTR_SIZE.SPACE_COPY;
    y = y + VERTEX_ATTR_SIZE.SPACE_COPY;
    this.create({x, y, name, description, vertexType, data, repeat, mandatory, groupType});
  }

  /**
   * Remove vertex element by id
   * @param vertexId
   */
  removeVertex(vertexId) {
    // Remove from DOM
    d3.select(`#${vertexId}`).remove();

    // Remove from data container
    let vertexInfo = _.remove(this.storeOperations.vertex, (e) => {
      return e.id === vertexId;
    });

    if (vertexInfo.parent)
      this.operationsMgmt.boundaryOperations.removeMemberFromBoundary(vertexInfo.parent, vertexId);


    //setMinBoundaryGraph(this.dataContainer);

    // Remove all edge relate to vertex
    let relatePaths = this.operationsMgmt.mainMgmt.findEdgeRelateToVertex(vertexId);
    relatePaths.forEach(path => {
      this.operationsMgmt.mainMgmt.connectMgmt.removeEdge(path.id);
    });
  }

  /**
   * The function called from boundary via mainMgmt
   * In case that delete all boundary parent of vertex
   * @param vertexId
   */
  deleteVertex(vertexId) {
    // Remove from DOM
    d3.select(`#${vertexId}`).remove();
    // Remove from data container
    _.remove(this.storeOperations.vertex, (e) => {
      return e.id === vertexId;
    });
    //setMinBoundaryGraph(this.dataContainer);
    // Should consider again...
    // Remove all edge relate to vertex
    let relatePaths = this.operationsMgmt.mainMgmt.findEdgeRelateToVertex(vertexId);
    relatePaths.forEach(path => {
      this.operationsMgmt.mainMgmt.connectMgmt.removeEdge(path.id);
    });
  }

  /**
   * Make popup edit vertex info
   * @param vertexId
   */
  makePopupEditVertex(vertexId) {
    let vertexContainer = this.storeOperations.vertex;

    // Use in function updateVertexInfo()
    let {name, description, repeat, mandatory, data, id, groupType} = _.cloneDeep(_.find(vertexContainer, {"id": vertexId}));
    // Get vertex group with group type
    let group = _.find(this.operationsDefined.vertexGroupType, {"groupType": groupType});

    this.currentId = id;
    // Append content to popup
    $(`#vertexName`).val(name);
    $(`#vertexDesc`).val(description);
    $(`#vertexRepeat`).val(repeat);
    $(`#isVertexMandatory`).prop('checked', mandatory);

    // Generate properties vertex
    let keyHeader = this.operationsDefined.headerForm[groupType];
    let cols = keyHeader.length;
    let rows = data.length;
    const typeData = this.operationsDefined.vertexFormatType[groupType];
    const dataFormat = this.operationsDefined.vertexFormat[groupType];

    let $table = $(`#${HTML_VERTEX_PROPERTIES_ID}`).empty();
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

    const option = group.option;
    const isDynamicDataSet = option.indexOf(VERTEX_GROUP_OPTION.DYNAMIC_DATASET) > -1;
    // Set show hide group button dynamic data set
    if (!isDynamicDataSet) {
      $(`#${HTML_GROUP_BTN_DYNAMIC_DATASET}`).hide();
    }
    else {
      $(`#${HTML_GROUP_BTN_DYNAMIC_DATASET}`).show();
      // Prepend col group del check
      let $colWidth = $('<col>').attr('width', POPUP_CONFIG.WIDTH_COL_DEL_CHECK);
      $colWidth.prependTo($colGroup);

      // let $colHdr = $('<th>').text('Del');
      // $colHdr.attr('class', 'col_header');
      let $colHdr = this.initCellDelCheck({
        'className': 'col_header',
        'name': ATTR_DEL_CHECK_ALL,
        'checked': false,
        'colType': '<th>',
        'isCheckAll': true,
      });
      $colHdr.prependTo($headerRow);
    }

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

      if (isDynamicDataSet) {
        // Append del check to row
        let $col = this.initCellDelCheck({
          'className': 'checkbox_center',
          'name': ATTR_DEL_CHECK,
          'checked': false,
          'colType': '<td>'
        });
        $col.prependTo($row);
      }
      $row.appendTo($contentBody);
    }

    $contentBody.appendTo($table);

    let options = {
      popupId: HTML_VERTEX_INFO_ID,
      position: 'center',
      width: $popWidth + POPUP_CONFIG.PADDING_CHAR + (!isDynamicDataSet ? 0 : 45)
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
    let defaultVal = this.operationsDefined.vertexFormat[groupType][prop];
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
    if (!this.currentId)
      return;
    let {groupType} = _.cloneDeep(_.find(this.storeOperations.vertex, {"id": this.currentId}));
    let keyHeader = this.operationsDefined.headerForm[groupType];
    let cols = keyHeader.length;
    const typeData = this.operationsDefined.vertexFormatType[groupType];
    const dataFormat = this.operationsDefined.vertexFormat[groupType];
    let $appendTo = $(`#${HTML_VERTEX_PROPERTIES_ID} > tbody`);

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

    let group = _.find(this.operationsDefined.vertexGroupType, (g) => {
      return g.groupType === groupType;
    });
    let option = group.option;
    const isDynamicDataSet = option.indexOf(VERTEX_GROUP_OPTION.DYNAMIC_DATASET) > -1;
    if (isDynamicDataSet) {
      // Append del check to row
      let $col = this.initCellDelCheck({
        'className': 'checkbox_center',
        'name': ATTR_DEL_CHECK,
        'checked': false,
        'colType': '<td>'
      });
      $col.prependTo($row);
    }

    $row.appendTo($appendTo);
  }

  removeDataElement() {
    $(`#${HTML_VERTEX_PROPERTIES_ID} > tbody`).find(`input[name=${ATTR_DEL_CHECK}]`).each(function () {
      if ($(this).is(":checked")) {
        $(this).parents("tr").remove();
      }
    });

    // Uncheck all
    $(`#${ATTR_DEL_CHECK_ALL}`).prop('checked', false);
  }

  initCellDelCheck(options) {
    const {className, name, checked, colType, isCheckAll} = options;
    let $col = $(colType);
    $col.attr('class', className);
    let $chk = $('<input>');
    $chk.attr('type', 'checkbox');
    if (isCheckAll)
      $chk.attr('id', name);
    $chk.prop('checked', checked);
    $chk.attr('name', name)
      .on('click', function () {
        if (isCheckAll)
          $(this).closest('table').find(`tbody :checkbox[name=${ATTR_DEL_CHECK}]`)
            .prop('checked', this.checked);
        else {
          $(`#${ATTR_DEL_CHECK_ALL}`).prop('checked',
            ($(this).closest('table').find(`tbody :checkbox[name=${ATTR_DEL_CHECK}]:checked`).length ==
              $(this).closest('table').find(`tbody :checkbox[name=${ATTR_DEL_CHECK}]`).length));
        }
      });
    $chk.appendTo($col);

    return $col;
  }

  /**
   * Close popup edit vertex info
   */
  closePopVertexInfo() {
    this.currentId = null;
    let options = {popupId: HTML_VERTEX_INFO_ID}
    PopUtils.metClosePopup(options);
  }

  /**
   * Get data vertex change
   */
  confirmEditVertexInfo() {
    // Get data on form
    let forms = {};
    forms.id = this.currentId;
    forms.name = $(`#vertexName`).val();
    forms.description = $(`#vertexDesc`).val();
    forms.repeat = $(`#vertexRepeat`).val();
    forms.mandatory = $(`#isVertexMandatory`).prop('checked');

    const {groupType} = _.find(this.storeOperations.vertex, {'id': this.currentId});
    const typeData = this.operationsDefined.vertexFormatType[groupType];
    let elements = [];
    // Get data element
    $(`#${HTML_VERTEX_PROPERTIES_ID}`).find('tr').each(function () {
      let row = {};
      $(this).find("td input:text, td input:checkbox, td select").each(function () {
        let prop = $(this).attr("name");
        let type = typeData[prop];
        if (prop != ATTR_DEL_CHECK)
          row[prop] = type === VERTEX_FORMAT_TYPE.BOOLEAN ? ($(this).is(':checked') ? true : false) : this.value;
      });
      elements.push(row);
    });
    // Remove first row (header table)
    elements.shift();
    forms.data = elements;
    forms.groupType = groupType;

    this.updateVertexInfo(forms);
    this.closePopVertexInfo();
  }

  /**
   * Update vertex info
   * Update value properties
   * Update name, type, ...
   * Update present (DOM)
   */
  updateVertexInfo(forms) {
    const {id, name, description, repeat, mandatory, data, groupType} = forms;
    let vertex = _.find(this.storeOperations.vertex, {'id': id});
    vertex.name = name;
    vertex.description = description;
    vertex.repeat = repeat;
    vertex.mandatory = mandatory;
    vertex.data = data;

    let group = _.find(this.operationsDefined.vertexGroupType, (g) => {
      return g.groupType === groupType;
    });
    const option = group.option;
    const isDynamicDataSet = option.indexOf(VERTEX_GROUP_OPTION.DYNAMIC_DATASET) > -1;
    if (isDynamicDataSet) {
      d3.select(`#${id}`).selectAll("*").remove();
      this.reRenderContentInsideVertex(vertex);
    } else {
      // Update properties
      let header = d3.select(`#${id}Name`);
      header.text(name).attr('title', description);
      header.style("background-color", `${this.colorHash.hex(name)}`);
      let rows = data.length;
      let presentation = this.operationsDefined.vertexPresentation[groupType];
      for (let i = 0; i < rows; i++) {
        let dataRow = data[i];
        d3.select(`#${replaceSpecialCharacter(`${id}${presentation.key}${i}`)}`)
          .text(dataRow[presentation.key])
          .attr('title', dataRow[presentation.keyTooltip]);
        d3.select(`#${replaceSpecialCharacter(`${id}${presentation.value}${i}`)}`)
          .text(dataRow[presentation.value])
          .attr('title', dataRow[presentation.valueTooltip]);
      }
    }
  }

  reRenderContentInsideVertex(options) {
    let {name, description, data: elements, id, vertexType, groupType, parent} = options;

    if (!vertexType)
      return;

    // To do: Read or load from config.
    let group = d3.select(`#${id}`);

    let htmlContent = '';
    let len = elements.length;
    let presentation = this.operationsDefined.vertexPresentation[groupType];

    for (let i = 0; i < len; i++) {
      let data = elements[i];
      htmlContent += `
        <div class="property" prop="${id}${CONNECT_KEY}${i}" style="height: ${VERTEX_ATTR_SIZE.PROP_HEIGHT}px">
          <label class="key" id="${id}${presentation.key}${i}" title="${data[presentation.keyTooltip] || "No data to show"}">${data[presentation.key] || ""}</label><label> : </label>
          <label class="data" id="${id}${presentation.value}${i}" title="${data[presentation.valueTooltip] || "No data to show"}">${data[presentation.value] || ""}</label>
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
        <div class="vertex_data" style="pointer-events: none">
          ${htmlContent}
        </div>`
      );

    for (let i = 0; i < len; i++) {
      // Input
      group.append("rect")
        .attr("class", "drag_connect")
        .attr("type", TYPE_CONNECT.INPUT)
        .attr("prop", `${id}${CONNECT_KEY}${i}`)
        .attr("pointer-events", "all")
        .attr("width", 12)
        .attr("height", 25)
        .attr("x", 1)
        .attr("y", VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * i + 1)
        .style("fill", this.colorHashConnection.hex(name))
        .call(this.defaultOptions.callbackDragConnection);

      // Output
      group.append("rect")
        .attr("class", "drag_connect")
        .attr("prop", `${id}${CONNECT_KEY}${i}`)
        .attr("type", TYPE_CONNECT.OUTPUT)
        .attr("pointer-events", "all")
        .attr("width", 12)
        .attr("height", 25)
        .attr("x", VERTEX_ATTR_SIZE.GROUP_WIDTH - (VERTEX_ATTR_SIZE.PROP_HEIGHT / 2))
        .attr("y", VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * i + 1)
        .style("fill", this.colorHashConnection.hex(name))
        .call(this.defaultOptions.callbackDragConnection);
    }

    if (parent)
      this.mainMgmt.reorderPositionMember(parent);
    //setMinBoundaryGraph(this.dataContainer);
  }

  /**
   * Set position for vertex
   * Called in function dragBoundary (Object boundary)
   * @param vertexId
   * @param position
   */
  setVertexPosition(vertexId, position) {
    let {x, y} = position;
    let vertexInfo = _.find(this.storeOperations.vertex, {"id": vertexId});
    vertexInfo.x = x;
    vertexInfo.y = y;
    this.operationsMgmt.mainMgmt.updatePathConnect(vertexInfo, ID_SVG_OPERATIONS);

    d3.select(`#${vertexId}`).attr("transform", (d, i) => {
      return "translate(" + [x, y] + ")"
    });
  }

  /**
   * Find index of prop in vertex properties
   * @param vertexId
   * @param prop
   * @returns {number}
   */
  findIndexPropInVertex(vertexId, prop) {
    // Find index prop in object
    let arrayProp = d3.select(`#${vertexId}`).selectAll('.property:not(.hide)');
    let tmpArry = arrayProp._groups[0];

    let index = 0;
    for (let ele in tmpArry) {
      if (d3.select(tmpArry[ele]).attr('prop') === prop) {
        break;
      }
      index += 1;
    }

    return index;
  }

  /**
   * Move to new position with parent offset(called when moving the boundary that contain this vertex)
   * @param {*} vertexId
   * @param {*} offsetX
   * @param {*} offsetY
   */
  moveVertex(vertexId, offsetX, offsetY) {
    let vertexInfo = _.find(this.storeOperations.vertex, {"id":vertexId});
    vertexInfo.x = vertexInfo.x + offsetX;
    vertexInfo.y = vertexInfo.y + offsetY;
    this.operationsMgmt.mainMgmt.updatePathConnect(vertexInfo, ID_SVG_OPERATIONS);

    d3.select(`#${vertexId}`).attr("transform", "translate(" + [vertexInfo.x, vertexInfo.y] + ")");
  }

  /**
   * Calculate height vertex base properties connectted
   * @param id
   * @param isShowFull used in case vertex just have header.
   * @returns {number}
   */
  resetSizeVertex(isShowFull = false) {
    let vertexes = this.storeOperations.vertex;
    vertexes.forEach(vertex => {
      let exitConnect = false;
      let vertexId = vertex.id;
      // Get all prop that not hide
      let arrProp = d3.select(`#${vertexId}`).selectAll('.property:not(.hide)');
      let tmpArry = arrProp._groups[0];
      // When not any edge connect to properties of vertex,
      // Check exit edge connect to vertex
      // if (tmpArry.length < 1)
      //   exitConnect = this.objectUtils.checkExitEdgeConnectToVertex(vertexId);

      let element = $(`#${vertexId} .vertex_content`);
      element.parent()
        .attr('height', tmpArry.length ?
          VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * tmpArry.length : isShowFull ?
            VERTEX_ATTR_SIZE.HEADER_HEIGHT : exitConnect ? VERTEX_ATTR_SIZE.HEADER_HEIGHT : VERTEX_ATTR_SIZE.HEADER_HEIGHT);
    });
  }
}

export default VertexOperations
