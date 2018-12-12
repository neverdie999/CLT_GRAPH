'use strict';

const FileReader = require('./file_reader');
/**
 * @class
 * read graph data structure file
 */
class GraphDataStructureReader {
  /**
   *
   * @param {String} fileName
   * @returns {String}
   */
  static read(fileName) {
    return FileReader.read(fileName);
  }
}

module.exports = GraphDataStructureReader;
