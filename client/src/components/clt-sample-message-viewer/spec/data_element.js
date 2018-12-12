'use strict';

const SpecElementType = require('./spec_element_type');
/**
 * @class
 * A class that represents DataElement in the Spec. (SegmentGroup -> Segment -> DataElement)
 */
class DataElement {
  /**
  * @param {String} name
  * @param {Obejct} type
  * @param {String} mandatory
  * @param {String} format
  * @param {String} repeat
  * @param {String} description
  * @param {String} value
  * @param {Object} parent
  * @param {String} appearance
  * @param {String} id
  */
  constructor(name, type, mandatory, format, repeat, description='', value='', parent=null, appearance=0, id) {
    this._name = name;
    this._type = type;
    this._mandatory = mandatory;
    this._format = format;
    this._repeat = repeat;
    this._description = description;

    this._value = value;

    this._parent = parent;
    this._appearance = appearance;
    this._id = id;
    this._elementType = SpecElementType.DataElement;
  }

  get name() {
    return this._name;
  }

  set name(name) {
    this._name = name;
  }

  get type() {
    return this._type;
  }

  set type(type) {
    this._type = type;
  }

  get mandatory() {
    return this._mandatory;
  }

  set mandatory(mandatory) {
    this._mandatory = mandatory;
  }

  get format() {
    return this._format;
  }

  set format(format) {
    this._format = format;
  }

  get repeat() {
    return this._repeat;
  }

  set repeat(repeat) {
    this._repeat = repeat;
  }

  get description() {
    return this._description;
  }

  set description(description) {
    this._description = description;
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = value;
  }

  get parent() {
    return this._parent;
  }

  set parent(parent) {
    this._parent = parent;
  }

  get appearance() {
    return this._appearance;
  }

  set appearance(appearance) {
    this._appearance = appearance;
  }

  get id() {
    return this._id;
  }

  set id(id) {
    this._id = id;
  }

  toString(depth=0, indentChar=' '.repeat(2)) {
    const indent = indentChar.repeat(depth);
    return `${indent}[${this._type}][${this._mandatory ? 'M' : 'C'}][${this._format}]`;
  }
}

module.exports = DataElement;
