import * as d3 from 'd3';
import _ from "lodash";
import {
  PADDING_POSITION_SVG,
  VERTEX_ATTR_SIZE,
  TYPE_CONNECT,
} from '../../const/index';

class ObjectUtils {
  /**
   * Return position object limit in SVG container
   * @param event d3
   * @param svg
   * @param objectId
   * @returns {{x: number, y: number}}
   */
  setPositionObjectJustInSvg(event, svg, objectId) {
    // Limit left
    let x = event.x < PADDING_POSITION_SVG.MIN_OFFSET_X ? PADDING_POSITION_SVG.MIN_OFFSET_X : event.x;
    let y = event.y < PADDING_POSITION_SVG.MIN_OFFSET_Y ? PADDING_POSITION_SVG.MIN_OFFSET_Y : event.y;
    // limit right
    let limitWidth = $(`${svg}`).width();
    let {width} = this.getBBoxObject(objectId);
    if (x + width > limitWidth)
      x = limitWidth - width;

    return {x, y};
  }

  /**
   * Get bbox object match with selector
   * @param selector
   * @returns {*}
   */
  getBBoxObject(selector) {
    let node = d3.select(`${selector}`);
    if (node)
      return node.node().getBBox();
    return null;
  }

  /**
   * Get coordinate prop relative to parent
   * The order is important
   * @param info => require, type: object, purpose: current coordinate of vertex
   * @param prop => require, type: string, purpose: prop need to calculate coordinate.
   * @param type => option, type: string, purpose: determined start or end connect
   * @param svg => require, type: string, purpose: determined the area that object did draw on it.
   * @returns {{x: *, y: number}}
   */
  getCoordPropRelativeToParent(info, prop, type, svg) {
    if (!type)
      type = TYPE_CONNECT.OUTPUT;
    const {x, y, id} = info;
    let axisX = x;
    let axisY = y;
    // Area draw element svg
    let containerSvg = $(`#${svg}`);
    // Parent id container the object SVG
    let parent = $(`#${svg}`).parent().attr('id');
    let parentSvg = $(`#${parent}`);

    if (!prop)
      return {
        x: axisX + containerSvg.offset().left + VERTEX_ATTR_SIZE.GROUP_WIDTH / 2,
        y: axisY - parentSvg.scrollTop()
      };

    // Get index prop in object
    let index = this.findIndexPropInVertex(id, prop);
    // Calculate coordinate of prop
    // Get coordinate
    axisY = axisY + VERTEX_ATTR_SIZE.HEADER_HEIGHT + index * VERTEX_ATTR_SIZE.PROP_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT / 2;
    return {
      x: type === TYPE_CONNECT.OUTPUT ? axisX + VERTEX_ATTR_SIZE.GROUP_WIDTH + containerSvg.offset().left : axisX + containerSvg.offset().left,
      y: axisY - parentSvg.scrollTop()
    };
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
    let length = tmpArry.length;
    for (let i = 0; i < length; i++) {
      let e = tmpArry[i];
      if (d3.select(e).attr('prop') === prop) {
        return i;
      }
    }
    return null;
  }
}

export default ObjectUtils;
