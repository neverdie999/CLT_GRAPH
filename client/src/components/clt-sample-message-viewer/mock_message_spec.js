'use strict';

const MessageElementType = require('./message/message_element_type');
const validationResult = require('./message/validation_result');
/**
 * @class
 * Messagespec matches message and spec.
 */
class MockMessageSpec {
  /**
   * 
   * @param {String} delimiter 
   * @param {Object} messageStructure 
   * @param {Object} lastMatchedGroup 
   */
  constructor(delimiter, messageStructure, lastMatchedGroup) {
    this._delimiter = delimiter;
    this._messageStructure = messageStructure;
    this._lastMatchedGroup = lastMatchedGroup;
    this._lastMatchedSegment = null;
  }

  _lastSuccess() {
    return {
      group: this._lastMatchedGroup,
      segment: this._lastMatchedSegment,
    };
  }

  /**
   * match message and spec.
   * @returns {validationResult} - return Result object.
   */
  match(messageElement) {
    if (MessageElementType.isSegmentGroup(messageElement.elementType)) {
      const children = messageElement.children;
      if (Array.isArray(children)) {
        return this._validateArray(children);
      }

      return messageElement.validate();
    }

    if (MessageElementType.isSegment(messageElement.elementType)) {
      const children = messageElement.children;
      if (Array.isArray(children)) {
        return this._validateArray(children);
      }

      return messageElement.validate();
    }

    if (Array.isArray(messageElement)) {
      return this._validateArray(messageElement);
    }

    if (MessageElementType.isDataElement(messageElement.elementType)) {
      return messageElement.validate();
    }
    return new validationResult(ResultType.FAIL_VALIDATION_SEGMENT)
  }

  _validateArray(elements) {
    let result;
    for (let element of elements) {
      result = this.match(element);
      if (!result.isValid()) {
        return result;
      };
    }

    return result;
  }

  _print() {
    return this._root.print();
  }

  get messageStructure() {
    return this._messageStructure;
  }

  set messageStructure(messageStructure) {
    this._messageStructure = messageStructure;
  }

  get specGroupList() {
    return this._specGroupList;
  }

  set specGroupList(specGroupList) {
    this._specGroupList = specGroupList;
  }

  get lastMatchedGroup() {
    return this._lastMatchedGroup;
  }

  set lastMatchedGroup(lastMatchedGroup) {
    this._lastMatchedGroup = lastMatchedGroup;
  }
}

module.exports = MockMessageSpec;
