import MainMgmt from './modules/main-mgmt/main-mgmt';
import ObjectUtils from './common/utilities/object.ult';
import {cancleSelectedPath} from './common/utilities/common.ult';

import * as d3 from 'd3';
import {
  COMMON_DATA,
} from './const/index';
import './styles/index.scss';

class Starter {
  constructor() {
    this.initialize();
  }

  initialize() {
    this.dataContainer = {
      vertex: [],
      boundary: [],
      edge: [],
      vertexTypes: {},
    };
    this.dataContainer1 = {
      vertex: [],
      boundary: [],
      edge: [],
      vertexTypes: {},
    };
    this.dataContainer2 = {
      vertex: [],
      boundary: [],
      edge: [],
      vertexTypes: {},
    };
    this.dataContainer3 = {
      vertex: [],
      boundary: [],
      edge: [],
      vertexTypes: {},
    };
    // this.svgSelector = d3.select(`.${SVG_CONTAINER_CLASS}`)
    this.svgSelector = d3.select(`#simulateConnect`)
      .on("mouseup", function () {
        let mouse = d3.mouse(this);
        let elem = document.elementFromPoint(mouse[0], mouse[1]);
        if ((!elem || !elem.tagName || elem.tagName != 'path') && COMMON_DATA.isUpdateEdge) {
          cancleSelectedPath();
        }
      });

    /**
     * Init Object Utils
     * @type {ObjectUtils}
     */
    this.objectUtils = new ObjectUtils({
      dataContainer: this.dataContainer,
      dataContainer1: this.dataContainer1,
      dataContainer2: this.dataContainer2,
      dataContainer3: this.dataContainer3
    });

    /**
     * Init Main Mgmt
     * @type {MainMgmt}
     */
    this.mainMgmt = new MainMgmt({
      dataContainer: this.dataContainer,
      svgSelector: this.svgSelector,
      objectUtils: this.objectUtils,
      dataContainer1: this.dataContainer1,
      dataContainer2: this.dataContainer2,
      dataContainer3: this.dataContainer3,
    });
  }
}

export default new Starter();
