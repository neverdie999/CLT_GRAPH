import Vertex from '../object-mgmt/vertex';
import FileMgmt from '../file-mgmt/file-mgmt';
import MainMenu from '../menu-mgmt/main-menu';
import VertexMenu from '../menu-mgmt/vertex-menu';
import Edge from '../object-mgmt/edge';
import EdgeMenu from '../menu-mgmt/edge-menu';
import Boundary from '../object-mgmt/boundary';
import BoundaryMenu from '../menu-mgmt/boundary-menu';
import BoundaryMenuItems from '../menu-mgmt/boundary-menu-items';
import {comShowMessage, createPath} from '../../common/utilities/common.ult';
import * as d3 from 'd3';
import {
  HTML_ALGETA_CONTAINER_CLASS,
  HTML_VERTEX_CONTAINER_CLASS,
  HTML_EDGE_CONTAINER_CLASS,
  HTML_BOUNDARY_CONTAINER_CLASS,
  BOUNDARY_ATTR_SIZE,
  TYPE_POINT,
} from '../../const/index';
import {HTML_ALGETA_CONTAINER_ID} from "../../const";


class MainMgmt {
  constructor(props) {
    this.svgSelector = props.svgSelector;
    this.objectUtils = props.objectUtils;
    this.dataContainer = props.dataContainer;
    this.initMarkerArrow();
    this.initPathConnect();
    // this.initBoundaryGroup();
    // this.initVertexGroup();
    // this.initEdgeGroup();

    this.dragPointConnector = d3.drag()
      .on("start", this.dragPointStarted(this))
      .on("drag", this.draggedPoint(this))
      .on("end", this.dragPointEnded(this));

    this.initEdgePath();

    /**
     * Init file mgmt
     */
    new FileMgmt({
      mainMgmt: this,
      dataContainer: this.dataContainer
    });

    /**
     * Init Vertex Mgmt
     * @type {VertexMgmt}
     */
    this.vertex = new Vertex({
      svgSelector: this.svgSelector,
      dataContainer: this.dataContainer,
      objectUtils: this.objectUtils,
      mainMgmt: this
    });

    /**
     * Init Edge Mgmt
     * @type {EdgeMgmt}
     */
    this.edge = new Edge({
      svgSelector: this.svgSelector,
      dataContainer: this.dataContainer,
      objectUtils: this.objectUtils,
      mainMgmt: this
    });

    /**
     * Init Boundary Mgmt
     * @type {BoundaryMgmt}
     */
    this.boundary = new Boundary({
      svgSelector: this.svgSelector,
      dataContainer: this.dataContainer,
      objectUtils: this.objectUtils,
      mainMgmt: this
    });
  }

