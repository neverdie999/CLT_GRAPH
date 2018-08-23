import _ from "lodash";
import * as d3 from 'd3';

import { LINE_TYPE } from "../../../common/const/index";
import { generateObjectId, createPath } from "../../../common/utilities/common.ult";

class Edge {
  constructor(props) {
    this.dataContainer      = props.edgeMgmt.dataContainer;
    this.svgId              = props.edgeMgmt.svgId;
    this.selectorClass      = props.edgeMgmt.selectorClass;
    this.arrowId            = props.edgeMgmt.arrowId;
    this.edgeMgmt           = props.edgeMgmt;

    this.groupEdgePathId    = props.edgeMgmt.groupEdgePathId;
    this.edgePathId         = props.edgeMgmt.edgePathId;
    this.groupEdgePointId   = props.edgeMgmt.groupEdgePointId;
    this.pointStartId       = props.edgeMgmt.pointStartId;
    this.pointEndId         = props.edgeMgmt.pointEndId;
    this.dummyPathId        = props.edgeMgmt.dummyPathId;

    this.id;
    this.source;
    this.target;
    this.lineType = LINE_TYPE.SOLID;// "S" or "D" (Solid/Dash)
    this.useMarker = "Y"; // "Y" | "N"
    this.originNote = '';
    this.middleNote = '';
    this.destNote = '';

    this.initialize();
  }

  initialize() {
    
    this.limitTop       = 0;
    this.limitBottom    = $(window).height();
    this.limitLeft      = 0;
    this.limitRight     = $(window).width();
  };

  /**
   *
   * @param svgSelector => type: object, require: true, purpose: the place where the DOM append to
   * @param pathStr => type: string, require: true, purpose: use to draw edge from to
   * @param note => type: object, require: false, default: empty object, purpose: content start, middel, end note
   * @param id => tpe: string, require: true, identify for edge
   * @param callbackOnClick => type: function, require: false, default: anonymous function, purpose: call back drag connection
   * @param callbackOnKeyDown => type: function, require: false, default: anonymous function, purpose: call back drag connection
   * @param callbackOnFocusOut => type: function, require: false, default: anonymous function, purpose: call back drag connection
   * @param containerClass => type: string, require: false, purpose: the class used as selector for menu context on edge
   */
  create(sOptions) {

    const {id, source, target, style , note} = sOptions;

    this.id = id || generateObjectId('E');
    this.source = source;
    this.target = target;

    if(style){
      this.lineType = style.line;
      this.useMarker = style.arrow;
    }
    if(note){
      this.originNote = note.originNote;
      this.middleNote = note.middleNote;
      this.destNote = note.destNote;
    }

    if(!this.dataContainer.edge) this.dataContainer.edge = [];
    this.dataContainer.edge.push(this);

    let pathStr = createPath(this.source, this.target);

    //Edge group
    let group = d3.select(`#${this.svgId}`).append("g")
      .attr("transform", `translate(0.5, 0.5)`)
      .attr("class", `edge ${this.selectorClass}`)
      .attr("ref", this.id)
      .style('visibility', 'visible')
      .style('cursor', 'crosshair')
      .on("click", () => {
        this.handlerOnClickEdge();
      })
      .on("focus", () => {
        group.on("keydown", () => {
          //callbackOnKeyDown(this.id, d3.event);
          if (event.keyCode === 46 || event.keyCode === 8) {
            this.remove();
          }
        })
      })
      .on("focusout", () => {
        this.handleOnFocusOut();
      });

    //hidden line, it has larger width for selecting easily
    group.append("path")
      .attr('d', pathStr)
      .attr("id", this.id)
      .attr('focusable', true)
      .attr('fill', 'none')
      .attr('stroke', 'white')
      .attr('stroke-miterlimit', 10)
      .attr('pointer-events', 'stroke')
      .attr('visibility', 'hidden')
      .attr('stroke-width', 9)
      .attr("marker-end", `url(#${this.arrowId})`);

    group.append("path")
      .attr('d', pathStr)
      .attr("id", this.id)
      .attr('focusable', true)
      .attr('fill', 'none')
      .attr('stroke', '#000000')
      .attr('stroke-miterlimit', 10)
      .attr('focusable', true)
      .attr("marker-end", this.useMarker === 'Y' ? `url(#${this.arrowId})` : '')
      .attr("stroke-dasharray", this.lineType === LINE_TYPE.SOLID ? '0 0' : '3 3'); // Make arrow at end path

    let origin = group.append("text")
      .style("font-size", "12px")
      .attr("x", 5)   // Move the text from the start angle of the arc
      .attr("dy", -5); // Move the text down
    let middle = group.append("text")
      .style("font-size", "12px")
      .attr("dy", -5); // Move the text down
    let dest = group.append("text")
      .style("font-size", "12px")
      .attr("x", -5)   // Move the text from the start angle of the arc
      .attr("dy", -5); // Move the text down

    origin.append("textPath")
      .style("text-anchor", "start")
      .attr("fill", "#000000")
      .attr("id", `originNote${this.id}`)
      .attr("xlink:href", `#${this.id}`)
      .attr("startOffset", "0%")
      .text(this.originNote);

    middle.append("textPath")
      .style("text-anchor", "middle")
      .attr("fill", "#000000")
      .attr("id", `middleNote${this.id}`)
      .attr("xlink:href", `#${this.id}`)
      .attr("startOffset", "50%")
      .text(this.middleNote);

    dest.append("textPath")
      .style("text-anchor", "end")
      .attr("fill", "#000000")
      .attr("id", `destNote${this.id}`)
      .attr("xlink:href", `#${this.id}`)
      .attr("startOffset", "100%")
      .text(this.destNote);
  }

