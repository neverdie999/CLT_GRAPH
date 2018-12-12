'use strict';

const fs = require('fs');

/**
 * @class
 * A class that reads file
 */
class FileReader {
  /**
   * @static
   * @param {String} fileName
   * @returns {String}
   */
  static read(fileName) {
    try {      
      const data = fs.readFileSync(fileName);
      return data.toString();
    } catch (ex) {
      console.error(ex);
      return '';
    }
  }
}

module.exports = FileReader;
