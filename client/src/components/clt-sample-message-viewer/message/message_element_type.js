/**
 * @class
 * A class that presents messageElement type.
 * (MessageSegmentGroup -> MessageSegment -> MessageDataElement)
 */
class MessageElementType {
  static get SegmentGroup() {
    return Symbol.for('MessageSegmentGroup');
  }

  static get Segment() {
    return Symbol.for('MessageSegment');
  }

  static get DataElement() {
    return Symbol.for('MessageDataElement');
  }

  static isSegmentGroup(type) {
    return type === MessageElementType.SegmentGroup;
  }

  static isNotSegmentGroup(type) {
    return type !== MessageElementType.SegmentGroup;
  }

  static isSegment(type) {
    return type === MessageElementType.Segment;
  }

  static isNotSegment(type) {
    return type !== MessageElementType.Segment;
  }

  static isDataElement(type) {
    return type === MessageElementType.DataElement;
  }

  static isNotDataElement(type) {
    return type !== MessageElementType.DataElement;
  }
}

module.exports = MessageElementType;
