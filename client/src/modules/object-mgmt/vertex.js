import * as d3 from 'd3';
import {
  SCREEN_SIZES,
  INTERACTION_TP,
  INTERACTION_TP_LST,
  TYPE_POINT,
  VERTEX_ATTR_SIZE,
  HTML_VERTEX_CONTAINER_CLASS,
  DEFAULT_CONFIG_GRAPH,
  REPEAT_RANGE,
  HTML_ALGETA_CONTAINER_ID,
  VERTEX_CONFIG,
} from '../../const/index';
import _ from "lodash";
import PopUtils from '../../common/utilities/popup.ult';
import {
  generateObjectId,
  replaceSpecialCharacter,
  cancleSelectedPath,
  createPath,
  autoScrollOnMousedrag,
  updateGraphBoundary,
  setMinBoundaryGraph,
  allowInputNumberOnly,
  checkMinMaxValue,
} from '../../common/utilities/common.ult';
import ColorHash from 'color-hash';

const HTML_VERTEX_INFO_ID = 'vertexInfo';
const HTML_VERTEX_PROPERTIES_ID = 'vertexProperties';
const HTML_VERTEX_FORM_ID = 'vertexForm';

class Vertex {
  constructor(props) {
    this.svgSelector = props.svgSelector;
    this.objectUtils = props.objectUtils;
    this.dataContainer = props.dataContainer;
    this.mainMgmt = props.mainMgmt;

    this.dragRegister = d3.drag()
      .on("start", this.dragstarted(this))
      .on("drag", this.dragged(this))
      .on("end", this.dragended(this));

    this.dragConnector = d3.drag()
      .on("start", this.startConnect(this))
      .on("drag", this.drawConnect(this))
      .on("end", this.endConnect(this));

    this.originVertex = null;
    this.bindEventForPopupVertex();
    this.colorHash = new ColorHash({lightness: 0.7});
  }

