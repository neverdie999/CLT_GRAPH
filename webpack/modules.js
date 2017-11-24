const rulesConfig = require('./rules');

const modulesConfig = (isDebug) => {
  return {
    // Make missing exports an error instead of warning
    strictExportPresence: true,
    rules: rulesConfig(isDebug),
  };
};

module.exports = modulesConfig;
