'use strict';

const ResultType = require('./result_type');
/**
 * @class
 * A class that represents result of match.
 */
class MatchResult {
  constructor(resultType, desc='', matchedSegment=null, matchedSegmentGroup=null, messageSegmentGroup=null) {
    this.resultType = resultType;
    this.desc = desc;
    this.matchedSegment = matchedSegment;
    this.matchedSegmentGroup = matchedSegmentGroup;
    this.messageSegmentGroup = messageSegmentGroup;
  }

  isValid() {
    return this.resultType === ResultType.SUCCESS;
  }
}

module.exports = MatchResult;
