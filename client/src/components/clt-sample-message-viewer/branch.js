/**
 * @class
 * A class that represents paramater og JsTree Lib.
 */
class Branch {
  /**
   * @param {String} id
   * @param {String} parent
   * @param {String} text
   * @param {String} icon
   * @param {String} state
   * @param {String} li_attr
   * @param {String} a_attr
   */
  constructor(id, parent, text, icon, state, li_attr, a_attr) {
    this.id = id;
    this.parent = parent;
    this.text = text;
    this.icon = icon;
    this.state = state;
    this.li_attr = li_attr;
    this.a_attr = a_attr;
  } 
}

module.exports = Branch;
