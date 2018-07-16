import {
  BOUNDARY_ATTR_SIZE,
} from '../../const/index';
import ColorHash from 'color-hash';
import _ from "lodash";

class Boundary{
  constructor(props) {
    this.initialize();
  }

  initialize() {
    this.colorHash = new ColorHash({lightness: 0.2});
    this.configsDefault = {
      width: BOUNDARY_ATTR_SIZE.BOUND_WIDTH,
      height: BOUNDARY_ATTR_SIZE.BOUND_HEIGHT,
      callbackDragBoundary: () => {},
    };
  }

  /**
   * Create boundary with options
   * @param x => type: number, require: true, purpose: coordinate x
   * @param y => type: number, require: true, purpose: coordinate y
   * @param name => type: string, require: false, purpose: vertex name
   * @param description => type: string, require: false, purpose: content title when hover to boundary
   * @param id => type: string, require: true, purpose: identify for boundary
   * @param width => type: number, require: true, purpose: width boundary
   * @param height => type: number, require: true, purpose: height boundary
   * @param svgSelector => type: object, require: true, purpose: the place where the DOM append to
   * @param dataContainer => type: array, require: true, purpose: the datum that used by D3js to manipulate DOM
   * @param containerClass => type: string, require: true, purpose: the class that used by D3js to make corresponding the DOM and data
   * and selector for menu context on boundary
   * @param menuItemClass => type: function, require: false, purpose: selector for menu items context on boundary, if
   * dismiss then not show button menu items.
   */
  create(sOptions, dataContainer) {
    // let options = _.cloneDeep(sOptions);
    let origin = _.cloneDeep(this.configsDefault);
    let configs = _.merge(origin, sOptions);

    let {x, y, name, description, id, width, height, svgSelector, containerClass, menuItemClass, callbackDragBoundary} = configs;

    let group = svgSelector.selectAll(`.${containerClass}`)
      .data(dataContainer)
      .enter()
      .append("g")
      .attr("transform", `translate(${x}, ${y})`)
      .attr("id", id)
      .attr("class", `${containerClass}`)
      .style("cursor", "move")
      .call(callbackDragBoundary);

    group.append("foreignObject")
      .attr("id", `${id}Content`)
      .attr("width", width)
      .attr("height", height)
      .style("border", "solid 1px")
      .style("border-color", this.colorHash.hex(name))
      .style("font-size", "13px")
      .style("background", "none")
      .style("pointer-events", "none")
      .append("xhtml:div")
      .attr("class", "boundary_content")
      .html(`
          <div class="boundary_header" style="pointer-events: all">
            <p id="${id}Header" class="header_name header_boundary" style="width: 100%;
             height: ${BOUNDARY_ATTR_SIZE.HEADER_HEIGHT}px;
             background-color: ${this.colorHash.hex(name)}" 
             title="${description}">${name}</p>
          </div>
      `);

    if(menuItemClass) {
      group.append("text")
        .attr("id", `${id}Text`)
        .attr("x", width - 20)
        .attr("y", BOUNDARY_ATTR_SIZE.HEADER_HEIGHT - 14)
        .style("fill", "#ffffff")
        .style("stroke", "#ffffff")
        .style("pointer-events", "all")
        .text("+");

      group.append("rect")
        .attr("x", width - 25)
        .attr("y", 9)
        .attr("class", `boundary_right ${menuItemClass}`)
        .attr("id", `${id}Button`)
        .attr("data", id)
        .style("pointer-events", "all")
        .style("fill", "none")
        .append("title")
        .text("Right click to select visible member");
    }
  }
}

export default Boundary
