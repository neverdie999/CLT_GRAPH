import MainMgmt from './main-mgmt/main-mgmt'
import '../../../styles/index.scss'

class Starter {
	constructor() {
		this.initialize()
	}

	initialize() {
		/**
     * Init Main Mgmt
     * @type {MainMgmt}
     */
		this.mainMgmt = new MainMgmt()
	}
}

new Starter()
