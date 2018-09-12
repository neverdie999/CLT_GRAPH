import FileMgmt from '../file-mgmt/file-mgmt';
import CltSegment from '../../../components/clt-segment/clt-segment';
import { VIEW_MODE } from '../../../common/const/index';

class MainMgmt {
  constructor(props) {

    this.cltSegment = new CltSegment({
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
      await this.cltSegment.LoadVertexGroupDefinition(data);
    }else if (option === "GRPH_DATA") {
      await this.cltSegment.loadSegmentSpecEditor(data);
    }
  }

  save(fileName){
    this.cltSegment.save(fileName);
  }
};
export default MainMgmt;
