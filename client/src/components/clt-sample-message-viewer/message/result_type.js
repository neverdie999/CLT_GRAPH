'use strict';
/**
 * @class
 * A class that presents result of match, validation.
 */
class ResultType {
  static get SUCCESS() {
    return Symbol.for('SUCCESS');
  }

  static get FAIL_FIND_TARGET_GROUP() {
    return Symbol.for('FAIL_FIND_TARGET_GROUP');
  }

  static get FAIL_VALIDATION_GROUP() {
    return Symbol.for('FAIL_VALIDATION_GROUP');
  }

  static get FAIL_FIND_TARGET_SEGMENT() {
    return Symbol.for('FAIL_FIND_TARGET_SEGMENT');
  }

  static get FAIL_VALIDATION_SEGMENT() {
    return Symbol.for('FAIL_VALIDATION_SEGMENT');
  }

  static get FAIL_FIND_TARGET_DATA_ELEMENT() {
    return Symbol.for('FAIL_FIND_TARGET_DATA_ELEMENT');
  }

  static get FAIL_VALIDATION_DATA_ELEMENT() {
    return Symbol.for('FAIL_VALIDATION_DATA_ELEMENT');
  }
}

module.exports = ResultType;
