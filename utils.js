const fs = require('fs');
const curDir = process.cwd();

const colors = {
    Reset: "\x1b[0m",
    Bright: "\x1b[1m",
    Dim: "\x1b[2m",
    Underscore: "\x1b[4m",
    Blink: "\x1b[5m",
    Reverse: "\x1b[7m",
    Hidden: "\x1b[8m",

    FgBlack: "\x1b[30m",
    FgRed: "\x1b[31m",
    FgGreen: "\x1b[32m",
    FgYellow: "\x1b[33m",
    FgBlue: "\x1b[34m",
    FgMagenta: "\x1b[35m",
    FgCyan: "\x1b[36m",
    FgWhite: "\x1b[37m",

    BgBlack: "\x1b[40m",
    BgRed: "\x1b[41m",
    BgGreen: "\x1b[42m",
    BgYellow: "\x1b[43m",
    BgBlue: "\x1b[44m",
    BgMagenta: "\x1b[45m",
    BgCyan: "\x1b[46m",
    BgWhite: "\x1b[47m",
}

const addColor = (arr) => {
    const values = arr.reduce((prev, item) => `${prev}${colors[item]}`, '')
    process.stdout.write(values);
}

const column = (arr, width, spaceChar = ' ') => {
    return arr.reduce((prev, item) => {
      const string = item || '';
      const len = string.length;
      let checker = false;
      let checkLen = 0;
      let val = 0;
      string.split('').forEach((str, idx) => {
          if (str === '\x1B' && !checker) {
            checker = true;
            val = idx
          }
          if (str === 'm' && checker) {
              checker = false;
              checkLen += idx - val
          }
      }, []);
      const space = width - (len - checkLen);
      let spaceValue = '';
      for (let i = 0; i < space; i++) spaceValue += spaceChar;
      return `${prev}${string}${spaceValue}`;
    }, '');
  
  }

  const handleDuplicates = (value, obj) => {
    let newValue = value;
    if (value in obj) newValue = handleDuplicates(value += value[0], obj);
    return newValue;
}

  const getDirs = async (dir) => {
    return new Promise((resolve, reject) => fs.readdir(dir, { withFileTypes: true }, (err, data) => {
        if (err) {
            console.log('ERROR');
            reject(err);
        }
        const dirs = data.reduce((prev, item) => {
            if (item.isDirectory()) return [ ...prev, item.name ];
            return [ ...prev ]
        }, []);
        resolve(dirs);
    }));
}

const getDirShortcuts = async () => {
    const dirs = await getDirs(curDir);
    // const repoData = {};
    const shortcuts = dirs.reduce((prev, filename) => {
        const separate = filename.split('-');
        const shortcutValue = separate.reduce((prev, item) => {
            let value = item[0];
            if (item[0] === '.') value = item[1];
            return prev + value.toLowerCase();
        }, '');
        let shortcut = handleDuplicates(shortcutValue, prev);
        // const directoryKey = `${curDir}/${filename}`;
        // if (directoryKey in repoData && 'shortcut' in repoData[directoryKey]) 
        //     shortcut = repoData[directoryKey].shortcut;
        return { ...prev, [shortcut]: filename}
    }, {});
    return shortcuts;
}

const readFile = (dir) => {
    return new Promise((resolve, reject) => 
        fs.readFile(dir, 'utf8', (err, data) => {
        if (err) reject(err);
        resolve(data);
    })
)};

const writeFile = (dir, data) => {
    const dataJSON = JSON.stringify(data);
    return new Promise((resolve, reject) => 
        fs.writeFile(dir, dataJSON, (err, data) => {
        if (err) reject(err);
        resolve(data);
    })
)};

const getCurrent = async () => {
    const data = await git.branchLocal();
    return data?.current;
}

const checkRemote = async (branch = 'origin') => {
    const data = await git.getRemotes(true);
    return data.find((item) => {
      return item.name === branch
    });
}

const appendFile = (filename, data) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(filename, data, { flag: 'a' }, (err) => {
          if (err) return reject(err)
          resolve();
        });
    });
}

const hasRemote = async () => {
    const current = await getCurrent();
    const data = await git.branch();
    return data.all.includes(`remotes/origin/${current}`);
}

module.exports = {
    column,
    hasRemote,
    readFile,
    writeFile,
    appendFile,
    getCurrent,
    checkRemote,
    getDirs,
    getDirShortcuts,
    colors,
    addColor
}