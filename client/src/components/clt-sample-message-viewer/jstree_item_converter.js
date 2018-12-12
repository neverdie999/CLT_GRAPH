const Branch = require('./branch');
const MessageElementType = require('./message/message_element_type');

/**
 * @class
 * A class that converter to messageStructre to Jstree.
 */
class JsTreeItemConverter {
  constructor() {
    this._rootId = '#';
    this._treeItems = [];
    this._messageElementMap = new Map();
  }

  /**
  *
  * @param {Object} messageStructure
  * convert messageStructure to Jstree.
  */
  convert(messageStructure) {
    if (
      MessageElementType.isNotSegmentGroup(messageStructure.elementType)
      && MessageElementType.isNotSegment(messageStructure.elementType)
      && MessageElementType.isNotDataElement(messageStructure.elementType)
    ) {
      return null;
    }

    this._treeItems.length = 0;
    this._messageElementMap.clear();

    const root = new Branch(messageStructure.id, this._rootId, `${messageStructure.name}[${messageStructure.order}/${messageStructure.spec.maxRepeat}]`);
    this._treeItems.push(root);
    this._messageElementMap.set(messageStructure.id, messageStructure);

    messageStructure.children.forEach((child) => {
      if (MessageElementType.isSegmentGroup(child.elementType)) {
        this._makeMessageSegmentGroupBranch(child, messageStructure.id);
        return;
      }

      if (MessageElementType.isSegment(child.elementType)) {      
        this._makeMessageSegmentBranch(child, messageStructure.id);
        return;
      }

      this._makeMessageDataElementBranch(child, messageStructure.id);
    });

    return {
      treeItems: this._treeItems,
      itemMap: this._messageElementMap,
    };
  }

  _makeMessageSegmentGroupBranch(messageSegmentGroup, parentId) {
    if (!this._messageElementMap.get(messageSegmentGroup.id)) {
      const branchName = `${messageSegmentGroup.name}[${messageSegmentGroup.order}/${messageSegmentGroup.spec.maxRepeat}]`;
      const branch = new Branch(messageSegmentGroup.id, parentId, branchName);
      this._treeItems.push(branch);
      this._messageElementMap.set(messageSegmentGroup.id, messageSegmentGroup);
    }

    const childrenElement = messageSegmentGroup.children;
    if (Array.isArray(childrenElement)) {
      childrenElement.forEach((element) => {
        if (MessageElementType.isSegmentGroup(element.elementType)) {
          this._makeMessageSegmentGroupBranch(element, messageSegmentGroup.id);
          return;
        }
        if (MessageElementType.isSegment(element.elementType)) {
          this._makeMessageSegmentBranch(element, messageSegmentGroup.id);
          return;
        }
      });
    }
  }

  _makeMessageSegmentBranch(messageSegment, parentId) {
    let branch;
    const messageSegmentId = `${messageSegment.id}`;
    if (!this._messageElementMap.get(messageSegmentId)) {
      const branchName = `${messageSegment.name}[${messageSegment.order}/${messageSegment.spec.maxRepeat}]`;
      branch = new Branch(messageSegmentId, parentId, branchName);
      if (branch.parent === '') {
        branch.parent = this._rootId;
      }
    }
    this._treeItems.push(branch);
    this._messageElementMap.set(messageSegmentId, messageSegment);
  }

  _makeMessageDataElementBranch(dataSpecs, parentId) {
    if (dataSpecs.length > 1) {
      dataSpecs.forEach((eachDataSpec, index) => {
        const id = `${parentId}-${index}`;
        this._treeItems.push(new Branch(id, parentId, eachDataSpec.name));
        this._messageElementMap.set(id, dataSpecs[index]);
      });
      return;
    }

    const id = `${parentId}-${dataSpecs[0].spec.name}`;
    this._treeItems.push(new Branch(id, parentId, dataSpecs[0].name));
    this._messageElementMap.set(id, [dataSpecs[0], dataSpecs[0].value]);
  }
}

module.exports = JsTreeItemConverter;
