import * as d3 from 'd3';
import {
  SCREEN_SIZES,
  INTERACTION_TP,
  INTERACTION_TP_LST,
  TYPE_POINT,
  VERTEX_ATTR_SIZE,
  HTML_VERTEX_CONTAINER_CLASS
} from '../../const/index';
import _ from "lodash";
import PopUtils from '../../common/utilities/popup.ult';
import {
  generateObjectId,
  replaceSpecialCharacter,
  cancleSelectedPath,
  createPath,
  autoScrollOnMousedrag,
} from '../../common/utilities/common.ult';

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
    // Get properties vertex from list object vertex type
    let vertexProperties = options.data ? Object.assign({}, options.data) : Object.assign({}, window.vertexTypes[vertexType]);
    let vertexId = options.id ? options.id : generateObjectId('V');
    let parent = options.parent || null;

    let vertexInfo = {
      x: options.x,
      y: options.y,
      vertexType: vertexType,
      name: options.name || vertexType,
      description: options.description || "Description",
      data: vertexProperties,
      id: vertexId,
      parent: parent
    };
    this.dataContainer.vertex.push(vertexInfo);

    //append into vertex group
    let group = this.svgSelector.append("g")
      .attr("transform", `translate(${options.x}, ${options.y})`)
      .attr("id", vertexId)
      .attr("class", `${HTML_VERTEX_CONTAINER_CLASS}`)
      .style("cursor", "move")
      .style("visibility", "visible");

    // Append point connect vertex
    group.append("circle")
      .attr("class", "drag_connect")
      // .attr("fill", "none")
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
    for (const key of Object.keys(vertexProperties)) {
      htmlContent += `
        <div class="property" prop="${key}" style="height: ${VERTEX_ATTR_SIZE.PROP_HEIGHT}px">
          <label class="key" title="${key}">${key}</label><label> : </label>
          <label class="data ${key}" id="${vertexId}${key}" title="${vertexProperties[key]}">${vertexProperties[key]}</label>
        </div>`;
      // Append point connect prop of vertex

      // Input
      group.append("circle")
        .attr("class", "drag_connect")
        .attr("prop", key)
        // .attr("fill", "none")
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
        .attr("prop", key)
        // .attr("fill", "none")
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
    }

    let vertexHeight = VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * count;
    group.append("foreignObject")
      .attr("width", VERTEX_ATTR_SIZE.GROUP_WIDTH)
      .attr("height", vertexHeight)
      .append("xhtml:div")
      .attr("class", "vertex_content")
      .style("font-size", "13px")
      .style("background", "#ffffff")
      .html(`
        <p class="header_name" id="${vertexId}Name" style="height: ${VERTEX_ATTR_SIZE.HEADER_HEIGHT}px">${vertexInfo.name}</p>
        <div class="vertex_data">
          ${htmlContent}
        </div>
      `);

    this.initEventDrag();
  }

  /**
   * Init event drag for all vertex
   */
  initEventDrag() {
    this.svgSelector.selectAll(`.${HTML_VERTEX_CONTAINER_CLASS}`)
      .data(this.dataContainer.vertex)
      .on("mouseover", this.handleMouseOver(this))
      .on("mouseout", this.handleMouseOut(this))
      .call(this.dragRegister);
    d3.selectAll('.drag_connect').call(this.dragConnector);
  }

  /**
   * Handle event start drag vertex
   * @param d
   */
  dragstarted(self) {
    return function (d) {
      // If selected path to purpose update, but then move vertex then cancle it.
      if (window.udpateEdge)
        cancleSelectedPath();
      // d3.event.sourceEvent.stopPropagation();
    }
  }

  /**
   * Handle event move vertex
   * And update position of paths related to this vertex
   * @param d
   */
  dragged(self) {
    return function (d) {
      autoScrollOnMousedrag();
      // Update poition object in this.dataContainer.boundary
      d.x = d3.event.x;
      d.y = d3.event.y;
      // Transform group
      d3.select(`#${d.id}`).attr("transform", (d, i) => {
        return "translate(" + [d3.event.x, d3.event.y] + ")"
      });

      self.updatePathConnect(d.id);
      // let {width, height} = self.objectUtils.getBBoxObject(d.id);
      // let data = {x: d3.event.x, y: d3.event.y, width, height};
      // self.mainMgmt.updateAttrBBoxGroup(data);

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
    return function (d) {
      // d3.select(this).classed("selected", false);
      self.updatePathConnect(d.id);
      // d.x = d3.event.x;
      // d.y = d3.event.y;
      // Transform group
      // d3.select(`#${d.id}`).attr("transform", (d, i) => {
      //   return "translate(" + [d3.event.x, d3.event.y] + ")"
      // });

      // self.mainMgmt.hiddenBBoxGroup();

      if (d.parent) {
        self.mainMgmt.checkDragObjectOutsideBoundary(d);
      } else {
        self.mainMgmt.checkDragObjectInsideBoundary(d, "V");
        self.mainMgmt.resetSizeBoundary();
      }
    }
  }

  handleMouseOver(self) {
    return function (d) {
      // console.log("handleMouseOver", d);
    }
  }

  handleMouseOut(self) {
    return function (d) {
      // console.log("handleMouseOut", d);
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
    // Remove from data container
    let data = _.remove(this.dataContainer.vertex, (e) => {
      return e.id === vertexId;
    });
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
    $(`#vertexId`).val(vertexInfo.id);
    $(`#vertexDesc`).val(vertexInfo.description);

    // Generate properties vertex
    let vertexData = vertexInfo.data;
    let $propertiesGroup = $(`#${HTML_VERTEX_PROPERTIES_ID}`).empty();
    const $rowVertexType = $('<tr>');
    const $vertexType = $('<th>').text(vertexInfo.vertexType);
    $vertexType.attr('colspan', 2);
    $vertexType.attr('class', 'vertex-type');
    $vertexType.appendTo($rowVertexType);
    $rowVertexType.appendTo($propertiesGroup);
    for (const key of Object.keys(vertexData)) {
      const $row = $('<tr>');
      const $th = $('<th>').text(key).appendTo($row);
      const $td = $('<td>');
      const $input = $('<input>');
      $input.attr('type', 'text');
      $input.attr('id', key);
      $input.attr('name', key);
      $input.attr('class', 'form-control');
      $input.val(vertexData[key]);
      $input.appendTo($td);
      $td.appendTo($row);
      $row.appendTo($propertiesGroup);
    }

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

    // Update to origin data
    this.originVertex.name = data.vertexName;
    this.originVertex.description = data.vertexDesc;
    for (const key of Object.keys(this.originVertex.data)) {
      this.originVertex.data[key] = data[key];
    }
    // let index = Object.keys(vertexInfo.data).indexOf(prop);
    this.updateVertexInfo(this.originVertex);
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
    vertexInfo.name = infos.name;
    vertexInfo.description = infos.description;
    d3.select(`#${id}Name`).text(infos.name);
    // Update properties
    for (const key of Object.keys(infos.data)) {
      d3.select(`#${replaceSpecialCharacter(`${id}${key}`)}`).text(infos.data[key]);
      vertexInfo.data[key] = infos.data[key];
    }
  }

  /**
   * Cancle state create edge on vertex
   */
  // cancelCreateEdge() {
  //   window.creatingEdge = false;
  //   window.sourceNode = null;
  // }

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

    // Should consider again...
    // Remove all edge relate to vertex
    // let relatePaths = this.objectUtils.findEdgeRelateToVertex(vertexId);
    // relatePaths.forEach(path => {
    //   this.edgeMgmt.removeEdge(path.id);
    // });
  }

  /**
   * Start creation connect
   * @param self
   * @returns {Function}
   */
  startConnect(self) {
    return function () {
      window.creatingEdge = true;
      d3.event.sourceEvent.stopPropagation();
      let sourceId = d3.select(d3.event.sourceEvent.target.parentNode).attr("id");
      let prop = d3.select(d3.event.sourceEvent.target).attr("prop");
      const source = self.getCoordinateProperty(sourceId, prop, TYPE_POINT.OUTPUT);
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
    return function () {
      if (window.creatingEdge) {
        let x = d3.mouse(d3.select('svg').node())[0];
        let y = d3.mouse(d3.select('svg').node())[1];
        let pathStr = createPath(window.sourceNode, {x, y});
        d3.select('#dummyPath').attr('d', pathStr);
        d3.select('#dummyPath').style("display", "block");
      }
    }
  }

  /**
   * End creation connect if destination is connect point
   * @param self
   * @returns {Function}
   */
  endConnect(self) {
    return function () {
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
    }
  }

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
}

export default Vertex;