  /**
   * Bind event and init data for controls on popup
   */
  bindEventForPopupVertex() {
    $("#vertexBtnConfirm").click(e => {
      this.confirmEditVertexInfo();
    });

    $("#vertexBtnCancel").click(e => {
      this.closePopVertexInfo();
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

  /**
   *
   * @param options
   * vertexType: object, required
   * vertexProperties: object, option
   * interaction: string, option
   * vertexProperties: object, option
   * id: string, option (format V*********)
   * Ex
   */
  createVertex(options) {
    if (!options.vertexType)
      return;

    let vertexType = options.vertexType;
    // Deep clone array object vertex
    let vertexProperties =  _.cloneDeep(Array.isArray(options.data) ? options.data : window.vertexTypes[vertexType]);
    let vertexId = options.id ? options.id : generateObjectId('V');
    let parent = options.parent || null;

    // To do: Use default config and merge with current config
    let vertexInfo = {
      x: options.x,
      y: options.y,
      vertexType: vertexType,
      name: options.name || vertexType,
      description: options.description || "Description",
      data: vertexProperties,
      id: vertexId,
      parent: parent,
      mandatory: options.mandatory || false,
      repeat: options.repeat || 1
    };
    this.dataContainer.vertex.push(vertexInfo);

    //append into vertex group
    let group = this.svgSelector.append("g")
      .attr("transform", `translate(${options.x}, ${options.y})`)
      .attr("id", vertexId)
      .attr("class", `${HTML_VERTEX_CONTAINER_CLASS}`)
      .style("cursor", "default")
      .style("visibility", "visible");

    // Append point connect vertex
    group.append("circle")
      .attr("class", "drag_connect")
      .attr("fill", "white")
      .attr("r", 3)
      .attr("cx", VERTEX_ATTR_SIZE.GROUP_WIDTH / 2)
      .attr("stroke-width", 1)
      .style("cursor", "default")
      .attr("stroke", "black")
      .attr("pointer-events", "all")
      .on("mouseover", () => {
        d3.select(d3.event.target).classed("hight-light", true);
        d3.select(d3.event.target).attr("r", 4);
      })
      .on("mouseout", () => {
        d3.select(d3.event.target).classed("hight-light", false);
        d3.select(d3.event.target).attr("r", 3);
      });

    let htmlContent = '';
    let count = 0;
    vertexInfo.data.forEach(data => {
      htmlContent += `
        <div class="property" prop="${data.key}" style="height: ${VERTEX_ATTR_SIZE.PROP_HEIGHT}px">
          <label class="key" title="${data.key}">${data.key}</label><label> : </label>
          <label class="data ${data.key}" id="${vertexId}${data.key}" title="${data.spec}">${data.spec}</label>
        </div>`;
      // Append point connect prop of vertex

      // Input
      group.append("circle")
        .attr("class", "drag_connect")
        .attr("prop", data.key)
        .attr("fill", "white")
        .attr("type", TYPE_POINT.INPUT)
        .attr("r", 3)
        .attr("cy", VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * count + VERTEX_ATTR_SIZE.PROP_HEIGHT / 2)
        .attr("stroke-width", 1)
        .style("cursor", "default")
        .attr("stroke", "black")
        .attr("pointer-events", "all")
        .on("mouseover", () => {
          d3.select(d3.event.target).classed("hight-light", true);
          d3.select(d3.event.target).attr("r", 4);
        })
        .on("mouseout", () => {
          d3.select(d3.event.target).classed("hight-light", false);
          d3.select(d3.event.target).attr("r", 3);
        });

      // Output
      group.append("circle")
        .attr("class", "drag_connect")
        .attr("prop", data.key)
        .attr("fill", "white")
        .attr("type", TYPE_POINT.OUTPUT)
        .attr("r", 3)
        .attr("cx", VERTEX_ATTR_SIZE.GROUP_WIDTH)
        .attr("cy", VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * count + VERTEX_ATTR_SIZE.PROP_HEIGHT / 2)
        .attr("stroke-width", 1)
        .style("cursor", "default")
        .attr("stroke", "black")
        .attr("pointer-events", "all")
        .on("mouseover", () => {
          d3.select(d3.event.target).classed("hight-light", true);
          d3.select(d3.event.target).attr("r", 4);
        })
        .on("mouseout", () => {
          d3.select(d3.event.target).classed("hight-light", false);
          d3.select(d3.event.target).attr("r", 3);
        });

      count += 1;
    });

    let vertexHeight = VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * count;

    group.append("foreignObject")
      .attr("width", VERTEX_ATTR_SIZE.GROUP_WIDTH)
      .attr("height", vertexHeight)
      .append("xhtml:div")
      .attr("class", "vertex_content")
      .style("font-size", "13px")
      .style("background", "#ffffff")
      .html(`
        <p class="header_name" id="${vertexId}Name" title="${vertexInfo.description}" 
        style="height: ${VERTEX_ATTR_SIZE.HEADER_HEIGHT}px; background-color: ${this.colorHash.hex(vertexInfo.name)}">${vertexInfo.name}</p>
        <div class="vertex_data">
          ${htmlContent}
        </div>
      `);

    this.initEventDrag();
    setMinBoundaryGraph(this.dataContainer);
  }

  /**
   * Init event drag for all vertex
   */
  initEventDrag() {
    this.svgSelector.selectAll(`.${HTML_VERTEX_CONTAINER_CLASS}`)
      .data(this.dataContainer.vertex)
      // .on("mouseleave", this.handleMouseLeave(this))
      .call(this.dragRegister);
    d3.selectAll('.drag_connect').call(this.dragConnector);
  }

  /**
   * Handle event start drag vertex
   * @param d
   */
  dragstarted(self) {
    return (d) => {
      // If selected path to purpose update, but then move vertex then cancle it.
      if (window.udpateEdge)
        cancleSelectedPath();
    }
  }

  /**
   * Handle event move vertex
   * And update position of paths related to this vertex
   * @param d
   */
  dragged(self) {
    return (d) => {
      autoScrollOnMousedrag(d);
      updateGraphBoundary(d);
      // Prevent drag object outside the window
      d.x = d3.event.x < DEFAULT_CONFIG_GRAPH.MIN_OFFSETX ? DEFAULT_CONFIG_GRAPH.MIN_OFFSETX : d3.event.x;
      d.y = d3.event.y < DEFAULT_CONFIG_GRAPH.MIN_OFFSETY ? DEFAULT_CONFIG_GRAPH.MIN_OFFSETY : d3.event.y;
      // Transform group
      d3.select(`#${d.id}`).attr("transform", (d, i) => {
        return "translate(" + [d.x, d.y] + ")"
      });

      self.updatePathConnect(d.id);

      // Resize boundary when vertex dragged
      if (!d.parent)
        self.mainMgmt.reSizeBoundaryAsObjectDragged(d);
    }
  }

  /**
   * Call back when stop drag vertex
   * @param d
   */
  dragended(self) {
    return (d) => {
      if (d.parent) {
        self.mainMgmt.checkDragObjectOutsideBoundary(d);
      } else {
        self.mainMgmt.checkDragObjectInsideBoundary(d, "V");
        self.mainMgmt.resetSizeBoundary();
      }
      setMinBoundaryGraph(self.dataContainer);
    }
  }

  /**
   * Remove vertex element by id
   * @param vertexId
   */
  removeVertex(vertexId) {
    // Remove from DOM
    let vertexInfo = this.objectUtils.getVertexInfoById(vertexId);
    d3.select(`#${vertexId}`).remove();

    if(vertexInfo.parent)
      this.mainMgmt.removeMemberFromBoundary(vertexInfo.parent, vertexId);
    // Remove from data container
    let data = _.remove(this.dataContainer.vertex, (e) => {
      return e.id === vertexId;
    });

    setMinBoundaryGraph(this.dataContainer);
  }

  /**
   * Copy vertex selected
   * @param vertexId
   */
  copyVertex(vertexId) {
    let infos = this.objectUtils.cloneVertexInfo(vertexId);
    let clone = {
      x: infos.x + VERTEX_ATTR_SIZE.SPACE_COPY,
      y: infos.y + VERTEX_ATTR_SIZE.SPACE_COPY,
      name: infos.name,
      description: infos.description,
      vertexType: infos.vertexType,
      data: infos.data
    };
    this.createVertex(clone);
  }

  /**
   * Make popup edit vertex info
   * @param vertexId
   */
  makePopupEditVertex(vertexId) {
    // Use in function updateVertexInfo()
    const vertexInfo = this.objectUtils.cloneVertexInfo(vertexId);
    this.originVertex = vertexInfo;
    // Append content to popup
    $(`#vertexName`).val(vertexInfo.name);
    $(`#vertexDesc`).val(vertexInfo.description);
    $(`#vertexRepeat`).val(vertexInfo.repeat);
    $(`#isVertexMandatory`).prop('checked', vertexInfo.mandatory);

    // Generate properties vertex
    let vertexData = vertexInfo.data;
    let $propertiesGroup = $(`#${HTML_VERTEX_PROPERTIES_ID}`).empty();
    const $rowVertexType = $('<tr>');
    // Generate header
    let $colHdrId = $('<th>').text('ID');
    $colHdrId.attr('class', 'vertex-type');
    $colHdrId.appendTo($rowVertexType);
    let $colHdrSpec = $('<th>').text('Spec');
    $colHdrSpec.attr('class', 'vertex-type');
    $colHdrSpec.appendTo($rowVertexType);
    let $colHdrMan = $('<th>').text('Mandatory');
    $colHdrMan.attr('class', 'vertex-type');
    $colHdrMan.appendTo($rowVertexType);
    $rowVertexType.appendTo($propertiesGroup);

    vertexInfo.data.forEach(data => {
      const $row = $('<tr>');
      const $th = $('<th>').text(data.key).appendTo($row);
      // Second column
      const $td = $('<td>');
      const $input = $('<input>');
      $input.attr('type', 'text');
      // $input.attr('id', key);
      $input.attr('name', data.key);
      $input.attr('class', 'form-control');
      $input.val(data.spec);
      $input.appendTo($td);
      $td.appendTo($row);
      // Third column
      const $manTd = $('<td>');
      $manTd.attr('class', 'vertex-type');
      const $man = $('<input>');
      $man.attr('type', 'checkbox');
      $man.attr('name', `${data.key}_mandatory`);
      $man.attr('id', `${data.key}_mandatory`);
      $man.prop('checked', data.mandatory);
      $man.appendTo($manTd);
      $manTd.appendTo($row);
      $row.appendTo($propertiesGroup);
    });

    let options = {
      popupId: HTML_VERTEX_INFO_ID,
      position: 'center',
      width: 430
    }
    PopUtils.metSetShowPopup(options);
  }

  /**
   * Close popup edit vertex info
   */
  closePopVertexInfo() {
    this.originVertex = null;
    let options = {popupId: HTML_VERTEX_INFO_ID}
    PopUtils.metClosePopup(options);
  }

  /**
   * Get data vertex change
   */
  confirmEditVertexInfo() {
    // Get data on form
    let form = $(`#${HTML_VERTEX_FORM_ID}`).serializeArray();
    let data = {};
    $(form).each(function (index, obj) {
      data[obj.name] = obj.value;
    });
    data.id = this.originVertex.id;
    this.updateVertexInfo(data);
    this.closePopVertexInfo();
  }

  /**
   * Update vertex info
   * Update value properties
   * Update name, type, ...
   * Update present (DOM)
   */
  updateVertexInfo(infos) {
    const id = infos.id;
    let vertexInfo = this.objectUtils.getVertexInfoById(id);
    // Change name
    vertexInfo.name = infos.vertexName;
    vertexInfo.description = infos.vertexDesc;
    vertexInfo.repeat = infos.vertexRepeat;
    vertexInfo.mandatory = $(`#isVertexMandatory`).prop('checked');
    let header = d3.select(`#${id}Name`);
    header.text(infos.vertexName).attr('title', infos.vertexDesc);
    header.style("background-color", `${this.colorHash.hex(vertexInfo.name)}`);
    // Update properties

    vertexInfo.data.forEach(data => {
      let key = data.key;
      data.spec = infos[key];
      data.mandatory = infos[`${key}_mandatory`] ? true : false;
      d3.select(`#${replaceSpecialCharacter(`${id}${key}`)}`).text(infos[key]).attr('title', infos[key]);
    });
  }

  /**
   * Set state connect from source
   * @param vertexId
   * @param prop
   */
  setConnectFrom(vertexId, prop = null) {
    window.creatingEdge = true;
    let source = this.getCoordinateProperty(vertexId, prop, TYPE_POINT.OUTPUT);
    source.vertexId = vertexId;
    source.prop = prop;
    window.sourceNode = source;
  }

  /**
   * Set state connect to target
   * @param vertexId: string, require
   * @param prop: string, option
   */
  setConnectTo(vertexId, prop = null) {
    if (window.creatingEdge) {
      let target = this.getCoordinateProperty(vertexId, prop, TYPE_POINT.INPUT);
      target.vertexId = vertexId;
      target.prop = prop;
      let options = {source: window.sourceNode, target: target};
      this.createConnect(options);
    }
  }

  /**
   * Call create connect from source to target
   * @param options
   */
  createConnect(options) {
    this.mainMgmt.createEdge(options);
  }

  /**
   * Calculate position of vertex or position of property in vertex
   * @param vertexId: string, required
   * @param prop: string, option, prop of vertex
   * @param type: string, default is O (output)
   * @returns {{x: *, y: *}}
   */
  getCoordinateProperty(vertexId, prop, type) {
    if (!type)
      type = TYPE_POINT.OUTPUT;
    let vertexInfo = this.objectUtils.cloneVertexInfo(vertexId);
    let axisX = vertexInfo.x;
    let axisY = vertexInfo.y;

    // If get Coordinate for vertex only
    // if(!prop)
    //   return {x: type === TYPE_POINT.OUTPUT ? axisX + VERTEX_ATTR_SIZE.GROUP_WIDTH : axisX, y: axisY + 2 };
    if (!prop)
      return {x: axisX + VERTEX_ATTR_SIZE.GROUP_WIDTH / 2, y: axisY};

    // Find index prop in object
    // let index = 0;
    let arrayProp = d3.select(`#${vertexId}`).selectAll('.property:not(.hide)');
    let tmpArry = arrayProp._groups[0];

    let index = 0;
    for (let ele in tmpArry) {
      if (d3.select(tmpArry[ele]).attr('prop') === prop) {
        break;
      }
      index += 1;
    }
    // let index = Object.keys(vertexInfo.data).indexOf(prop);

    // Calculate coordinate of prop
    // y = current axis y + height header + indexProp*heightProp + 13;
    // x = if output then axis x + width vertex; if not then axis x
    // Get coordinate
    axisY = axisY + VERTEX_ATTR_SIZE.HEADER_HEIGHT + index * VERTEX_ATTR_SIZE.PROP_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT / 2;
    return {
      x: type === TYPE_POINT.OUTPUT ? axisX + VERTEX_ATTR_SIZE.GROUP_WIDTH : axisX,
      y: axisY
    };
  }

  /**
   * Find and update position connect to vertex when in move
   * @param vertexId
   */
  updatePathConnect(vertexId) {
    let srcPaths = this.objectUtils.findEdgeStartFromVertex(vertexId);
    let desPaths = this.objectUtils.findEdgeConnectToVertex(vertexId);

    srcPaths.forEach(src => {
      let edgeId = src.id;
      let prop = src.source.prop;
      let newPos = this.getCoordinateProperty(vertexId, prop, TYPE_POINT.OUTPUT);
      src.source.x = newPos.x;
      src.source.y = newPos.y;
      let options = {source: src.source};
      this.mainMgmt.updatePathConnect(edgeId, options);
    });

    desPaths.forEach(des => {
      let edgeId = des.id;
      let prop = des.target.prop;
      let newPos = this.getCoordinateProperty(vertexId, prop, TYPE_POINT.INPUT);
      des.target.x = newPos.x;
      des.target.y = newPos.y;
      let options = {target: des.target};
      this.mainMgmt.updatePathConnect(edgeId, options);
    });
  }

  /**
   * Set position for vertex
   * Called in function dragBoundary (Object boundary)
   * @param vertexId
   * @param position
   */
  setVertexPosition(vertexId, position) {
    const {x, y} = position;
    let vertexInfo = this.objectUtils.getVertexInfoById(vertexId);
    vertexInfo.x = x;
    vertexInfo.y = y;
    this.updatePathConnect(vertexId);

    d3.select(`#${vertexId}`).attr("transform", (d, i) => {
      return "translate(" + [x, y] + ")"
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
    _.remove(this.dataContainer.vertex, (e) => {
      return e.id === vertexId;
    });
    setMinBoundaryGraph(this.dataContainer);
    // Should consider again...
    // Remove all edge relate to vertex
    let relatePaths = this.objectUtils.findEdgeRelateToVertex(vertexId);
    relatePaths.forEach(path => {
      this.mainMgmt.removeEdge(path.id);
    });
  }

  /**
   * Start creation connect
   * @param self
   * @returns {Function}
   */
  startConnect(self) {
    return function (d) {
      window.creatingEdge = true;
      d3.event.sourceEvent.stopPropagation();
      let sourceId = d3.select(d3.event.sourceEvent.target.parentNode).attr("id");
      let prop = d3.select(d3.event.sourceEvent.target).attr("prop");
      const source = self.getCoordinateProperty(sourceId, prop, TYPE_POINT.OUTPUT);
      window.sourceId = sourceId;
      source.vertexId = sourceId;
      source.prop = prop;
      window.sourceNode = source;
    }
  }

  /**
   * Draw connect belong to mouse position
   * @param self
   * @returns {Function}
   */
  drawConnect(self) {
    return function (d) {
      if (window.creatingEdge) {
        let x = d3.mouse(d3.select('svg').node())[0];
        let y = d3.mouse(d3.select('svg').node())[1];
        let pathStr = createPath(window.sourceNode, {x, y});
        d3.select('#dummyPath').attr('d', pathStr);
        d3.select('#dummyPath').style("display", "block");
        let d = {};
        d.id = window.sourceId;
        autoScrollOnMousedrag(d);
        updateGraphBoundary(d);
      }
    }
  }

  /**
   * End creation connect if destination is connect point
   * @param self
   * @returns {Function}
   */
  endConnect(self) {
    return function (d) {
      window.creatingEdge = false;
      let sCircle = d3.select(this);
      let eCircle = d3.select(d3.event.sourceEvent.target);
      if (d3.event.sourceEvent.target.tagName == "circle" && this != d3.event.sourceEvent.target) {
        let targetId = d3.select(d3.event.sourceEvent.target.parentNode).attr("id");
        let prop = d3.select(d3.event.sourceEvent.target).attr("prop");
        const target = self.getCoordinateProperty(targetId, prop, TYPE_POINT.INPUT);
        target.vertexId = targetId;
        target.prop = prop;
        let options = {source: window.sourceNode, target: target};
        self.createConnect(options);
      }
      d3.select('#dummyPath').style("display", "none");
      window.sourceNode = null;
      window.sourceId = null;
      setMinBoundaryGraph(self.dataContainer);
    }
  }

  /**
   * Update position circle connect on vertex
   * @param arrProp
   * @param vertex
   */
  updateCircle(arrProp, vertex) {
    let count = 0;
    for (const key of arrProp) {
      if (key != null) {
        // Input
        vertex.insert("circle", ":first-child")
          .attr("class", "drag_connect reduced")
          .attr("prop", key)
          .attr("fill", "none")
          .attr("r", 3)
          .attr("cy", VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * count + VERTEX_ATTR_SIZE.PROP_HEIGHT / 2)
          .attr("stroke-width", 1)
          .style("cursor", "default")
          .attr("stroke", "black")
          .attr("pointer-events", "all")
          .on("mouseover", () => {
            d3.select(d3.event.target).classed("hight-light", true);
          })
          .on("mouseout", () => {
            d3.select(d3.event.target).classed("hight-light", false);
          });

        // Output
        vertex.insert("circle", ":first-child")
          .attr("class", "drag_connect reduced")
          .attr("prop", key)
          .attr("fill", "none")
          .attr("r", 3)
          .attr("cx", VERTEX_ATTR_SIZE.GROUP_WIDTH)
          .attr("cy", VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * count + VERTEX_ATTR_SIZE.PROP_HEIGHT / 2)
          .attr("stroke-width", 1)
          .style("cursor", "default")
          .attr("stroke", "black")
          .attr("pointer-events", "all")
          .on("mouseover", () => {
            d3.select(d3.event.target).classed("hight-light", true);
          })
          .on("mouseout", () => {
            d3.select(d3.event.target).classed("hight-light", false);
          });

        count++;
      }
    }
    this.initEventDrag();
  }

  /**
   * Calculate height vertex base properties connectted
   * @param id
   * @param isShowFull used in case vertex just have header.
   * @returns {number}
   */
  resetSizeVertex(isShowFull = false) {
    let vertexes = this.dataContainer.vertex;
    vertexes.forEach(vertex => {
      let exitConnect = false;
      let vertexId = vertex.id;
      // Get all prop that not hide
      let arrProp = d3.select(`#${vertexId}`).selectAll('.property:not(.hide)');
      let tmpArry = arrProp._groups[0];
      // When not any edge connect to properties of vertex,
      // Check exit edge connect to vertex
      if (tmpArry.length < 1)
        exitConnect = this.objectUtils.checkExitEdgeConnectToVertex(vertexId);

      let element = $(`#${vertexId} .vertex_content`);
      element.parent()
        .attr('height', tmpArry.length ?
          VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * tmpArry.length : isShowFull ?
            VERTEX_ATTR_SIZE.HEADER_HEIGHT : exitConnect ? VERTEX_ATTR_SIZE.HEADER_HEIGHT : VERTEX_ATTR_SIZE.HEADER_HEIGHT);
      // element.parent()
      //   .attr('height', tmpArry.length ?
      //     VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * tmpArry.length : VERTEX_ATTR_SIZE.HEADER_HEIGHT
    });
  }

  defineVertexDescription(options) {
    return false;
  }
}

export default Vertex;
