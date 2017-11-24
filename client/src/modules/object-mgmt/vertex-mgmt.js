import * as d3 from 'd3';
import {
  SCREEN_SIZES,
} from '../../const/index';

class VertexMgmt{
  constructor(props){
    this.svgSelector = props.svgSelector;
    this.dataContainer = props.dataContainer;
  }

  create(options, type){
    const dragRegister = d3.drag()
      .on("start", this.dragstarted)
      .on("drag", this.dragged)
      .on("end", this.dragended);

    let coor = {x: options.x, y: options.y};
    this.dataContainer.vertex.push(coor);
    this.svgSelector.append("rect")
      .attr("x", options.x)
      .classed('vertex', true)
      .attr("y", options.y)
      .attr("height", 250)
      .attr("width", 200)
      .attr("type", type)
      .style("stroke", "black")
      .style("fill", "aliceblue")
      .style("stroke-width", ".5")

    // Call event drag for all object vertex exit.
    this.svgSelector.selectAll(".vertex").call(dragRegister).data(this.dataContainer.vertex);
  }

  dragstarted(d) {
    d3.select(this).classed("active", true);
    d3.event.sourceEvent.stopPropagation();
  }

  dragged(d) {
    // Update poition object in this.dataContainer.boundary
    d3.select(this)
      .attr("x", d.x = d3.event.x)
      .attr("y", d.y = d3.event.y);
  }

  dragended(d) {
    d3.select(this).classed("active", false);
  }
};

export default VertexMgmt;
