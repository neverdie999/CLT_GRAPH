'use strict'

const MessageElementType = require('./message/message_element_type');
const ResultType = require('./message/result_type');
/**
 * @class
 * A class that assemble Jstree to fullText
 */
class MessageAssembler {
  /**
   * 
   * @param {String} messageType 
   */
  constructor(messageType) {
    this.messageType = messageType;
  }

  assemble(messageElement, delimiter, lineSeparator) {
    let assembledMessage = ['<style>mark{background-color:red;}</style>'];
    if (MessageElementType.isSegmentGroup(messageElement.elementType)) {    
      assembledMessage = assembledMessage.concat(this._assembleMessageSegmentGroup(messageElement, delimiter, lineSeparator));
    }
    if (MessageElementType.isSegment(messageElement.elementType)) {
      assembledMessage = assembledMessage.concat(this._assembleMessageSegment(messageElement, delimiter));
    }
    if (MessageElementType.isDataElement(messageElement.elementType)) {
      assembledMessage = assembledMessage.concat(this._assembleMessageDataElement(messageElement, delimiter));
    }
    return assembledMessage;
  }

  _assembleMessageSegmentGroup(messageElement, delimiter, lineSeparator='') {
    const children = messageElement.children;
    const sampleMessageSegmentGroup = [];

    if (Array.isArray(children)) {
      children.forEach((each) => {
        if (MessageElementType.isSegmentGroup(each.elementType)) {
          if (this.messageType === 'DICTIONARY') {
            sampleMessageSegmentGroup.push(`${delimiter.groupOpenDelimiter}${each.name}${delimiter.segmentTerminator}`);
          }

          sampleMessageSegmentGroup.push(this._assembleMessageSegmentGroup(each, delimiter, lineSeparator));

          if (this.messageType === 'DICTIONARY') {
            sampleMessageSegmentGroup.push(`${delimiter.groupCloseDelimiter}${each.name}${delimiter.segmentTerminator}`);
          }
        }

        if (MessageElementType.isSegment(each.elementType)) {        
          sampleMessageSegmentGroup.push(this._assembleMessageSegment(each, delimiter));
        }
      });
    }

    if (MessageElementType.isSegmentGroup(children.elementType)) {
      sampleMessageSegmentGroup.push(this._assembleMessageSegmentGroup(children, delimiter, lineSeparator));
    }
    if (MessageElementType.isSegment(children.elementType)) {    
      sampleMessageSegmentGroup.push(this._assembleMessageSegment(children, delimiter));
    }    
    return sampleMessageSegmentGroup.join(lineSeparator);
  }

  _assembleMessageSegment(messageElement, delimiter) {
    const messageDataElement = messageElement.children;
    let sampleMessageSegment = '';
    messageDataElement.forEach((eachDataSpecs, index) => {
      if (index === messageDataElement.length - 1) {
        sampleMessageSegment += this._assembleMessageDataElement(eachDataSpecs, delimiter, true);
      } else {
        sampleMessageSegment += this._assembleMessageDataElement(eachDataSpecs, delimiter);
      }
    });

    if (this.messageType === 'FIXEDLENGTH') {
      sampleMessageSegment += delimiter.segmentTerminator;
    } else {
      sampleMessageSegment = messageElement.name + delimiter.dataElementSeparator + sampleMessageSegment + delimiter.segmentTerminator;
    }
    return sampleMessageSegment;
  }

  _assembleMessageDataElement(dataSpecs, delimiter, lastMessageDataElementFlag = false) {
    let sampleDataElement = '';
    if (dataSpecs.length > 1) {
      dataSpecs.forEach((each, index) => {
        if (index === dataSpecs.length - 1) {
          if (lastMessageDataElementFlag) {
            sampleDataElement += each.value;
          } else {
            sampleDataElement += (each.value + delimiter.dataElementSeparator);
          }
        } else {
          sampleDataElement += (each.value + delimiter.componentDataSeparator);
        }
      });
      return sampleDataElement;
    }

    if (lastMessageDataElementFlag) {      
      if (dataSpecs[0].matchResult.resultType !== ResultType.SUCCESS) {
        sampleDataElement += `<mark>${dataSpecs[0].value}</mark>`;
      } else {
        sampleDataElement += dataSpecs[0].value;
      }
      return sampleDataElement;
    }

    if (dataSpecs[0].matchResult.resultType !== ResultType.SUCCESS) {
      sampleDataElement += `<mark>${dataSpecs[0].value}</mark>${delimiter.dataElementSeparator}`;
    } else {
      sampleDataElement += (dataSpecs[0].value + delimiter.dataElementSeparator);
    }

    return sampleDataElement;
  }
}

module.exports = MessageAssembler;
