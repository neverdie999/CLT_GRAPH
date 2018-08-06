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

  
  /**
   * When a vertex|boundary move
   * Resize if any boundary with size smaller than vertex|boundary size
   */
  reSizeBoundaryWhenObjectDragged(obj) {
    // Get box object
    const {height, width} = this.getBBoxObject(`#${obj.id}`);

    obj.dataContainer.boundary.forEach(boundary => {
      if (boundary.id != obj.id && !boundary.parent) {
        let boundaryBox = this.getBBoxObject(`#${boundary.id}`);

        if (height >= boundaryBox.height){
          //2018.07.03 - Vinh Vo - save this height for restoring to origin size if the object not drag in/out this boundary
          boundary.ctrlSrcHeight = boundary.height;
          boundary.setHeight(height + 43);
        }

        if (width >= boundaryBox.width){
          //2018.07.03 - Vinh Vo - save this height for restoring to origin size if the object not drag in/out this boundary
          boundary.ctrlSrcWidth = boundary.width;
          boundary.setWidth(width + 15);
        }
      }
    });
  }

  /**
   * Check drag outside boundary
   */
  checkDragObjectOutsideBoundary(obj) {
    // Get box object
    const {id, parent} = obj;
    let {height, width} = this.getBBoxObject(`#${id}`);
    let xSrc = obj.x;
    let ySrc = obj.y;
    let wBSrc = xSrc + width;
    let hBSrc = ySrc + height;

    // Parent
    const {x, y} = _.find(obj.dataContainer.boundary,{"id":parent});
    let pBox = this.getBBoxObject(`#${parent}`);
    let xParent = x + pBox.width;
    let yParent = y + pBox.height;

    // Check drag outside a boundary
    // if ((xSrc < x) || (ySrc < y) || (wBSrc > xParent) || (hBSrc > yParent)) {
    //Change condition object out boundary parent
    if ((( wBSrc < x) || ( xParent < xSrc )) || ((hBSrc < y ) || ( yParent < ySrc ))) {
      let parentObj = _.find(obj.dataContainer.boundary,{"id": parent});
      parentObj.removeMemberFromBoundary(obj);
      obj.parent = null;
      return true;
    }

    return false;
  }

  // Check drag inside boundary
  checkDragObjectInsideBoundary(obj, type) {
    // Get box object
    // Get box object
    const {height, width} = this.getBBoxObject(`#${obj.id}`);
    let xSrc = obj.x;
    let ySrc = obj.y;
    let wBSrc = xSrc + width;
    // let hBSrc = ySrc + height;

    // Define method reverse
    let reverse = (input) => {
      let ret = new Array;
      for (let i = input.length - 1; i >= 0; i--) {
        ret.push(input[i]);
      }
      return ret;
    };

    // Cause: When multi boundary overlap that drags an object inside
    // then it will be added to => regulation add to the highest boundary
    let reverseBoundary = reverse(obj.dataContainer.boundary);
    reverseBoundary.forEach((item) => {
      // The condition d.id != srcInfos.id used to check inside boundary
      // But it not affect to check inside vertex
      if (!item.parent && item.id != obj.id && !obj.parent) {
        // Calculate box for boundary
        let xTar = item.x;
        let yTar = item.y;
        let bBoxTar = this.getBBoxObject(`#${item.id}`);
        let wBTar = xTar + bBoxTar.width;
        let hBTar = yTar + bBoxTar.height;

        if ((xSrc >= xTar) && (ySrc >= yTar) && (wBSrc <= wBTar) && (ySrc <= hBTar)) {
          let index = this.getIndexFromPositionForObject(item, obj);
          item.addMemberToBoundaryWithIndex( obj, index );
          obj.parent = item.id;
        }
      }
    });
  }

  /**
   * @param srcInfos Object drag
   * @param type type of object drag
   * Function using change index of object in boundary parent when drag in boundary
   */
  changeIndexInBoundaryForObject(obj) {
    const {parent} = obj;
    let parentObj = _.find(obj.dataContainer.boundary, {"id": parent});
    let indexOld = this.getIndexBy(parentObj.member, "id", obj.id);
    // let member = { id, type, show: true };
    let indexNew = this.getIndexFromPositionForObject(parentObj, obj);
    parentObj.changeIndexMemberToBoundary(indexOld, indexNew);
    obj.parent = parent;
  }

  /**
   * Get index of object from drop position
   * @param parentObj boundary tagert drop
   * @param srcInfos Object drap
   * Function using get index for insert to boundary
   */
  getIndexFromPositionForObject(parentObj, obj) {
    let xSrc = obj.x;
    let ySrc = obj.y;
    let index = 0;

    let memberAvailable = _.filter(parentObj.member, (e) => {
      return e.show === true
    });

    for (let mem of memberAvailable) {

      let memObj = null;
      if(mem.type == "V"){
        memObj = _.find(parentObj.dataContainer.vertex,{"id": mem.id});
      }else{
        memObj = _.find(parentObj.dataContainer.boundary,{"id": mem.id});
      }

      let {x, y} = memObj;

      if (y > ySrc) {
        break;
      }

      if (mem.id === obj.id) continue;
      index++;
    }

    return index;
  }

  /**
   * Restore back the old size, dragingObject do not drag in/out these boundaries
   * @param {*} dragingObject
   */
  restoreSizeBoundary(dragingObject) {
    dragingObject.dataContainer.boundary.forEach(boundary => {
      //do not restore for parent, it was resize by checkDragObjectOutsideBoundary() or checkDragObjectInsideBoundary()
      if (boundary.id != dragingObject.id && (boundary.id != dragingObject.parent)){
        if (boundary.ctrlSrcHeight != -1){
          boundary.setHeight(boundary.ctrlSrcHeight);
        }

        if(boundary.ctrlSrcWidth != -1){
          boundary.setWidth(boundary.ctrlSrcWidth);
        }
      }

      boundary.ctrlSrcHeight = -1;
      boundary.ctrlSrcWidth = -1;
    })
  }

  /**
   * @param arr Array object
   * @param name key compare
   * @param value value compare
   * @return i (index of object match condition)
   */
  getIndexBy(arr, name, value) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i][name] == value) {
        return i;
      }
    }
    return -1;
  }

  /** 
   * @param dataContainer from import 
   * Set all children of this boundary to show
   */
  setAllChildrenToShow(dataContainer) {
    // Set all children of this boundary to show  
    let arrBoundary = dataContainer.boundary;
    arrBoundary.forEach(boundary => {
      let members = boundary.member;
      members.forEach(member => {
        member.show = true;
      });
    });
  }
}

export default ObjectUtils;
