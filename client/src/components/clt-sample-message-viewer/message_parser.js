const MessageSegment = require('./message/message_segment');
const MessageSegmentGroup = require('./message/message_segment_group');
const MessageDataElement = require('./message/message_data_element');
const MatchResult = require('./message/match_result');
const ResultType = require('./message/result_type');

/**
 * @class
 * parser sampleMessage to messageStructure
 */
class MessageParser {
  /**
   * @param {String} delimiter
   * @param {String} messageType
   * @param {Object} lastMatchedSegmentGroup
   * @param {Object} lastMatchedMessageSegmentGroup
   * @param {Object} currentMessageSegmentGroupStack
   * @param {Object} lastMatchedSegment
   * @param {Object} lastMatchedMessageSegment
   * @param {Object} currentMatchedSegmentGroup
   * @param {Object} currentMatchedSegment
   */
  constructor(delimiter, messageType='', lastMatchedSegmentGroup, lastMatchedMessageSegmentGroup=null, currentMessageSegmentGroupStack=[], lastMatchedSegment='', lastMatchedMessageSegment='', currentMatchedSegmentGroup='', currentMatchedSegment='') {
    this._delimiter = delimiter;
    this._messageType = messageType;
    this._lastMatchedSegmentGroup = lastMatchedSegmentGroup;
    this._lastMatchedMessageSegmentGroup = lastMatchedMessageSegmentGroup;
    this._currentMessageSegmentGroupStack = currentMessageSegmentGroupStack;
    this._lastMatchedSegment = lastMatchedSegment;
    this._lastMatchedMessageSegment = lastMatchedMessageSegment;
    this._currentMatchedSegmentGroup = currentMatchedSegmentGroup;
    this._currentMatchedSegment = currentMatchedSegment;
  }

  /**
   * @param {String} message
   * @param {String} spec
   * parse message
   */
  parseMessage(message, spec) {
    const removedCrlfMessage = this._removeCrlf(message, this.messageType);
    const rootMessageSegmentGroup = new MessageSegmentGroup();
    rootMessageSegmentGroup.name = spec[0].name;
    rootMessageSegmentGroup.id = spec[0].id;
    rootMessageSegmentGroup.order = 1;
    rootMessageSegmentGroup.parent = rootMessageSegmentGroup;
    
    this._lastMatchedMessageSegmentGroup = rootMessageSegmentGroup;
    return this._parseSegmentGroup(removedCrlfMessage, rootMessageSegmentGroup);
  }

