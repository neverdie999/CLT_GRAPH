'use strict';

const MatchResult = require('../message/match_result');
const SpecElementType = require('./spec_element_type');
const ResultType = require('../message/result_type');


/**
 * @class
 * A class that represents SegmentGroup in the Spec. (SegmentGroup -> Segment -> DataElement)
 */
class SegmentGroup {
  /**
   * @param {String} name
   * @param {Integer} depth
   * @param {Integer} maxRepeat
   * @param {String} mandatory
   * @param {String} description
   * @param {String} id
   * @param {Object} parent
   * @param {Map} segmentCounter
   * @param {Obejct} children
   * @param {Number} lastMatchedIndex
   * @param {Object} lastMatchedSegment
   * @param {Array} instances
   */

  constructor(name, depth, maxRepeat=1, mandatory=false, description, id, parent=null, segmentCounter={}, children=[], lastMatchedIndex=-1, lastMatchedSegment='', instances=[]) {
    this._elementType = SpecElementType.SegmentGroup;
    this._name = name;
    this._depth = depth;
    this._maxRepeat = Number(maxRepeat);
    this._mandatory = mandatory;
    this._description = description;

    this._id = id;
    this._parent = parent;
    this._segmentCounter = segmentCounter;
    this._children = children;
    this._mandatoryConditionSatisfied = !mandatory;
    this._lastMatchedIndex = lastMatchedIndex;
    this._lastMatchedSegment = lastMatchedSegment;
    this._instances = instances;
  }

  /**
   * match segment with spec.
   * @param {String} messageSampleSegment
   * @param {Boolean} matchChildrenSegmentOnly
   * @returns {ValidationResult}
   */
  matchStructure(messageSampleSegment, messageType, delimiter, matchChildrenSegmentOnly=false) {
    let matchResult = new MatchResult();
    const init = (this.lastMatchedIndex === -1) ? 0 : this.lastMatchedIndex;
    for (let i = init; i < this.children.length; i += 1) {
      const currentChild = this.children[i];
      
      if (SpecElementType.isSegmentGroup(currentChild.elementType)) {
        if (matchChildrenSegmentOnly) {
          continue;
        }
        matchResult = currentChild.matchStructure(messageSampleSegment, messageType, delimiter, true);
        if (matchResult.resultType === ResultType.FAIL_FIND_TARGET_SEGMENT) {
          continue;
        }

        if (matchResult.resultType === true) {
          this.lastMatchedIndex = i;
          // this._lastMatchedSegment = currentChild.name;
        }

        return matchResult;
      }

      if (SpecElementType.isSegment(currentChild.elementType)) {
        matchResult = currentChild.matchStructure(messageSampleSegment, messageType, delimiter);
        if (matchResult.resultType === ResultType.FAIL_FIND_TARGET_SEGMENT) {
          continue;
        }

        if (matchResult.resultType === ResultType.FAIL_VALIDATION_SEGMENT) {
          return matchResult;
        }
        // matched
        if (this._instances.length === 0) {
          this._registerNewSegmentCounter();
        }
        this._instances[this._instances.length - 1][currentChild.name] += 1;

        if (currentChild.maxRepeat < this._instances[this._instances.length - 1][currentChild.name]) {
          if (!this._updateInstanceWhenViolateSegmentMaxRepeat(currentChild.name)) {
            return new MatchResult(ResultType.FAIL_VALIDATION_GROUP, `[GROUP][${this.name}][${currentChild.name}]MAX_REPEAT_VIOLATION`);
          }
        } else {
          if (!this._updateInstanceWhenObserveSegmentMaxRepeat(i)) {
            return new MatchResult(ResultType.FAIL_VALIDATION_GROUP, `[GROUP][${this.name}][${currentChild.name}]MAX_REPEAT_VIOLATION`);
          } 
        }

        if (!this._satisfyMandatoryCondition(i)) {
          return new MatchResult(ResultType.FAIL_VALIDATION_SEGMENT, `[SEGMENT][${currentChild.name}]NOT_SATISFIED_MANDATORY`);
        }

        // matched
        this._lastMatchedSegment = currentChild.name;
        return matchResult;
      }
    }
    this._instances.length = 0;
    this._lastMatchedSegment = '';
    return new MatchResult(ResultType.FAIL_FIND_TARGET_SEGMENT, `[${this.name}]NOT_FOUND_IN_SEGMENT_LIST`);
  }

