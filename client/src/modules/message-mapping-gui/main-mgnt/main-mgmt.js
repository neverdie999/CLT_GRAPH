import FileMgmt from '../file-mgmt/file-mgmt';
import CltMessageMapping from '../../../components/clt-message-mapping/clt-message-mapping';

class MainMgmt {
  constructor(props) {

    this.cltMessageMapping = new CltMessageMapping({
      selector: $('.wrap-container-area')
    });

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
    if (option === "DATA_INPUT_MESSAGE") {
      await this.cltMessageMapping.LoadInputMessage(data);

    }else if (option === "DATA_OUTPUT_MESSAGE") {
      await this.cltMessageMapping.LoadOutputMessage(data);

    }else if (option === "DATA_VERTEX_DEFINE_OPERATIONS") {
      await this.cltMessageMapping.LoadOperationsVertexDefinition(data);

    }else if (option === "DATA_MESSAGE_MAPPING_DEFINITION") {
      await this.cltMessageMapping.LoadMesseageMapping(data);
    }
  }

  save(fileName){
    this.cltMessageMapping.save(fileName);
  }
};
export default MainMgmt;