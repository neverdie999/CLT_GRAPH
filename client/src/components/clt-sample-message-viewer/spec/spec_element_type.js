/**
 * @class
 * A class that presents Spec Element type.
 * (SegmentGroup -> Segment -> DataElement)
 */
class SpecElementType {
  static get SegmentGroup() {
    return Symbol.for('SpecSegmentGroup');
  }

  static get Segment() {
    return Symbol.for('SpecSegment');
  }

  static get DataElement() {
    return Symbol.for('SpecDataElement');
  }

  static isSegmentGroup(type) {
    return type === SpecElementType.SegmentGroup;
  }

  static isSegment(type) {
    return type === SpecElementType.Segment;
  }

  static isDataElement(type) {
    return type === SpecElementType.DataElement;
  }  
}

module.exports = SpecElementType;