  _parseSegmentGroup(message, rootMessageSegmentGroup) {
    const messageSampleSegments = this._splitMessageBySegmentDelimiter(message);
    const root = rootMessageSegmentGroup;
    root.spec = this._lastMatchedSegmentGroup;
    for (const eachMessageSampleSegment of messageSampleSegments) {
      if (this._delimiter.groupCloseDelimiter && eachMessageSampleSegment.startsWith(this._delimiter.groupCloseDelimiter)) {
        const [, segmentGroupName] = eachMessageSampleSegment.split(this._delimiter.groupCloseDelimiter);
        this.lastMatchedSegmentGroup = this._currentMessageSegmentGroupStack.pop();
        if (!(this.lastMatchedSegmentGroup.name === segmentGroupName)) {
          return new MatchResult(ResultType.FAIL_FIND_TARGET_GROUP, `[GROUP]"${segmentGroupName}" MATCH FAILED`);
        }
        continue;
      }

      if (this._delimiter.groupOpenDelimiter && eachMessageSampleSegment.startsWith(this._delimiter.groupOpenDelimiter)) {
        const [, segmentGroupName] = eachMessageSampleSegment.split(this._delimiter.groupOpenDelimiter);
        if (this._lastMatchedSegmentGroup.name === segmentGroupName) {
          this._matchLastGroup(segmentGroupName);
          continue;
        } else {
          const matchResult = this._lastMatchedSegmentGroup.matchGroup(segmentGroupName);
          if (matchResult.resultType === ResultType.FAIL_FIND_TARGET_GROUP) {
            return matchResult;
          }
          this._currentMatchedSegmentGroup = matchResult.matchedSegmentGroup;
          const newMessageSegmentGroup = new MessageSegmentGroup();
          newMessageSegmentGroup.name = segmentGroupName;
          newMessageSegmentGroup.order = 1;
          newMessageSegmentGroup.id = `${this._currentMatchedSegmentGroup.id}-${newMessageSegmentGroup.order}`;
          newMessageSegmentGroup.spec = this._currentMatchedSegmentGroup;
          this._lastMatchedMessageSegmentGroup.children.push(newMessageSegmentGroup);
          this._lastMatchedMessageSegmentGroup = newMessageSegmentGroup;
          this._currentMessageSegmentGroupStack.push(this._lastMatchedMessageSegmentGroup);
          this._lastMatchedSegmentGroup = this._currentMatchedSegmentGroup;
          continue;
        }
      }

      let matchResult = new MatchResult();
      const currentSegmentGroup = this._lastMatchedSegmentGroup;
      matchResult = this._matchStructureFromChildren(eachMessageSampleSegment, currentSegmentGroup);


      if (!matchResult.isValid() && matchResult.resultType !== ResultType.FAIL_FIND_TARGET_GROUP) {
        return matchResult;
      }
      if (!matchResult.isValid()) {
        matchResult = this._matchStructureFromAncestors(eachMessageSampleSegment, currentSegmentGroup, matchResult);
        if (!matchResult.isValid()) {
          return matchResult;
        }
      }

      // matched!
      this._currentMatchedSegmentGroup = matchResult.matchedSegment.parent;
      this._currentMatchedSegment = matchResult.matchedSegment;
      this._currentMatchedSegment.instanceIndex += 1;

      if (this._currentMatchedSegment.instanceIndex >= this._currentMatchedSegment.maxRepeat || this._currentMatchedSegmentGroup.name !== this._lastMatchedSegmentGroup.name) {
        const creationResult = this._createMessageSegmentGroup(matchResult);
        if (creationResult.resultType) {
          return creationResult;
        }
        const newMessageSegmentGroup = creationResult;
        newMessageSegmentGroup.children.push(this._parseSegment(eachMessageSampleSegment, this._currentMatchedSegment.name, newMessageSegmentGroup));        
        this._lastMatchedMessageSegmentGroup = newMessageSegmentGroup;
      } else {        
        this._lastMatchedMessageSegmentGroup.children.push(this._parseSegment(eachMessageSampleSegment, this._currentMatchedSegment.name, this._lastMatchedMessageSegmentGroup));
      }
      this._lastMatchedSegmentGroup = this._currentMatchedSegmentGroup;
      this._lastMatchedSegment = this._currentMatchedSegment;
    }

    return root;
  }

