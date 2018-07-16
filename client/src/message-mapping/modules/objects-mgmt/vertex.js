import {
  VERTEX_ATTR_SIZE,
  CONNECT_SIDE,
  TYPE_CONNECT,
} from '../../const/index';
import ColorHash from 'color-hash';
import _ from "lodash";

const CONNECT_KEY = 'Connected';

class Vertex {
  constructor(props) {
    this.initialize();
  }

  initialize() {
    this.colorHash = new ColorHash({lightness: 0.7});
    this.colorHashConnection = new ColorHash({lightness: 0.8});
    this.configsDefault = {
      data: new Array(),
      callbackDragVertex: () => {},
      callbackDragConnection: () => {},
    };
  }

  /**
   * Create vertex with options
   * @param x => type: number, require: true, purpose: coordinate x
   * @param y => type: number, require: true, purpose: coordinate y
   * @param name => type: string, require: false, purpose: vertex name
   * @param description => type: string, require: false, purpose: content title when hover to vertex
   * @param id => type: string, require: true, purpose: identify for vertex
   * @param data => type: array, require: false, default: empty array, purpose: define the content of vertex
   * @param connectSide => type: string, require: false, the default value is an anonymous function not handle anything.
   * @param presentation => type: object, require: true if @param[data] defined
   * @param svgSelector => type: object, require: true, purpose: the place where the DOM append to
   * @param containerClass => type: string, require: true, purpose: the class that used by D3js to make corresponding the DOM and data
   * and selector for menu context on vertex
   * @param dataContainer => type: array, require: true, purpose: the datum that used by D3js to manipulate DOM
   * @param callbackDragVertex => type: function, require: false, default: anonymous function, purpose: call back drag vertex
   * @param callbackDragConnection => type: function, require: false, default: anonymous function, purpose: call back drag connection
   */
  create(sOptions, dataContainer) {
    let origin = _.cloneDeep(this.configsDefault);
    let configs = _.merge(origin, sOptions);

    let {x, y, name, description, id, data: elements, connectSide, presentation, svgSelector, containerClass, callbackDragVertex, callbackDragConnection} = configs;

    let group = svgSelector.selectAll(`.${containerClass}`)
      .data(dataContainer)
      .enter().append("g")
      .attr("transform", `translate(${x}, ${y})`)
      .attr("id", id)
      .style("pointer-events", "none")
      .attr("class", `${containerClass}`)
      .call(callbackDragVertex);

    let htmlContent = '';
    let countData = elements.length;
    for (let i = 0; i < countData; i++) {
      let data = elements[i];
      htmlContent += `
        <div class="property" prop="${id}${CONNECT_KEY}${i}" style="height: ${VERTEX_ATTR_SIZE.PROP_HEIGHT}px">
          <label class="key" id="${id}_${presentation.key}_${i}" title="${data[presentation.keyTooltip] || "No data to show"}">${data[presentation.key] || ""}</label><label> : </label>
          <label class="data" id="${id}_${presentation.value}_${i}" title="${data[presentation.valueTooltip] || "No data to show"}">${data[presentation.value] || ""}</label>
        </div>`;
    }

    let vertexHeight = VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * countData;

    group.append("foreignObject")
      .attr("width", VERTEX_ATTR_SIZE.GROUP_WIDTH)
      .attr("height", vertexHeight)
      .append("xhtml:div")
      .attr("class", "vertex_content")
      .html(`
        <p class="header_name" id="${id}Name" title="${description}" 
          style="height: ${VERTEX_ATTR_SIZE.HEADER_HEIGHT}px;
          background-color: ${this.colorHash.hex(name)};
          cursor: move; pointer-events: all">${name}</p>
        <div class="vertex_data" style="pointer-events: none">
          ${htmlContent}
        </div>
      `);

    for (let i = 0; i < countData; i++) {
      // Input
      if (connectSide === CONNECT_SIDE.BOTH || connectSide === CONNECT_SIDE.LEFT)
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
          .call(callbackDragConnection);

      // Output
      if (connectSide === CONNECT_SIDE.BOTH || connectSide === CONNECT_SIDE.RIGHT)
        group.append("rect")
          .attr("class", "drag_connect")
          .attr("prop", `${id}${CONNECT_KEY}${i}`)
          .attr("pointer-events", "all")
          .attr("type", TYPE_CONNECT.OUTPUT)
          .attr("width", 12)
          .attr("height", 25)
          .attr("x", VERTEX_ATTR_SIZE.GROUP_WIDTH - (VERTEX_ATTR_SIZE.PROP_HEIGHT / 2))
          .attr("y", VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * i + 1)
          .style("fill", this.colorHashConnection.hex(name))
          .call(callbackDragConnection);
    }
  }
}

export default Vertex;