  /**
  * @param {String} segmentGroupName
  * @param {Boolean} matchChildrenSegmentOnly
  * match and validate Segment Group(Dictionary Type only)
  */
  matchGroup(segmentGroupName, matchChildrenSegmentOnly=false) {
    const init = (this.lastMatchedIndex === -1) ? 0 : this.lastMatchedIndex;
    for (let i = init; i < this._children.length; i += 1) {
      const currentChild = this._children[i];
      if (matchChildrenSegmentOnly && SpecElementType.isSegmentGroup(currentChild.elementType)) {
        continue;
      }

      if (SpecElementType.isSegment(currentChild.elementType)) {
        continue;
      }

      if (SpecElementType.isSegmentGroup(currentChild.elementType)) {
        if (segmentGroupName.trim() === currentChild.name.trim()) {
          const matchResult = new MatchResult(ResultType.SUCCESS, '', '', currentChild);
          return matchResult;
        }

        let matchResult = new MatchResult();
        matchResult = currentChild.matchGroup(segmentGroupName, true);

        if (matchResult.resultType === ResultType.FAIL_FIND_TARGET_GROUP) {
          continue;
        }

        if (matchResult.resultType === true) {
          this.lastMatchedIndex = i;
        }
        return matchResult;
      }
    }
    this._instances.length = 0;
    this._lastMatchedSegment = '';
    return new MatchResult(ResultType.FAIL_FIND_TARGET_GROUP, `[GROUP]"${segmentGroupName}" MATCH FAILED`);
  }

  _satisfyMandatoryCondition(targetIndex) {
    for (let i = 0; i < targetIndex; i += 1) {
      if (this._children[i].mandatory && this._instances[this._instances.length - 1][this._lastMatchedSegment] === 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * add SegmentGroup to GroupList.
   * @param {Object} groupList
   * @param {Integer} depth
   * @returns {Object[]}
   */
  addMemberToGroupList(groupList, depth) {
    const currentDepth = depth + 1;
    this.children.forEach((eachMember) => {
      const currentEachMember = eachMember;
      if (SpecElementType.isSegmentGroup(currentEachMember.elementType)) {
        currentEachMember.depth = currentDepth;
        groupList.push(currentEachMember);
        currentEachMember.addMemberToGroupList(groupList, currentDepth);
      }
    });
  }

  _updateInstanceWhenViolateSegmentMaxRepeat(segmentName) {
    if (this._instances.length > this.maxRepeat) {
      return false;
    }

    this._instances[this._instances.length - 1][segmentName] -= 1;
    this._registerNewSegmentCounter();
    this._instances[this._instances.length - 1][segmentName] += 1;
    return true;
  }

  _registerNewSegmentCounter() {
    const template = this._segmentCounter || {};
    const cloned = JSON.parse(JSON.stringify(template));
    this._instances.push(cloned);
  }

  _updateInstanceWhenObserveSegmentMaxRepeat(segmentIndex) {
    return this.lastMatchedIndex <= segmentIndex;
  }

  /**
   * add child and elementCounter.
   * @param {Object} child
   * @returns {Object}
   *
   */
  addChild(child) {
    this._children.push(child);
    child.parent = this;
    return child;
  }

  get name() {
    return this._name;
  }

  set name(name) {
    this._name = name;
  }

  get depth() {
    return parseInt(this._depth, 10);
  }

  set depth(depth) {
    this._depth = depth;
  }

  get maxRepeat() {
    return parseInt(this._maxRepeat, 10);
  }

  set maxRepeat(maxRepeat) {
    this._maxRepeat = maxRepeat;
  }

  get mandatory() {
    return this._mandatory;
  }

  set mandatory(mandatory) {
    this._mandatory = mandatory;
  }

  get description() {
    return this._description;
  }

  set description(description) {
    this._description = description;
  }

  get id() {
    return this._id;
  }

  set id(id) {
    this._id = id;
  }

  get parent() {
    return this._parent;
  }

  set parent(parent) {
    this._parent = parent;
  }

  get children() {
    return this._children;
  }

  set children(children) {
    this._children = children;
  }

  get elementCounterFormat() {
    return this._elementCounterFormat;
  }

  set elementCounterFormat(elementCounterFormat) {
    this._elementCounterFormat = elementCounterFormat;
  }

  get mandatoryConditionSatisfied() {
    return this._mandatoryConditionSatisfied;
  }

  set mandatoryConditionSatisfied(mandatoryConditionSatisfied) {
    this._mandatoryConditionSatisfied = mandatoryConditionSatisfied;
  }

  get lastMatchedIndex() {
    return this._lastMatchedIndex;
  }

  set lastMatchedIndex(lastMatchedIndex) {
    this._lastMatchedIndex = lastMatchedIndex;
  }

  get elementType() {
    return this._elementType;
  }

  get validationResult() {
    return this._validationResult;
  }

  set validationResult(result) {
    this._validationResult = result;
  }

  get segmentCounter() {
    return this._segmentCounter;
  }

  set segmentCounter(segmentCounter) {
    this._segmentCounter = segmentCounter;
  }

  /**
   * print segmentGroups info.
   */
  toString() {
    console.log(this.name);
    console.log(this.segmentCounter);
  }
}

module.exports = SegmentGroup;
