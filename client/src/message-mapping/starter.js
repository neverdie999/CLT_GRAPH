import './styles/index.scss';
import MainMgmt from './modules/main-mgnt/main-mgmt';

class Starter {
  constructor() {
    this.initialize();
  }

  initialize() {
    this.storeConnect = {
      edge: [],
    };
    this.storeInputMessage = {
      vertex: [],
      boundary: [],
    };
    this.storeOperations = {
      vertex: [],
      boundary: [],
    };
    this.storeOutputMessage = {
      vertex: [],
      boundary: [],
    };

    /**
     * Init MainMgmt
     * @type {MainMgmt}
     */
    new MainMgmt({
      storeConnect: this.storeConnect,
      storeInputMessage: this.storeInputMessage,
      storeOperations: this.storeOperations,
      storeOutputMessage: this.storeOutputMessage,
    });
  }
}

new Starter();
