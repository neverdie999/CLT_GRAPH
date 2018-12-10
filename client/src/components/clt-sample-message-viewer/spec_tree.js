'use strict';

const SegmentGroup = require('./spec/segment_group');
const SpecElementType = require('./spec/spec_element_type');
/**
 * @class
 * make spec tree with result of SpecParser
 */
class SpecTree {
  /**
   * @param {Object} segments - segments Object.
   * @param {Object} segmentGroups - groups Object.
   * * make a tree with result of SpecParser
   */
  makeTree(segments, segmentGroups) {
    let root = null;
    const elementMap = this._createElementMap(segments, segmentGroups);
    segmentGroups.forEach((segmentGroup) => {
      const targetSegmentGroup = elementMap.get(segmentGroup.id);
      segmentGroup.children.forEach((id) => {
        const targetMember = elementMap.get(id);
        if (targetMember !== undefined) {
          targetSegmentGroup.addChild(targetMember);
        }
      });
      if (segmentGroup.parent === null) {
        root = targetSegmentGroup;
      }
    });

    return root;
  }

  _createElementMap(segments, segmentGroups) {
    const elementMap = new Map();
    
    segments.forEach((segment) => {      
      elementMap.set(segment.id, segment);
    });
    segmentGroups.forEach((segmentGroup) => {
      const {
        name,
        depth,
        maxRepeat,
        isMandatory,
        description,
        id,
        parent,
        segmentCounter
      } = segmentGroup;
      const newSegmentGroup = new SegmentGroup(name, depth, maxRepeat, isMandatory, description, id, parent, segmentCounter);
      elementMap.set(id, newSegmentGroup);
    });

    return elementMap;
  }

  /**
   * make a group List with tree.
   * @param {Object} segments Object.
   * @param {Object} segmentGroups Object.
   * @returns {Object} - grouList
   */
  makeGroupList(segments, segmentGroups) {
    let depth = 0;
    const groupList = [];
    const root = this.makeTree(segments, segmentGroups);
    groupList.push(root);
    root.depth = 0;
    depth += 1;
    root.children.forEach((member) => {
      if (SpecElementType.isSegmentGroup(member.elementType)) {            
        member.depth = depth;
        groupList.push(member);
        member.addMemberToGroupList(groupList, depth);
      }
    });    
    return groupList;
  }
}
module.exports = SpecTree;
