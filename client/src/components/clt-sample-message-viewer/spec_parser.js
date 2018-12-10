'use strict';

const SegmentGroup = require('./spec/segment_group');
const Segment = require('./spec/segment');
const DataElement = require('./spec/data_element');
/**
 * @class
 * parse spec.
 */
class SpecParser {
  /**
  * @param {Object} graphDataStructure
  */
  constructor(graphDataStructure) {    
    this.graphDataStructure = JSON.parse(graphDataStructure);
    this.boundaryDic = this._createMapById(this.graphDataStructure.boundary);
    this.vertexDic = this._createMapById(this.graphDataStructure.vertex);
  }

  /**
   * parse spec
   * @returns {Obeject} - return group and segment object.
   */
  parse() {
    const group = [];
    const segment = [];
    const boundaries = (this.graphDataStructure).boundary;
    const vertexes = (this.graphDataStructure).vertex;
    const usedGroup = this._createUsedGroupDictionary((this.graphDataStructure).boundary);
    boundaries.forEach((boundary) => {
      if (usedGroup[boundary.id] === false) {
        group.push(this._createSegmentGroupSpec(boundary, this.boundaryDic, usedGroup));
      }
    });
    vertexes.forEach((vertex) => {
      segment.push(this._createSegmentSpec(vertex));
    });

    return { group, segment };
  }

  _createSegmentGroupSpec(boundary, boundaryDic, usedGroup) {
    if (usedGroup[boundary.id]) {
      return false;
    }

    const segmentGroupSpec = new SegmentGroup(boundary.name, 0, boundary.repeat, boundary.mandatory, boundary.description, boundary.id, boundary.parent);
    segmentGroupSpec.children = this._getSegmentGroupChildren(boundary.member, boundaryDic);    
    segmentGroupSpec.segmentCounter = this._createSegmentCounter(segmentGroupSpec.children);
    // console.log(segmentGroupSpec.segmentCounter);    
    usedGroup[boundary.id] = true;
    return segmentGroupSpec;
  }

  _getSegmentGroupChildren(members, boundaryDic) {
    const children = [];
    members.forEach((member) => {
      let segment;
      if (member.type === 'V') {
        segment = this.vertexDic[member.id];
      } else {
        segment = boundaryDic[member.id];
      }
      if (segment !== undefined) {
        children.push(segment.id);
      }
    });
    return children;
  }

  _createSegmentSpec(vertex) {
    const segment = this.vertexDic[vertex.id];
    let segmentSpec = null;
    if (segment !== undefined) {
      segmentSpec = new Segment(segment.vertexType, segment.description, '', segment.id, segment.parent, segment.mandatory, segment.repeat);
      segmentSpec.dataElements = this._createDataElementSpec(segment.data, segmentSpec);
      return segmentSpec;
    }
    return segmentSpec;
  }

  _createDataElementSpec(datas, parent) {
    const dataElement = [];
    datas.forEach((data, index) => {
      const isMandatory = data.usage === 'M';
      const dataElementSpec = new DataElement(data.name, data.type, isMandatory, data.format, data.repeat, data.description, '', parent, 0, `${parent.id}-de-${index}`);
      dataElement.push(dataElementSpec);
    });
    return dataElement;
  }

  _createMapById(list) {    
    const map = {};
    list.forEach((element) => {      
      map[element.id] = element;
    });
    return map;
  }

  _createUsedGroupDictionary(boundaries) {
    const usedGroup = {};
    boundaries.forEach((boundary) => {
      usedGroup[boundary.id] = false;
    });
    return usedGroup;
  }

  _createSegmentCounter(segmentIds) {
    // console.log(segmentIds)
    let segmentCounter = {};
    segmentIds.forEach((segmentId) => {
      if (segmentId.startsWith('V')) {
        segmentCounter[this.vertexDic[segmentId].vertexType] = 0;
      }
    });
    return segmentCounter;
  }
}

module.exports = SpecParser;
