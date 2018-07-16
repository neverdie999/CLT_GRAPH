import {readDataFileJson} from '../../common/utilities/common.ult'

const ID_FOLDER_OPEN_FILE_MGMT = 'folderOpenFileMgmt';
const ID_CONTAINER_FILE_MGMT = 'containerFileMgmt';
const ID_OPTION_FILE_TYPE_INPUT = 'optionFileTypeInput';
const ID_INPUT_FILE_DATA = 'inputFileData';
const GROUP_OPTION_MODE_GRAPH = 'input:radio[name=graphMode]';
const ID_OUTPUT_FILE_NAME = 'outputFileName';
const ID_BUTTON_DOWNLOAD_FILE = 'btnDownloadFile';

class FileMgmt {
  constructor(props) {
    this.mainMgmt = props.mainMgmt;
    this.initialize();
  }

  initialize() {
    this.bindEventListenerToControls();
  }

  bindEventListenerToControls() {
    $(`#${ID_FOLDER_OPEN_FILE_MGMT}`).click(() => {
      $(`#${ID_CONTAINER_FILE_MGMT}`).slideToggle();
    });

    $(`#${ID_INPUT_FILE_DATA}`).change((event) => {
      this.readJsonFile(event);
    });
  }

  /**
   * Read content file Vertex Type Definition
   * or  read content file Graph Data Structure
   * @param event
   */
  async readJsonFile(event) {
    let file = event.target.files[0];
    if (!file)
      return;

    const data = await readDataFileJson(file);
    if (!data)
      return;

    const options = $(`#${ID_OPTION_FILE_TYPE_INPUT}`).val();
    this.mainMgmt.separateDataToManagement(data, options);
    $(`#${ID_CONTAINER_FILE_MGMT}`).slideToggle();
    $(`#${ID_INPUT_FILE_DATA}`).val(null);
  }
}

export default FileMgmt;