  /**
   * Init Marker Arrow use for edge
   */
  initMarkerArrow() {
    this.svgSelector.append("svg:defs").append("svg:marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 10)
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 z")
      .style("stroke", "black");
  }

  /**
   * Init path connect used to create path
   */
  initPathConnect() {
    this.svgSelector.append("svg:g").append("svg:path")
      .attr("id", "dummyPath")
      .attr("class", "dummy-edge solid")
      .attr("fill", "none")
      .attr("marker-end", "url(#arrow)");
  }

  /**
   * Init path use for simulate change source or target connect
   */
  initEdgePath() {
    let groupPoint = this.svgSelector.append("g")
      .attr("id", "groupEdgePoint");
    let group = this.svgSelector.append("g")
      .attr("id", "groupEdgePath");
    group.append("path")
      .attr("id", "edgePath")
      .attr("class", "dummy-path dash")
      .attr("fill", "none")
      .attr("stroke", "#2795EE");
    // .attr("marker-end", "url(#arrow)");

    // Append point to drag start or end connect point
    groupPoint.append("circle")
      .attr("id", "pointStart")
      .attr("class", "dragPoint")
      .attr("type", TYPE_POINT.OUTPUT)
      .attr("fill", "#2795EE")
      .attr("r", 3)
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .attr("stroke", "#2795EE");

    groupPoint.append("circle")
      .attr("id", "pointEnd")
      .attr("class", "dragPoint")
      .attr("type", TYPE_POINT.INPUT)
      .attr("fill", "#2795EE")
      .attr("r", 3)
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .attr("stroke", "#2795EE");

    d3.selectAll('.dragPoint').call(this.dragPointConnector);
  }

  /**
   * Reload data vertex types when user import
   * For main context and vertex.
   * @param data
   */
  async reloadVertexTypes(data) {
    // Set global vertex types
    // The content vertex type on graph alway
    // give to content vertex type was import from Vertex Type Defination
    window.vertexTypes = data;
    window.isImportVertexTypeDefine = true;

    // Validate vertex type
    let isMisMatch = await this.validateVertexTypesInGraph();

    // Now just show message warning for user. Not stop working
    if (isMisMatch)
      comShowMessage("Vertex type in Vertex Type Definition and Data Graph Structure are mismatch." +
        "\n Please check again!");

    // Init main menu and menu for objects
    this.initMenuContext();
  }

  /**
   * Draw graph with data import by user
   * @param data
   */
  async drawGraphFromData(data) {
    this.clearAll();
    // Store vertex types
    window.vertexTypesTmp = data.vertexTypes;

    // Validate content
    let errorContent = await this.validateGraphDataStructure(data);
    if (errorContent) {
      comShowMessage("Format or data in Data Graph Structure is corrupted. You should check it!");
      return;
    }

    // If still not import Vertex Type Definition then reset it.
    if (!window.isImportVertexTypeDefine)
      window.vertexTypes = null;

    // Validate vertex type
    let isMisMatch = await this.validateVertexTypesInGraph();
    // Now just show message warning for user. Not stop working
    if (isMisMatch)
      comShowMessage("Vertex type in Vertex Type Definition and Data Graph Structure are mismatch." +
        "\n Please check again!");

    // Draw boundary
    let arrBoundary = data.boundary;
    arrBoundary.forEach(boundary => {
      let pos = data.position.find(element => {
        return element.id === boundary.id;
      });
      boundary.x = pos.x;
      boundary.y = pos.y;
      this.boundary.createBoundary(boundary);
    });

    // Draw vertex
    let arrVertex = data.vertex;
    arrVertex.forEach(vertex => {
      let pos = data.position.find(element => {
        return element.id === vertex.id;
      });
      vertex.x = pos.x;
      vertex.y = pos.y;
      this.vertex.createVertex(vertex);
    });

    // Draw edge
    let arrEdge = data.edge;
    arrEdge.forEach(edge => {
      this.edge.createEdge(edge);
    });

    // Rescan child of boundary to reset size
    arrBoundary.forEach(boundary => {
      const members = boundary.member;
      members.forEach(mem => {
        if (!mem.show)
          this.boundary.selectMemberVisible(boundary.id, mem, true);
      });
    });

    if (!window.isImportVertexTypeDefine)
      window.vertexTypes = data.vertexTypes;

    this.initMenuContext();
  }

  /**
   * Validate Graph Data Structure
   * with embedded vertex type
   * Validate content
   */
  async validateGraphDataStructure(data) {
    // Validate struct data
    if (!data.vertex || !data.edge || !data.boundary || !data.position || !data.vertexTypes) {
      return Promise.resolve(true);
    }

    // Validate embedded vertex type with vertices
    let vertexTypes = data.vertexTypes;
    let vertices = data.vertex;
    for (let vertex of vertices) {
      let vertexType = vertex.vertexType;
      // If vertex type not exit in embedded vertex type
      if (!vertexTypes[vertexType]) {
        console.log("GraphDataStructure Vertex type in graph data not exit in embedded vertex type");
        return Promise.resolve(true);
      }

      let keySource = Object.keys(vertex.data);
      let keyTarget = Object.keys(vertexTypes[vertexType]);
      // Check length key
      if (this.checkLengthMisMatch(keySource, keyTarget)) {
        console.log("GraphDataStructure length is different");
        return Promise.resolve(true);
      }

      // Check mismatch key
      let flag = await this.checkKeyMisMatch(keySource, keyTarget);

      if (flag) {
        console.log("GraphDataStructure Key vertex at source not exit in target");
        return Promise.resolve(true);
      }
    }

    return Promise.resolve(false);
  }

  /**
   * Validate Embedded Vertex Types in Graph Data Structure
   * with Vertex Type Definition
   */
  async validateVertexTypesInGraph() {
    if (!window.vertexTypes || !window.vertexTypesTmp) {
      console.log("Targe or soruce is null");
      return Promise.resolve(false);
    }

    // Compare length
    let vertexUse = Object.keys(window.vertexTypes);
    let vertexTmp = Object.keys(window.vertexTypesTmp);
    if (this.checkLengthMisMatch(vertexUse, vertexTmp)) {
      console.log("Length is different");
      return Promise.resolve(true);
    }

    // Check key exit
    let flag = await this.checkKeyMisMatch(vertexUse, vertexTmp);

    if (flag) {
      console.log("Key vertex at source not exit in target");
      return Promise.resolve(true);
    }

    // Check data key in every vertex type
    for (let key of vertexUse) {
      let src = Object.keys(window.vertexTypes[key]);
      let tgt = Object.keys(window.vertexTypesTmp[key]);
      if (this.checkLengthMisMatch(src, tgt)) {
        console.log("Length of vertex element is different");
        return Promise.resolve(true);
      }

      let misMatchKey = await this.checkKeyMisMatch(src, tgt);
      if (misMatchKey) {
        console.log("Key of vertex element is different");
        return Promise.resolve(true);
      }
    }
    return Promise.resolve(false);
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
   * Init context menu on object
   * When read file vertex type
   * Or when read file graph data
   */
  initMenuContext() {
    // Remove old menu dom if exit
    d3.selectAll(".context-menu-list").remove();

    // Main menu
    this.mainMenu = new MainMenu({
      selector: `.${HTML_ALGETA_CONTAINER_CLASS}`,
      mainMgmt: this
    });

    // Vertex menu
    this.vertexMenu = new VertexMenu({
      selector: `.${HTML_VERTEX_CONTAINER_CLASS}`,
      vertex: this.vertex,
      objectUtils: this.objectUtils,
      dataContainer: this.dataContainer
    });

    // Vertex menu
    this.edgeMenu = new EdgeMenu({
      selector: `.${HTML_EDGE_CONTAINER_CLASS}`,
      edge: this.edge,
    });

    // Boundary menu
    this.boundaryMenu = new BoundaryMenu({
      selector: `.${HTML_BOUNDARY_CONTAINER_CLASS}`,
      boundary: this.boundary,
      dataContainer: this.dataContainer
    });

    // Boundary Menu Items
    this.boundaryMenuItems = new BoundaryMenuItems({
      selector: `.${HTML_BOUNDARY_CONTAINER_CLASS}`,
      boundary: this.boundary,
      objectUtils: this.objectUtils
    });
  }

  createVertex(opt) {
    this.vertex.createVertex(opt);
  }

  createEdge(opt) {
    this.edge.createEdge(opt);
  }

  createBoundary(opt) {
    this.boundary.createBoundary(opt);
  }

  updatePathConnect(edgeId, opt) {
    this.edge.updatePathConnect(edgeId, opt);
  }

  /**
   * When a vertex|boundary move
   * Resize if any boundary with size smaller than vertex|boundary size
   */
  reSizeBoundaryAsObjectDragged(infos) {
    // Get box object
    const {height, width} = this.objectUtils.getBBoxObject(infos.id);

    d3.select("svg").selectAll(`.${HTML_BOUNDARY_CONTAINER_CLASS}`).each((d, i, node) => {
      if (d.id != infos.id && !d.parent) {
        let boundaryId = d.id;
        let bBox = this.objectUtils.getBBoxObject(boundaryId);
        if (height >= bBox.height)
          this.boundary.setHeightBoundary(boundaryId, height + 43);
        if (width >= bBox.width)
          this.boundary.setWidthBoundary(boundaryId, width + 15);
      }
    });
  }

  /**
   * Reset size boundary when an boundary|vertex drag end.
   */
  resetSizeBoundary() {
    d3.select("svg").selectAll(`.${HTML_BOUNDARY_CONTAINER_CLASS}`).each((d, i, node) => {
      let orderObject = 0;
      let hBeforeElements = 42;
      let wBoundary = BOUNDARY_ATTR_SIZE.BOUND_WIDTH;
      let marginTop = 5;
      let boundaryId = d.id;
      let boundaryMembers = d.member;

      boundaryMembers.forEach(member => {
        if (member.show) {
          let objectId = member.id;
          const {width, height} = this.objectUtils.getBBoxObject(objectId);
          orderObject++;
          hBeforeElements += height;
          if (width > wBoundary)
            wBoundary = width + (member.type === "B" ? 10 : 0);
        }
      });

      let hBoundary = hBeforeElements + marginTop * orderObject;
      this.boundary.setHeightBoundary(boundaryId, hBoundary);
      this.boundary.setWidthBoundary(boundaryId, wBoundary);
    });
  }

  // Check drag inside boundary
  checkDragObjectInsideBoundary(srcInfos, type) {
    // Get box object
    const {height, width} = this.objectUtils.getBBoxObject(srcInfos.id);
    let xSrc = srcInfos.x;
    let ySrc = srcInfos.y;
    let hBSrc = xSrc + width;
    let wBSrc = ySrc + height;

    d3.select("svg").selectAll(`.${HTML_BOUNDARY_CONTAINER_CLASS}`).each((d, i, node) => {
      // The condition d.id != srcInfos.id user for check inside boundary
      // But it not affect to check inside vertex
      if (!d.parent && d.id != srcInfos.id) {
        // Calculate box for boundary
        let boundaryId = d.id;
        let xTar = d.x;
        let yTar = d.y;
        let bBoxTar = this.objectUtils.getBBoxObject(d.id);
        let hBTar = xTar + bBoxTar.width;
        let wBTar = yTar + bBoxTar.height;

        // Condition drop inside a boundary
        if ((xSrc >= xTar) && (ySrc >= yTar) && (hBSrc <= hBTar) && (wBSrc <= wBTar)) {
          let member = {id: srcInfos.id, type, show: true};
          this.boundary.addMemberToBoundary(boundaryId, member);
          srcInfos.parent = boundaryId;
        }
      }
    });
  }

  /**
   * Check drag outside boundary
   */
  checkDragObjectOutsideBoundary(srcInfos) {
    // Get box object
    const {height, width} = this.objectUtils.getBBoxObject(srcInfos.id);
    let xSrc = srcInfos.x;
    let ySrc = srcInfos.y;
    let hBSrc = xSrc + width;
    let wBSrc = ySrc + height;

    // Parent
    let parentId = srcInfos.parent;
    const {x, y} = this.objectUtils.getBoundaryInfoById(parentId);
    let pBox = this.objectUtils.getBBoxObject(parentId);
    let xParent = x + pBox.width;
    let yParent = y + pBox.height;

    // Check drag outside a boundary
    if ((xSrc < x) || (ySrc < y) || (hBSrc > xParent) || (wBSrc > yParent)) {
      this.boundary.removeMemberFromBoundary(parentId, srcInfos.id);
      srcInfos.parent = null;
    }
  }

  // Set vertex position
  setVertexPosition(vertexId, position) {
    this.vertex.setVertexPosition(vertexId, position);
  }

  // Delete vertex call from removeChildElementsBoundary
  deleteVertex(vertexId) {
    this.vertex.deleteVertex(vertexId);
  }

  /**
   * Clear all element on graph
   * And reinit marker def
   */
  clearAll() {
    // Delete all element inside SVG
    d3.select("svg").selectAll("*").remove();

    // Clear all data cotainer for vertex, boundary, edge
    this.dataContainer.vertex = [];
    this.dataContainer.boundary = [];
    this.dataContainer.edge = [];
    this.initMarkerArrow();
    this.initPathConnect();
    this.initEdgePath();
    // this.initBoundaryGroup();
    // this.initVertexGroup();
    // this.initEdgeGroup();
  }

  /**
   * Start drag point connect
   * @param self
   * @returns {Function}
   */
  dragPointStarted(self) {
    return function () {
      window.udpateEdge = true;
    }
  }

  /**
   * Drag connect belong to mouse position
   * @param self
   * @returns {Function}
   */
  draggedPoint(self) {
    return function () {
      if (!window.udpateEdge)
        return;

      let pathStr = null;
      let x = d3.mouse(d3.select('svg').node())[0];
      let y = d3.mouse(d3.select('svg').node())[1];
      const type = d3.select(this).attr("type");
      if (type === "O") {
        let px = Number(d3.select("#pointEnd").attr("cx"));
        let py = Number(d3.select("#pointEnd").attr("cy"));
        pathStr = createPath({x: x - 1, y: y - 1}, {x: px, y: py});
      } else {
        let px = Number(d3.select("#pointStart").attr("cx"));
        let py = Number(d3.select("#pointStart").attr("cy"));
        pathStr = createPath({x: px, y: py}, {x: x - 1, y: y - 1});
      }

      d3.select('#edgePath').attr('d', pathStr);
      d3.select('#edgePath').style("display", "block");
    }
  }

  /**
   * End creation connect if destination is connect point
   * @param self
   * @returns {Function}
   */
  dragPointEnded(self) {
    return function () {
      if (d3.event.sourceEvent.target.tagName == "circle" && this != d3.event.sourceEvent.target) {
        window.udpateEdge = false;
        const type = d3.select(this).attr("type");
        let refId = d3.select(d3.event.sourceEvent.target.parentNode).attr("id");
        let prop = d3.select(d3.event.sourceEvent.target).attr("prop");
        let edgeId = d3.select('#edgePath').attr('ref');
        let edgeInfo = self.objectUtils.getEdgeInfoById(edgeId);
        const refObj = self.vertex.getCoordinateProperty(refId, prop, type);
        refObj.vertexId = refId;
        refObj.prop = prop;
        type === "O" ? self.edge.updatePathConnect(edgeId, {source: refObj}) : self.edge.updatePathConnect(edgeId, {target: refObj});

        d3.select('#groupEdgePoint').style("display", "none");
        d3.select("#groupEdgePoint").moveToBack();
      }

      d3.select('#edgePath').style("display", "none");
      d3.select("#edgePath").moveToBack();
    }
  }

  /**
   * Show boundary, vertex reduced as policy
   * Show graph elements connected by edges only
   * Boundary: show vertices which have any edges only and boundaries
   * Vertex: show header and connected properties only
   */
  showReduced() {
    window.showReduced = true;
    let edge = this.dataContainer.edge;
    // let boundary = this.dataContainer.boundary;
    // d3.selectAll('.groupVertex').classed("hide", true);  // Set Hide all Vertex
    d3.selectAll('.drag_connect').classed("hide", true); // Set Hide all Circle
    d3.selectAll('.property').classed("hide", true);  // Set Hide all property on the Vertex
    let lstVer = [], lstProp = [];
    // Get vertex and property can display
    edge.forEach((edgeItem) => {
      // if (lstVer.indexOf(edgeItem.source.vertexId) === -1) {
      //   lstVer.push(edgeItem.source.vertexId);
      // }
      // if (lstVer.indexOf(edgeItem.target.vertexId) === -1) {
      //   lstVer.push(edgeItem.target.vertexId);
      // }
      lstProp.push({
        vert: edgeItem.source.vertexId,
        prop: edgeItem.source.prop
      }, {vert: edgeItem.target.vertexId, prop: edgeItem.target.prop});
    });

    // lstVer.forEach((vertexItem) => {
    //   let arrPropOfVertex = [];
    //   lstProp.forEach((propItem) => {
    //     if (propItem.vert === vertexItem) {
    //       if (arrPropOfVertex.indexOf(propItem.prop) === -1) {
    //         arrPropOfVertex.push(propItem.prop);
    //       }
    //     }
    //   });
    //   d3.select(`#${vertexItem}`).classed("hide", false); // Enable Vertex
    //   arrPropOfVertex.forEach((propItem) => {
    //     d3.select(`#${vertexItem}`).select(".property[prop='" + propItem + "']").classed("hide", false);
    //   });
    //   this.vertex.updatePathConnect(vertexItem); // Re-draw edge
    //   /* Update Circle */
    //   d3.select(`#${vertexItem}`).selectAll('.drag_connect:first-child').classed("hide", false);
    //   this.vertex.updateCircle(arrPropOfVertex, d3.select(`#${vertexItem}`));
    // });

    lstVer = this.dataContainer.vertex;
    lstVer.forEach((vertexItem) => {
      let arrPropOfVertex = [];
      lstProp.forEach((propItem) => {
        if (propItem.vert === vertexItem.id) {
          if (arrPropOfVertex.indexOf(propItem.prop) === -1) {
            arrPropOfVertex.push(propItem.prop);
          }
        }
      });
      d3.select(`#${vertexItem.id}`).classed("hide", false); // Enable Vertex
      arrPropOfVertex.forEach((propItem) => {
        d3.select(`#${vertexItem.id}`).select(".property[prop='" + propItem + "']").classed("hide", false);
      });
      this.vertex.updatePathConnect(vertexItem); // Re-draw edge
      /* Update Circle */
      d3.select(`#${vertexItem.id}`).selectAll('.drag_connect:first-child').classed("hide", false);
      this.vertex.updateCircle(arrPropOfVertex, d3.select(`#${vertexItem.id}`));
    });

    this.vertex.resetSizeVertex(false);
    // Get all boundary that without parent but have child
    let boundaries = _.filter(this.dataContainer.boundary, (g) => {
      return g.parent != null;
    });
    boundaries.forEach(boundary => {
      this.boundary.resizeParentBoundary(boundary.id);
    });
    boundaries = _.filter(this.dataContainer.boundary, (g) => {
      return g.parent == null && g.member.length > 0;
    });
    boundaries.forEach(boundary => {
      this.boundary.reorderPositionMember(boundary.id);
    });
  }

  /**
   * Show full graph
   */
  showFull() {
    let boundary = this.dataContainer.boundary;
    window.showReduced = false;
    /** Vertex **/
    d3.selectAll('.drag_connect.reduced').remove();
    d3.selectAll('.groupVertex').classed("hide", false);
    d3.selectAll('.property').classed("hide", false);
    d3.selectAll('.drag_connect').classed("hide", false);
    $(".edge ").fadeIn();
    // Re-draw edge
    this.dataContainer.vertex.forEach(v => {
      this.vertex.updatePathConnect(v.id);
    });
    this.vertex.resetSizeVertex(true);
    // Get all boundary that without parent but have child
    let boundaries = _.filter(this.dataContainer.boundary, (g) => {
      return g.parent != null;
    });
    boundaries.forEach(boundary => {
      this.boundary.resizeParentBoundary(boundary.id);
    });
    boundaries = _.filter(this.dataContainer.boundary, (g) => {
      return g.parent == null && g.member.length > 0;
    });
    boundaries.forEach(boundary => {
      this.boundary.reorderPositionMember(boundary.id);
    });
  }

  /**
   * Init boundary group
   * When create boundary, it will append into this group
   */
  initBoundaryGroup() {
    this.svgSelector.append("svg:g")
      .attr("class", "boundaryGroup")
      .attr("id", "groupB")
      .attr("orient", "auto");
  }

  /**
   * Init vertex group
   * When create vertex, it will append into this group
   */
  initVertexGroup() {
    this.svgSelector.append("svg:g")
      .attr("class", "vertexGroup")
      .attr("id", "groupV")
      .attr("orient", "auto");
  }

  /**
   * Init edge group
   * When create edge, it will append into this group
   */
  initEdgeGroup() {
    this.svgSelector.append("svg:g")
      .attr("class", "egdeGroup")
      .attr("id", "groupE")
      .attr("orient", "auto");
  }
};
export default MainMgmt;
