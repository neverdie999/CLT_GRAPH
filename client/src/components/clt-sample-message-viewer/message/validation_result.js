'use strict';

const ResultType = require('./result_type');

/**
 * @class
 * A class that represents result of validation(dataElement).
 */
class ValidationResult {
  /**
   * @param {Object} resultType
   * @param {String} desc
   */
  constructor(resultType, desc='') {
    this._resultType = resultType;
    this._desc = desc;
  }

  get resultType() {
    return this._resultType;
  }

  get desc() {
    return this._desc;
  }

  isValid() {
    return this.resultType === ResultType.SUCCESS;
  }
}

module.exports = ValidationResult;