  /**
   * Handler on click a path connection
   * @param edgeId
   * @param source
   * @param target
   */
  handlerOnClickEdge() {
    this.edgeMgmt.selectingEdge = this;

    let selected = d3.select(`#${this.id}`);
    let currentPath = selected.attr("d");
    d3.select(`#${this.groupEdgePointId}`)
      .style("display", "block")
      .moveToFront();
    d3.select(`#${this.groupEdgePathId}`)
      .style("display", "block")
      .moveToFront();
    d3.select(`#${this.edgePathId}`)
      .attr("d", currentPath)
      .attr("ref", this.id);

    d3.select(`#${this.pointStartId}`)
      .attr("cx", this.source.x)
      .attr("cy", this.source.y);
    d3.select(`#${this.pointEndId}`)
      .attr("cx", this.target.x)
      .attr("cy", this.target.y);
  }

  handleOnFocusOut() {
    this.edgeMgmt.selectingEdge = null;

    d3.select(`#${this.groupEdgePathId}`).style("display", "none");
    d3.select(`#${this.groupEdgePointId}`).style("display", "none");
    d3.select(`#${this.groupEdgePointId}`).moveToBack();
    d3.select(`#${this.groupEdgePathId}`).moveToBack();
  }

  /**
   * Remove edge by id
   * @param edgeId
   */
  remove() {
    // Remove from DOM
    let selected = d3.select(`#${this.id}`);
    if (selected) {
      selected.node().parentNode.remove();
      // Mutates array edge
      _.remove(this.dataContainer.edge, (e) => {
        return e.id === this.id;
      });
    }
  }

  /**
   * Update attribute d of path (connect)
   * @param id
   * @param options: object
   */
  updatePathConnect(sOptions = {}) {
    _.merge(this, sOptions);
    const {source, target} = this;
    let pathStr = createPath(source, target);
    // Get DOM and update attribute
    d3.selectAll(`#${this.id}`).attr('d', pathStr);
  }

  setStatusEdgeOnCurrentView() {
    const {id, source: {x: xSrc, y: ySrc, svgId: svgSrc}, target: {x: xDes, y: yDes, svgId: svgDes}} = this;

    let srcContainerRect  = $(`#${svgSrc}`)[0].parentNode.getBoundingClientRect();
    let desContainerRect  = $(`#${svgDes}`)[0].parentNode.getBoundingClientRect();

    let srcOffsetRight = 0; // thickness of vertical scrollbar
    let srcOffsetBottom = 0; // thickness of horizontal scrollbar
    let desOffsetRight = 0; // thickness of vertical scrollbar
    let desOffsetBottom = 0; // thickness of horizontal scrollbar

    if ($(`#${svgSrc}`)[0].parentNode.scrollHeight  > $($(`#${svgSrc}`)[0].parentNode).height()) srcOffsetRight = 10;
    if ($(`#${svgSrc}`)[0].parentNode.scrollWidth   > $($(`#${svgSrc}`)[0].parentNode).width()) srcOffsetBottom = 10;
    if ($(`#${svgDes}`)[0].parentNode.scrollHeight  > $($(`#${svgDes}`)[0].parentNode).height()) desOffsetRight = 10;
    if ($(`#${svgDes}`)[0].parentNode.scrollWidth   > $($(`#${svgDes}`)[0].parentNode).width()) desOffsetBottom = 10;

    const node = d3.select(`#${id}`);
    if (   xSrc < srcContainerRect.left || xSrc > srcContainerRect.right - srcOffsetRight 
        || ySrc < srcContainerRect.top  || ySrc > srcContainerRect.bottom - srcOffsetBottom
        || xDes < desContainerRect.left || xDes > desContainerRect.right - desOffsetRight 
        || yDes < desContainerRect.top  || yDes > desContainerRect.bottom - desOffsetBottom
    ) {
      if (node.node()) {
        d3.select(node.node().parentNode).classed('hide-edge-on-parent-scroll', true);
      }
    } else {
      if (node.node()) {
        d3.select(node.node().parentNode).classed('hide-edge-on-parent-scroll', false);
      }
    }
  }

  /**
   * Set text note on edge
   * @param value changed value
   * @param targetNote originNote | middleNote | destNote
   */
  setNote(value, targetNote) {
    this[targetNote] = value;

    // Update note on view
    d3.select(`#${targetNote}${this.id}`)
      .text(value);
  }

  /**
   * Set style path connect solid, dash
   * @param type
   */
  setLineType(type) {
    this.lineType = type;
    let path = d3.selectAll(`#${this.id}`).filter((d, i) => {
      return i == 1;
    });
    path.style('stroke-dasharray', type === LINE_TYPE.SOLID ? '0 0' : '3 3');
  }

  /**
   * Set use arrow marker
   * @param flag
   */
  setUseMarker(flag) {
    this.useMarker = flag;
    d3.selectAll(`#${this.id}`).attr('marker-end', flag === 'Y' ? `url(#${this.arrowId})` : '');
  }
}

export default Edge;