  _createMessageSegmentGroup(matchResult) {    
    if (this._lastMatchedSegmentGroup.depth < this._currentMatchedSegmentGroup.depth) { // child case
      const depthDiff = this._currentMatchedSegmentGroup.depth - this._lastMatchedSegmentGroup.depth;
      if (depthDiff !== 1) {
        return new MatchResult(ResultType.FAIL_FIND_TARGET_GROUP, 
          `[${this._currentMatchedSegmentGroup.name} - ${this._currentMatchedSegmentGroup.depth}][${this._lastMatchedSegmentGroup.name} - ${this._lastMatchedSegmentGroup.depth}]DEPTH_DIFF_ERROR`);
      }
      const matchedSegmentGroup = this._currentMatchedSegment.parent;
      const newMessageSegmentGroup = new MessageSegmentGroup(matchedSegmentGroup.name);
      
      newMessageSegmentGroup.spec = matchedSegmentGroup;
      newMessageSegmentGroup.parent = this._lastMatchedMessageSegmentGroup;
      this._setMessageSegmentGroupOrder(newMessageSegmentGroup);
      newMessageSegmentGroup.id = `${this._currentMatchedSegmentGroup.id}-${newMessageSegmentGroup.order}`;
      this._lastMatchedMessageSegmentGroup.children.push(newMessageSegmentGroup);
      this._lastMatchedMessageSegmentGroup = newMessageSegmentGroup;
      this._lastMatchedSegmentGroup = matchedSegmentGroup;
      return newMessageSegmentGroup;
    }

    if (this._lastMatchedSegmentGroup.depth === this._currentMatchedSegmentGroup.depth) { // sibling case
      const newMessageSegmentGroup = new MessageSegmentGroup(this._currentMatchedSegmentGroup.name);
      newMessageSegmentGroup.spec = this._currentMatchedSegmentGroup;
      newMessageSegmentGroup.parent = this._lastMatchedMessageSegmentGroup.parent;
      this._setMessageSegmentGroupOrder(newMessageSegmentGroup);
      newMessageSegmentGroup.id = `${this._currentMatchedSegmentGroup.id}-${newMessageSegmentGroup.order}`;
      if (newMessageSegmentGroup.order > newMessageSegmentGroup.spec.maxRepeat) {
        return new MatchResult(ResultType.FAIL_VALIDATION_GROUP, `[GROUP][${newMessageSegmentGroup.spec.name}][${this._currentMatchedSegment.name}]MAX_REPEAT_VIOLATION`);
      }
      if (this._lastMatchedMessageSegmentGroup.parent) {
        this._lastMatchedMessageSegmentGroup.parent.children.push(newMessageSegmentGroup);
      } else {
        return new MatchResult(ResultType.FAIL_VALIDATION_GROUP, `[${this._lastMatchedMessageSegmentGroup}]LAST_MATCH_HAS_NO_PARENT`);
      }

      return newMessageSegmentGroup;
    }

    if (this._lastMatchedSegmentGroup.depth > this._currentMatchedSegmentGroup.depth) { // ancestor, ancestor-sibling case      
      const depthDiff = this._currentMatchedSegmentGroup.depth - this._lastMatchedSegmentGroup.depth;
      let messageSegmentGroupParent;
      if (this._lastMatchedMessageSegmentGroup.parent.length > 0) {
        messageSegmentGroupParent = this._lastMatchedMessageSegmentGroup.parent;
      } else {
        messageSegmentGroupParent = this._lastMatchedMessageSegmentGroup;
      }
      if (depthDiff > 1) {
        for (let i = 0; i < depthDiff; i += 1) {
          messageSegmentGroupParent = messageSegmentGroupParent.parent;
        }
      }
      
      const matchedSegmentGroup = matchResult.matchedSegment.parent;
      const messageSegmentGroup = new MessageSegmentGroup(matchedSegmentGroup.name);
      messageSegmentGroup.spec = matchedSegmentGroup;
      messageSegmentGroup.parent = messageSegmentGroupParent;
      messageSegmentGroup.id = matchedSegmentGroup.id;
      messageSegmentGroup.order = matchedSegmentGroup._instances.length - 1;
      messageSegmentGroupParent.children.push(messageSegmentGroup);
      this._lastMatchedMessageSegmentGroup = messageSegmentGroupParent;
      this._lastMatchedSegmentGroup = matchedSegmentGroup;
      return messageSegmentGroup;
    }

    return new MatchResult(ResultType.FAIL_FIND_TARGET_GROUP, `[${this._currentMatchedSegmentGroup.name}]INVALID GROUP`);
  }

