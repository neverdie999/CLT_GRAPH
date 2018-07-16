import _ from "lodash";
import * as d3 from 'd3';

class Edge {
  constructor() {
  }

  initialize() {
    this.configsDefault = {
      originNote: null,
      middleNote: null,
      destNote: null,
      callbackOnClick: () => {},
      callbackOnKeyDown: () => {},
      callbackOnFocusOut: () => {},
      selectorArrow: null,
    };
  }

  /**
   *
   * @param svgSelector => type: object, require: true, purpose: the place where the DOM append to
   * @param pathStr => type: string, require: true, purpose: use to draw edge from to
   * @param note => type: object, require: false, default: empty object, purpose: content start, middel, end note
   * @param id => tpe: string, require: true, identify for edge
   * @param callbackOnClick => type: function, require: false, default: anonymous function, purpose: call back drag connection
   * @param callbackOnKeyDown => type: function, require: false, default: anonymous function, purpose: call back drag connection
   * @param callbackOnFocusOut => type: function, require: false, default: anonymous function, purpose: call back drag connection
   * @param selectorArrow => type: string, require: false, default: null, purpose: the selector refer to arrow.
   * @param containerClass => type: string, require: false, purpose: the class used as selector for menu context on edge
   */
  create(sOptions) {
    let defaults = _.cloneDeep(this.configsDefault);
    let configs = _.merge(defaults, sOptions);
    const {svgSelector, pathStr, originNote, middleNote, destNote, id, callbackOnClick, callbackOnKeyDown,
      callbackOnFocusOut, selectorArrow, containerClass} = configs;
    let group = svgSelector.append("g")
      .attr("transform", `translate(0.5, 0.5)`)
      .attr("class", `edge ${containerClass}`)
      .attr("ref", id)
      .style('visibility', 'visible')
      .style('cursor', 'crosshair')
      .on("click", () => {
        callbackOnClick(id);
      })
      .on("focus", () => {
        group.on("keydown", () => {
          callbackOnKeyDown(id, d3.event);
        })
      })
      .on("focusout", () => {
        callbackOnFocusOut();
      });

    group.append("path")
      .attr('d', pathStr)
      .attr("id", id)
      .attr('focusable', true)
      .attr('fill', 'none')
      .attr('stroke', 'white')
      .attr('stroke-miterlimit', 10)
      .attr('pointer-events', 'stroke')
      .attr('visibility', 'hidden')
      .attr('stroke-width', 9)
      .attr("marker-end", `url(${selectorArrow})`);

    group.append("path")
      .attr('d', pathStr)
      .attr("id", id)
      .attr('focusable', true)
      .attr('fill', 'none')
      .attr('stroke', '#000000')
      .attr('stroke-miterlimit', 10)
      .attr('focusable', true)
      .attr("marker-end", `url(${selectorArrow})`); // Make arrow at end path

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
      .attr("id", `originNote${id}`)
      .attr("xlink:href", `#${id}`)
      .attr("startOffset", "0%")
      .text(originNote);

    middle.append("textPath")
      .style("text-anchor", "middle")
      .attr("fill", "#000000")
      .attr("id", `middleNote${id}`)
      .attr("xlink:href", `#${id}`)
      .attr("startOffset", "50%")
      .text(middleNote);

    dest.append("textPath")
      .style("text-anchor", "end")
      .attr("fill", "#000000")
      .attr("id", `destNote${id}`)
      .attr("xlink:href", `#${id}`)
      .attr("startOffset", "100%")
      .text(destNote);
  }
}

export default Edge;
