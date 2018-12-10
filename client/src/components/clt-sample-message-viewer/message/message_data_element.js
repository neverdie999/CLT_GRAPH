'use strict';
const ValidationResult = require('./validation_result');
const MessageElementType = require('./message_element_type');
const ResultType = require('./result_type');
/**
 * @class
 * A class that represents DataElement in the Message.
 * (MessageSegmentGroup -> MessageSegment -> MessageDataElement)
 */
class MessageDataElement {
  /**
   * @param {String} type
   * @param {String} name
   * @param {String} value
   * @param {Object} spec
   * @param {String} id
   * @param {String} matchResult
   * @param {String} whiteSpace
   * @param {String} elementType
   */
  constructor(type, name='', value='', spec=null, id=null, matchResult, whiteSpace='') {
    this._type = type;
    this._name = name;
    this._value = value;
    this._spec = spec;
    this._id = id;
    this._matchResult = matchResult;
    this._whiteSpace = whiteSpace;
    this._elementType = MessageElementType.DataElement;
  }

  /**
 * validate messageDataElement(Usage ,Repeat, DataLength, DataType)
 * @return boolean matchResult
 */
  validate() {
    if (
      this._validateUsage()
      && this._validateRepeat()
      && this._validateDataLength()
      && this._validateDataType()
    ) {
      this._matchResult = new ValidationResult(ResultType.SUCCESS);
    }

    return this._matchResult;
  }

  _validateUsage() {
    // console.log(this.value);
    // console.log(this.spec);
    // console.log(this.spec.mandatory);
    // console.log('---');
    if (this.spec.mandatory === true && this.value === '') {
      const desc = `[USAGE] ${this.spec.parent.name}-${this.spec.name}: ${this.spec.mandatory} | ${this.value}`;
      this._matchResult = new ValidationResult(ResultType.FAIL_VALIDATION_DATA_ELEMENT, desc);
      return false;
    }

    return true;
  }

  _validateRepeat() {    
    this.spec.appearance += 1;
    // console.log(this.value);
    // console.log(this.spec.repeat);
    // console.log(this.spec.appearance);
    // console.log('---');
    if (this.spec.repeat < this.spec.appearance) {      
      const desc = `[REPEAT] ${this.spec.parent.name}-${this.spec.name}: ${this.spec.appearance} | ${this.spec.repeat}`;
      this._matchResult = new ValidationResult(ResultType.FAIL_VALIDATION_DATA_ELEMENT, desc);
      return false;
    }

    return true;
  }

  _validateDataLength() {
    const lengthRegex = /\d+/;
    const specLength = this.spec.format.match(lengthRegex)[0];
    const sampleLentgh = this.value.length;
    // console.log('==========================');
    // console.log(this.value);
    // console.log(specLength);
    // console.log(sampleLentgh);
    // console.log('==========================');
    if (sampleLentgh > specLength) {
      const desc = `[LENGTH] ${this.spec.parent.name}-${this.spec.name}: ${sampleLentgh} | ${specLength}| value: ${this.value}`;
      this._matchResult = new ValidationResult(ResultType.FAIL_VALIDATION_DATA_ELEMENT, desc);
      return false;
    }

    return true;
  }

  _validateDataType() {
    const formatRegex = /(AN|A|N|)/;
    const specFormat = this.spec.format.match(formatRegex)[0];
    const sampleFormat = this._getMessageDataType(this[0]);
    // console.log(specFormat);
    // console.log(sampleFormat);
    // console.log();
    if (specFormat === 'A' && sampleFormat !== 'A') {
      const desc = `[FORMAT] ${this.spec.parent.name}-${this.spec.name}: ${specFormat} | ${sampleFormat} | value: ${this.value}`;
      this._matchResult = new ValidationResult(ResultType.FAIL_VALIDATION_DATA_ELEMENT, desc);
      return false;
    }

    if (specFormat === 'N' && sampleFormat !== 'N') {
      const desc = `[FORMAT] ${this.spec.parent.name}-${this.spec.name}: ${specFormat} | ${sampleFormat} | value: ${this.value}`;
      this._matchResult = new ValidationResult(ResultType.FAIL_VALIDATION_DATA_ELEMENT, desc);
      return false;
    }

    return true;
  }

  _getMessageDataType() {
    if (this._isAlpha(this.value)) {
      return 'A';
    }

    if (!isNaN(this.value)) {
      return 'N';
    }

    return 'AN';
  }

  _isAlpha(ch) {
    return /^[A-Z]$/i.test(ch);
  }

  get type() {
    return this._type;
  }

  set type(type) {
    this._type = type;
  }

  get name() {
    return this._name;
  }

  set name(name) {
    this._name = name;
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = value;
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

  get matchResult() {
    return this._matchResult;
	}
	
	set matchResult(matchResult) {
    this._matchResult = matchResult;
  }

  get whiteSpace() {
    return this._whiteSpace;
  }

  set whiteSpace(whiteSpace) {
    this._whiteSpace = whiteSpace;
  }

  get elementType() {
    return this._elementType;
  }

  /**
   * @param {} depth
   * @param {*} indentChar
   * @return String
   * print dataElement field.
   */
  toString(depth=0, indentChar=' '.repeat(2)) {
    const indent = indentChar.repeat(depth);
    return `${indent}[DE: ${this._name}] ${this._value} (ID: ${this._id} / SPEC: ${this._spec ? this._spec.toString() : 'NONE'})`;
  }
}

module.exports = MessageDataElement;