  _parseSegment(messageSampleSegment, messageSampleSegmentName='', parent) {
    const newMessageDataElements = [];
    if (this.messageType === 'DICTIONARY') {
      if (!this._delimiter.dataElementSeparator) {
        return new MatchResult(ResultType.FAIL_VALIDATION_SEGMENT, 'NO_DATA_ELEMENT_SEPARATOR');
      }

      let messageSampleDataElements = messageSampleSegment;
      if (this._delimiter.dataElementSeparator) {
        messageSampleDataElements = messageSampleSegment.split(this._delimiter.dataElementSeparator);
      }

      const messageDataElement = messageSampleDataElements.slice(1).join(this._delimiter.dataElementSeparator);
      newMessageDataElements.push(this._parseDataElement(messageDataElement, this._currentMatchedSegment._dataElements));
    } else if (this.messageType === 'FIXEDLENGTH') {
      let start = 0;
      this._currentMatchedSegment.dataElements.forEach((eachMessageDataElement, index) => {
        const lengthRegex = /\d+/;
        const specLength = parseInt(eachMessageDataElement.format.match(lengthRegex)[0], 10);
        const messageDataElement = messageSampleSegment.substr(start, specLength);
        newMessageDataElements.push(this._parseDataElement(messageDataElement, this._currentMatchedSegment._dataElements[index]));
        start += specLength;
      });
    } else {
      if (!this._delimiter.dataElementSeparator) {
        return new MatchResult(ResultType.FAIL_VALIDATION_SEGMENT, 'NO_DATA_ELEMENT_SEPARATOR');
      }

      let messageSampleDataElements = messageSampleSegment;
      if (this._delimiter.dataElementSeparator) {
        messageSampleDataElements = messageSampleSegment.split(this._delimiter.dataElementSeparator);
      }
      let j = 0;
      messageSampleDataElements.forEach((messageDataElement, i) => {
        if (i < 1) {
          return;
        }
        if (this._currentMatchedSegment._dataElements[j].type === 'COMPOSITE') {
          j += 1;
          let k = j;
          while (this._currentMatchedSegment._dataElements[k].type === 'COMPONENT') {
            k += 1;
            if (this._currentMatchedSegment._dataElements[k] === undefined || this._currentMatchedSegment._dataElements[k].type !== 'COMPONENT') {
              newMessageDataElements.push(this._parseDataElement(messageDataElement, this._currentMatchedSegment._dataElements.slice(j, k)));
              j = k;
              break;
            }
          }
          return;
        }
        newMessageDataElements.push(this._parseDataElement(messageDataElement, this._currentMatchedSegment._dataElements[j]));
        j += 1;
      });
    }

    const newMessageSegment = new MessageSegment(messageSampleSegmentName, newMessageDataElements);    
    newMessageSegment.parent = parent;
    this._setMessageSegmentOrder(newMessageSegment);
    newMessageSegment.id = `${this._currentMatchedSegment.id}-${newMessageSegment.parent.order}-${newMessageSegment.order}`;
    const segments = this._currentMatchedSegmentGroup.children;
    segments.forEach((segment) => {
      if (segment.name === newMessageSegment.name) {
        newMessageSegment.spec = segment;
      }
    });
    this._lastMatchedMessageSegment = newMessageSegment;
    return newMessageSegment;
  }

  _parseDataElement(messageDataElement, dataElements) {
    let dataSpecs = [messageDataElement];
    if (this._delimiter.componentDataSeparator) {
      dataSpecs = messageDataElement.split(this._delimiter.componentDataSeparator);
    }
    const messageDataElements = [];
    if (dataSpecs.length > 1) {
      dataSpecs.forEach((dataSpec, index) => {
        messageDataElements.push(new MessageDataElement('MULTI', dataElements[index].name, dataSpec, dataElements[index], dataElements[index].id));
        dataElements[index].value = dataSpec;
      });
      return messageDataElements;
    }

    if (Array.isArray(dataElements)) {
      messageDataElements.push(new MessageDataElement('SINGLE', dataElements[0].name, dataSpecs[0], dataElements[0], dataElements[0].id));
      dataElements[0].value = dataSpecs[0];
    } else {
      messageDataElements.push(new MessageDataElement('SINGLE', dataElements.name, dataSpecs[0], dataElements, dataElements.id));
      dataElements.value = dataSpecs[0];
    }
    return messageDataElements;
  }

  _removeCrlf(message, messageType) {
    const delimiterTypeStreamingRegex = new RegExp(/\n|\r/, 'g');
    let removedMessage = message;
    if (messageType === 'DELIMITER') {
      removedMessage = message.replace(delimiterTypeStreamingRegex, '');
    }
    return removedMessage;
  }

