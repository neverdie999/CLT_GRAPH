const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')

getInstallerConfig()
  .then(createWindowsInstaller)
  .catch((error) => {
    console.error(error.message || error)
    process.exit(1)
  })

function getInstallerConfig () {
  console.log('Creating windows installer');

  const rootPath = path.join('./');
  const outPath = path.join(rootPath, 'release-builds');

  return Promise.resolve({
    appDirectory: path.join(outPath, 'Algeta-mapping-app-win32-ia32/'),
    authors: 'Hoang Pham',
    noMsi: true,
    outputDirectory: path.join(outPath, 'windows-installer'),
    exe: 'algeta-mapping-app.exe',
    setupExe: 'settup.exe'
    // setupIcon: path.join(rootPath, 'client', 'assets', 'icons', 'win', 'icon.ico')
  });
}
