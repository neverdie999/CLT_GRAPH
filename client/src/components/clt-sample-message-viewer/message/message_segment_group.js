'use strict';

const MessageElementType = require('./message_element_type');

/**
 * @class
 * A class that represents MessageSegmentGroup in the Message.
 * (MessageSegmentGroup -> MessageSegment -> MessageDataElement)
 */
class MessageSegmentGroup {
  /**
   * @param {String} name
   * @param {Obeject} parent
   * @param {Obeject} children
   * @param {Number} order
   * @param {Obeject} matchResult
   * @param {Obeject} spec
   * @param {String} id
   * @param {Object} elementType
   */
  constructor(name='', children=[], parent, order=0, matchResult=true, spec=null, id=null) {
    this._name = name;
    this._children = children;
    this._parent = parent;
    this._order = order;
    this._matchResult = matchResult;
    this._spec = spec;
    this._id = id;
    this._elementType = MessageElementType.SegmentGroup;
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

  get parent() {
    return this._parent;
  }

  set parent(parent) {
    this._parent = parent;
  }

  get order() {
    return this._order;
  }

  set order(order) {
    this._order = order;
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

  get elementType() {
    return this._elementType;
  }

  /**
   * clear MessageSegmentGroup children
   */
  resetMessageSegmentGroup() {
    this.children.length = 0;
  }
  /**
   * print message Segments group
   */
  toString(depth=0, indentChar=' '.repeat(2)) {
    const indent = indentChar.repeat(depth);
    const lines = [];
    lines.push(`${indent}[GRP: ${this._name}]`);
    this._children.forEach((child) => {
      lines.push(`${child.toString(depth + 1)}`);
    });
    return lines.join('\n');
  }
}
module.exports = MessageSegmentGroup;
