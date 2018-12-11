'use strict';

const FileReader = require('./file_reader');
/**
 * @class
 * message sample reader.
 */
class MessageReader {
  /**
   * read message sample.
   * @static
   * @param {String} fileName
   * @returns {String}
   */
  static read(fileName) {
    return FileReader.read(fileName);
  }
}
module.exports = MessageReader;
