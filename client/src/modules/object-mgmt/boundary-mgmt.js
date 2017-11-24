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
    this.dataContainer.boundary.push(coor);
    let group = this.svgSelector.append("g")
      .attr("transform", `translate(${options.x}, ${options.y})`)
      .attr("id", "group");

    group.append("rect")
      .attr("height", 250)
      .attr("width", 200)
      .attr("type", type)
      .style("stroke", "black")
      .style("fill", "white")
      .style("stroke-width", ".5");

    group.append("foreignObject")
      .attr("width", 200)
      .attr("height", 100)
      .attr("id", "fobject")
      .style("border-color", "black")
      .append("xhtml:div")
      .style("font", "14px 'Helvetica Neue'")
      .html("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec eu enim quam.");

    // Call event drag for all object vertex exit.
    this.svgSelector.selectAll("#group").call(dragRegister).data(this.dataContainer.boundary);
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

    // Transform group
    d3.select(this).attr("transform", (d,i) => {
      return "translate(" + [ d3.event.x, d3.event.y ] + ")"
    })
  }

  dragended(d) {
    d3.select(this).classed("active", false);
  }
};

export default VertexMgmt;
