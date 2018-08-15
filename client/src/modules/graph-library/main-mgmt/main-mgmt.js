import FileMgmt from '../file-mgmt/file-mgmt';
import CltGraph from '../../../components/clt-graph/clt-graph';
import { VIEW_MODE } from '../../../common/const/index';

class MainMgmt {
  constructor(props) {

    this.cltGraph = new CltGraph({
      selector: $('.algetaContainer'),
      viewMode: VIEW_MODE.EDIT
    });

    /**
     * Init file mgmt
     */
    new FileMgmt({
      parent: this
    });
  }

  /**
   * Validation data input match structure of graph data
   * @param data
   * @param option
   */
  async separateDataToManagement(data, option) {
    if (option === "VERTEX_TYPE") {
      await this.cltGraph.LoadVertexDefinition(data);
    }else if (option === "GRPH_DATA") {
      await this.cltGraph.loadGraphData(data);
    }
  }

  save(fileName){
    this.cltGraph.save(fileName);
  }

  /**
   * Set mode graph is enable or disable edit
   * @param modeGraph
   */
  setGraphMode(modeGraph) {
    this.viewMode = modeGraph === "S" ? VIEW_MODE.SHOW_ONLY : VIEW_MODE.EDIT;
  }
};
export default MainMgmt;
