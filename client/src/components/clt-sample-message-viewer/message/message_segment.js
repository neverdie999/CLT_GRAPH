'use strict';

const MessageElementType = require('./message_element_type');

/**
 * @class
 * A class that represents MessageSegment in the Message.
 * (MessageSegmentGroup -> MessageSegment -> MessageDataElement)
 */
class MessageSegment {
 /**
  * 
  * @param {String} name 
  * @param {Object} children 
  * @param {Object} matchResult 
  * @param {Object} spec 
  * @param {String} id 
  * @param {Number} order 
  * @param {Object} parent
  * @param {Object} elementType 
  */
  constructor(name, children=[], matchResult=true, spec=null, id=null, order=0, parent='') {
    this._name = name;
    this._children = children;
    this._matchResult = matchResult;
    this._spec = spec;
    this._id = id;
    this._order = order;
    this._parent = parent;
    this._elementType = MessageElementType.Segment;
  }

  get MessageElementType() {
    return this._messageElementType;
  }

  set MessageElementType(messageElementType) {
    this._messageElementType = messageElementType;
  }

  get name() {
    return this._name;
  }

  set name(name) {
    this._name = name;
  }

  get children() {
    return this._children;
  }

  set children(children) {
    this._children = children;
  }

  get matchResult() {
    return this._matchResult;
  }

  set matchResult(matchResult) {
    this._matchResult = matchResult;
  }

  get spec() {
    return this._spec;
  }

  set spec(spec) {
    this._spec = spec;
  }

  get id() {
    return this._id;
  }

  set id(id) {
    this._id = id;
  }

  get order() {
    return this._order;
  }

  set order(order) {
    this._order = order;
  }

  get parent() {
    return this._parent;
  }

  set parent(parent) {
    this._parent = parent;
  }

  get elementType() {
    return this._elementType;
  }

  /**
   * print messageSegments
   */
  toString(depth=0, indentChar=' '.repeat(2)) {
    const indent = indentChar.repeat(depth);
    const lines = [];
    lines.push(`${indent}[SGM: ${this._name}][${this._order}] (ID: ${this._id} / SPEC: ${this._spec ? this._spec.toString() : 'NONE'})`);
    this._children.forEach((dataElements) => {
      dataElements.forEach((dataElement) => {
        lines.push(dataElement.toString(depth + 1));
      });
    });
    return lines.join('\n');
  }
}

module.exports = MessageSegment;
