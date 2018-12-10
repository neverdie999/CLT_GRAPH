'use strict';

const MatchResult = require('../message/match_result');
const SpecElementType = require('./spec_element_type');
const ResultType = require('../message/result_type');

/**
 * A class that represents Segment in the Spec. (SegmentGroup -> Segment -> DataElement)
 */
class Segment {
  /**
   * @param {String} name
   * @param {String} description
   * @param {Object} dataElements
   * @param {String} id
   * @param {Object} parent
   * @param {String} mandatory
   * @param {Number} maxRepeat
   * @param {Number} cursor
   * @param {Number} instanceIndex
   */
  constructor(name, description='', dataElements, id, parent='', mandatory=false, maxRepeat=1, cursor=0, instanceIndex=-1) {
    this._name = name;
    this._description = description;
    this._dataElements = dataElements;
    this._id = id;
    this._parent = parent;
    this._mandatory = mandatory;
    this._maxRepeat = maxRepeat;
    this._instanceIndex = instanceIndex;
    this._cursor = cursor;
    this._elementType= SpecElementType.Segment;
  }

  /**
   * match messageSegmentName and segementName to compare between spec structure and message structure.
   * @param {String} messageSampleSegment
   * @returns {MatchResult}
   */
  matchStructure(messageSampleSegment, messageType, delimiterInfo) {
    const messageSampleSegmentName = this._getMessageSampleSegmentName(messageSampleSegment, messageType, delimiterInfo);
    if (this._name === messageSampleSegmentName.trim()) {
      const matchResult = new MatchResult(ResultType.SUCCESS, '', this);
      // matchResult.matchedSegment = this;
      return matchResult;
    } 
    
    const matchResult = new MatchResult(ResultType.FAIL_FIND_TARGET_SEGMENT, `[${messageSampleSegment}] NOT FOUND IN SEGMENT LIST`, this);
    return matchResult;
  }
  
  _getMessageSampleSegmentName(messageSampleSegment, messageType, delimiter) {
    if (messageType === 'FIXEDLENGTH') {
      const lengthRegex = /\d+/;
      const specLength = this.dataElements[0].format.match(lengthRegex)[0];
      const messageSampleSegmentName = messageSampleSegment.substr(0, specLength);
      return messageSampleSegmentName.trim();
    }
    return messageSampleSegment.split(delimiter.dataElementSeparator, 1)[0].trim();
  }

  /**
   * get current DataElement Object.
   * @returns DataElement
   */
  getCurrentDataElement() {
    return this.dataElements[this.cursor];
  }

  // /**
  //  * update cursor when compodite data is single.
  //  * @param {DataElement} dataElements
  //  * @param {Integer} cursor
  //  * @returns {Integer}
  //  */
  // updateSingleCompositeCursor(dataElements, cursor) {
  //   let currentCursor = cursor;
  //   let increase = 0;
  //   const currentDataElements = dataElements;
  //   for (;currentCursor < currentDataElements.length; currentCursor += 1) {
  //     if (currentDataElements[currentCursor].type === 'COMPONENT') {
  //       increase += 1;
  //     }
  //   }
  //   return increase;
  // }

  get name() {
    return this._name;
  }

  get description() {
    return this._description;
  }

  set description(description) {
    this._description = description;
  }

  get dataElements() {
    return this._dataElements;
  }

  set dataElements(dataElements) {
    this._dataElements = dataElements;
  }

  get id() {
    return this._id;
  }

  get parent() {
    return this._parent;
  }

  set parent(parent) {
    this._parent = parent;
  }

  get mandatory() {
    return this._mandatory;
  }

  set mandatory(mandatory) {
    this._mandatory = mandatory;
  }

  get maxRepeat() {
    return this._maxRepeat;
  }

  get elementType() {
    return this._elementType;
  }

  get cursor() {
    return this._cursor;
  }

  set cursor(cursor) {
    this._cursor = cursor;
  }

  get instanceIndex() {
    return this._instanceIndex;
  }

  set instanceIndex(instanceIndex) {
    this._instanceIndex = instanceIndex;
  }

  /**
   * @param {*} depth
   * @param {*} indentChar
   * print segment info.
   */
  toString(depth=0, indentChar=' '.repeat(2)) {
    const indent = indentChar.repeat(depth);
    return `${indent}[${this._name}][${this._mandatory ? 'M' : 'C'}${this._maxRepeat}]`;
  }
}

module.exports = Segment;