  _createSegmentGroupSpec(segmentGroup) {
    const returnSegmentGroup = {
      name: segmentGroup.name,
      depth: segmentGroup.depth,
      maxRepeat: segmentGroup.maxRepeat,
      mandatory: segmentGroup.mandatory,
      description: segmentGroup.description,
      instanceIndex: segmentGroup.instanceIndex,
    };
    return returnSegmentGroup;
  }

  _createSegmentSpec(segment) {
    const returnSegment = {
      name: segment.name,
      description: segment.description,
      dataElements: segment.dataElements,
      mandatory: segment.mandatory,
      maxRepeat: segment.maxRepeat,

    };
    return returnSegment;
  }

  _splitMessageBySegmentDelimiter(message) {
    return message.split(this._delimiter.segmentTerminator).filter(val => val.length > 0);
  }

  _matchStructureFromChildren(eachMessageSampleSegment, currentSegmentGroup) {
    const matchResult = currentSegmentGroup.matchStructure(eachMessageSampleSegment, this._messageType, this._delimiter);
    if (matchResult.resultType !== ResultType.FAIL_FIND_TARGET_SEGMENT) {
      return matchResult;
    }

    return this._matchStructureFromAncestors(eachMessageSampleSegment, currentSegmentGroup, matchResult);
  }

  _matchStructureFromAncestors(eachMessageSampleSegment, currentSegmentGroup, matchResult) {
    while (matchResult.resultType === ResultType.FAIL_FIND_TARGET_SEGMENT) {
      currentSegmentGroup = currentSegmentGroup.parent;
      if (!currentSegmentGroup) {
        matchResult._resultType = ResultType.FAIL_FIND_TARGET_SEGMENT;
        matchResult._desc = 'PARENT IS NULL';
        return matchResult;
      }

      return this._matchStructureFromChildren(eachMessageSampleSegment, currentSegmentGroup);
    }
    return new MatchResult(ResultType.FAIL_FIND_TARGET_GROUP, `${this.currentMatchedSegmentGroup}MATCH FAILED`);
  }

  _setMessageSegmentGroupOrder(messageSegmentGroup) {
    if (
      this._lastMatchedSegmentGroup._name === messageSegmentGroup.name
      && this._lastMatchedMessageSegmentGroup.id !== messageSegmentGroup.id
    ) {
      messageSegmentGroup.order = this._lastMatchedMessageSegmentGroup.order + 1;
    } else {
      messageSegmentGroup.order = 1;
    }    
  }

  _setMessageSegmentOrder(messageSegment) {
    if (
      this._lastMatchedMessageSegment.name === messageSegment.name
      && this._lastMatchedMessageSegment.parent.id === messageSegment.parent.id
    ) {
      messageSegment.order = this._lastMatchedMessageSegment.order + 1;
    } else {
      messageSegment.order = 1;
    }
  }

  _matchLastGroup(segmentGroupName) {
    this._currentMatchedSegmentGroup = this._lastMatchedSegmentGroup;
    const newMessageSegmentGroup = new MessageSegmentGroup();
    this._setMessageSegmentGroupOrder(newMessageSegmentGroup);
    newMessageSegmentGroup.name = segmentGroupName;
    newMessageSegmentGroup.order += 1;
    newMessageSegmentGroup.id = `${this._currentMatchedSegmentGroup.id}-${newMessageSegmentGroup.order}`;
    newMessageSegmentGroup.spec = this._lastMatchedMessageSegmentGroup;
    this._lastMatchedMessageSegmentGroup.children.push(newMessageSegmentGroup);
    this._lastMatchedMessageSegmentGroup = newMessageSegmentGroup;
    this._currentMessageSegmentGroupStack.push(this._lastMatchedMessageSegmentGroup);
  }

  _printMatchInfo() {
    console.log(this._currentMatchedSegment.name);
    console.log(this._currentMatchedSegmentGroup.name);
    console.log(this._lastMatchedSegmentGroup.name);
    console.log(this._currentMatchedSegment.maxRepeat);
  }

  get messageType() {
    return this._messageType;
  }
}

module.exports = MessageParser;
