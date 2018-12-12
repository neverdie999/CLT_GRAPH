import '../../../styles/index.scss'
import MainMgmt from './main-mgnt/main-mgmt'

class Starter {
	constructor() {
		this.initialize()
	}

	initialize() {

		/**
     * Init MainMgmt
     * @type {MainMgmt}
     */
		new MainMgmt()
	}
}

new Starter()
