const fs = require('fs');
const simpleGit = require('simple-git/promise');
const { colors, addColor, getCurrent } = require('./utils');

global.git = simpleGit();

const root = process.env.BM_PATH;
const curdir = process.cwd();
const bashCurdir = curdir.replace(root, '~');
const splitDir = bashCurdir.split('/');
const len = splitDir.length;

const buildPrompt = async () => {
    const directory = splitDir[len-1];
    const isGit = fs.existsSync(`${curdir}/.git`);
    const gitBranch = isGit ? await getCurrent() : '';
    const gitBranchValue = gitBranch || `${gitBranch}`;
    addColor([ 'Bright', 'FgBlue' ]);
    const line1 = `╭─ ${colors.Reset}${colors.FgWhite}${colors.Bright}${directory} ${colors.Bright}${colors.FgBlue}|│ ${colors.FgWhite}${gitBranchValue}`;
    let line2 = '';
    if (isGit) {
        const status = await git.status()
        // console.log(status);
        const { not_added, modified, deleted, created } = status;
        const startLn = `${colors.Dim}${colors.Bright}${colors.FgBlue}│`;
        const notAddedLn = not_added.length ? `${colors.Reset}${colors.Dim}${colors.FgCyan} ${not_added.length}U ` : '';
        const modifiedLn = modified.length ? `${colors.Reset}${colors.Bright}${colors.FgCyan} ${modified.length}M ` : '';
        const createdLn = created.length ? `${colors.Reset}${colors.Bright}${colors.FgGreen} ${created.length}C ` : '';
        const deletedLn = deleted.length ? `${colors.Reset}${colors.Bright}${colors.FgRed} ${deleted.length}D ` : '';
        const data = !!createdLn || !!deletedLn || !!notAddedLn || !!modifiedLn;
        line2 = data ? ` ${startLn}${createdLn}${deletedLn}${notAddedLn}${modifiedLn}` : '';

    }

    const line3 = `\n${colors.Reset}${colors.FgBlue}${colors.Bright}╰│| ${colors.Reset}`

    console.log(`\n${line1}${line2}${line3}`);
}

buildPrompt();


// # ╭─╮
// # │ │
// # ╰─╯