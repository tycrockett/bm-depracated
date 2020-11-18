const fs = require('fs');
const simpleGit = require('simple-git/promise');
const readline = require('readline');
const chalk = require('chalk');
const { format } = require('date-fns');
const openBrowser = require('open');

const lg = console.log;
const { 
    colors, 
    column, 
    getDirShortcuts, 
    readFile, 
    writeFile, 
    appendFile,
    getCurrent, 
    checkRemote,
    addColor,
} = require('./utils');

const root = process.env.BM_PATH;
const args = process.argv.splice(2);
const curdir = process.cwd();
const bashCurdir = curdir.replace(root, '~');

const colorGradient = [
    [ 120, 130, 150 ],
    ...['', '', '', '' ].map((e, idx) => {
    const v1 = Math.min(100 + (idx*40), 255);
    const v2 = Math.min(140 + (idx*40), 255);
    const v3 = Math.min(200 + (idx*30), 255);
    return [ v1, v2, v3 ];
})]

const colorGradientLen = colorGradient.length-1;

global.git = simpleGit();

const prompt = async (questions) => {

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    let answers = [];
    rl.on('close', () => {});
    for await (const question of questions) {
        const answer = await new Promise(
            (resolve, reject) => rl.question(`${question} `, 
            (answer) => resolve(answer)));

        answers = [ ...answers, answer ];
    }
    rl.close();
    return answers;
}

const buildChar = (max, char) => {
    let value = '';
    for (let i = 0; i < max; i++) {
        value += char
    }
    return value;
}

const hasRemote = async () => {
    const current = await getCurrent();
    const data = await git.branch();
    return data.all.includes(`remotes/origin/${current}`);
}

const handleCmds = async () => {

    const isGit = fs.existsSync(`${curdir}/.git`);
    const settingsDir = `${root}/bm/repo-settings.json`;
    const repoSettingsExists = fs.existsSync(settingsDir);

    let repoSettings = {}
    let isInit = false;

    if (repoSettingsExists) {
        const repoSettingsJSON = await readFile(settingsDir);
        repoSettings = JSON.parse(repoSettingsJSON);
        isInit = (curdir in repoSettings);
    }

    const CMD = args[0];
    switch (CMD) {
        case 'list':
            const fileCountDir_list = `${root}/bm/file-count.json`;
            const fileCountJSON_list = await readFile(fileCountDir_list);
            const fileCount_list = JSON.parse(fileCountJSON_list);
            const data_list = fileCount_list[curdir];
            const count_list = data_list ? Object.values(data_list) : [];
            const maxCount_list = Math.max(...count_list);
            const unique_list = count_list.filter((item, i, ar) => ar.indexOf(item) === i);
            const reColorGradient = Math.min(unique_list.length, colorGradientLen);
            const reColor = (reColorGradient / colorGradientLen) * colorGradientLen;
            lg();
            addColor([ 'FgBlue', 'Bright', 'Underscore' ]);
            lg(`${bashCurdir}`);
            addColor([ 'Reset' ]);
            const dirShortcuts_list = await getDirShortcuts();
            const sorted_list = Object.keys(dirShortcuts_list).sort((a, b) => {
                const dir1 = data_list?.[dirShortcuts_list[a]] || 0;
                const dir2 = data_list?.[dirShortcuts_list[b]] || 0;
                return dir1-dir2;
            })
            sorted_list.forEach((sc) => {
                const dir = dirShortcuts_list[sc];
                const tmpCount_list = data_list?.[dir] || 0;
                let hexColor_list = maxCount_list > 0 ? colorGradient[0] : [255,255,255];
                if (tmpCount_list > 0 && maxCount_list > 0) {
                    const val = parseInt(tmpCount_list / maxCount_list * reColor) || 1;
                    hexColor_list = colorGradient[val];
                }
                lg(chalk.rgb(...hexColor_list)(column([sc, dir], 10)));
            });
        break;
        case 'cd':
            const dirShorcuts_cd = await getDirShortcuts();
            if (args[1] in dirShorcuts_cd) {
                const fileCountDir_cd = `${root}/bm/file-count.json`;
                const directory_cd = dirShorcuts_cd[args[1]];
                const fileCountJSON_cd = await readFile(fileCountDir_cd);
                const fileCount_cd = JSON.parse(fileCountJSON_cd);
                const count_cd = fileCount_cd?.[curdir]?.[directory_cd] + 1 || 1;
                const data_cd = { 
                    ...fileCount_cd, 
                    [curdir]: { 
                        ...(fileCount_cd?.[curdir] || {}),
                        [directory_cd]: count_cd 
                }}
                await writeFile(fileCountDir_cd, data_cd);
                lg(directory_cd);
            } else {
                lg('.');
            }
            
        break;
        case 'init':
            lg();
            if (!repoSettingsExists) await writeFile(settingsDir, {});
            if (!isInit) {
                const answers = await prompt(['Default Branch? (master)']);
                const defaultBranch = answers[0] || 'master';
                lg('Initializing...');
                const settingsJSON = await readFile(settingsDir);
                const settings = JSON.parse(settingsJSON);
                const data_init = { ...settings, [curdir]: { defaultBranch }};
                await writeFile(settingsDir, data_init);
            } else { lg(`${colors.FgYellow}${curdir}${colors.Reset} is already recognized.`) }
        break;
        case 'settings':
            if (!repoSettingsExists) lg(`Run ${colors.FgYellow}bm init ${colors.Reset} to use bm git commands.`);
            else lg(repoSettings?.[curdir] ?? 'BM Repo does not exist.');
        case 'mkdir':
            const check = `${args[1]} () { cd ${curdir}; if [ -z $1 ]; then bm list; fi; if [ -n $1 ]; then bm cd $1; fi; }`
            lg(check);
            try { await appendFile('test.txt', check);
            } catch (err) { lg(err) }
        break;
        case 'help': help()
        break;
    }

    if (isGit && isInit) {
        const { defaultBranch } = repoSettings[curdir];
        try {
            switch (CMD) {
                case 'n':
                case 'new':
                    const branchName = args[1];
                    if (branchName) {
                        lg();
                        await git.checkout(defaultBranch);
                        process.stdout.write(colors.FgGreen);
                        lg(`Updating ${colors.FgWhite}${defaultBranch}...`);
                        await git.pull('origin', defaultBranch);
                        process.stdout.write(colors.FgGreen);
                        lg(`Switching to`, `${colors.Bright}${colors.FgWhite}${branchName}`);
                        await git.checkoutLocalBranch(branchName);
                    } else {
                        lg('Need a branch name');
                    }
                break;
                case 'd':
                case 'delete':
                    const current_delete = await getCurrent();
                    await git.checkout(defaultBranch);
                    process.stdout.write(colors.FgRed);
                    lg('Deleting local branch...');
                    await git.deleteLocalBranch(current_delete, true);
            
                    const data_delete = await checkRemote(current_delete);
                    if (!!data_delete) {
                        lg('Deleting remote branch...');
                        await git.push(['origin', '--delete', current_delete])
                        await git.removeRemote(current_delete)
                        process.stdout.write(colors.FgGreen);
                        lg('Done');          
                    }
                break;

                case 'r':
                case 'remote':
                    const current_remote = await getCurrent();
                    const data_remote = await checkRemote('origin');
                    const ref_remote = data_remote?.refs?.push?.split(':')?.[1];
                    const defaultCheck = current_remote === defaultBranch ? '' : `/tree/${current_remote}`;
                    const url = `https://github.com/${ref_remote}`.replace('.git', defaultCheck);
                    lg();
                    lg(chalk.hex('#DD5')(url));
                    openBrowser(url);
                break;
            
                case 'co':
                case 'checkout':
                    if (args[1]) await git.checkout(args[1]);
                break;

                case 'c':
                case 'clear':
                    await git.add('./*');
                    await git.stash();
                break;

                case 'log':
                    const current_log = await getCurrent();
                    const logOptions = [ `-n`, `5`, `${defaultBranch}..${current_log}` ];
                    const data_log = await git.log(logOptions);
                    lg();
                    data_log.all.forEach((item) => {
                      lg('----------');
                      process.stdout.write(colors.FgGreen);
                      process.stdout.write(colors.Bright);
                      lg(item.message);
                      process.stdout.write(colors.Reset);
                      lg(item.author_name);
                      lg(format(new Date(item.date), 'MM/dd/yyyy h:mm:ss a'));
                      process.stdout.write(colors.Dim);
                      lg(item.hash);
                      process.stdout.write(colors.Reset);
                    })
                break;

                case '.':
                    if (args[1]) {
                      lg('Adding...');
                      await git.add('./*');
                      lg('Committing...');
                      await git.commit(args[1]);
                      const data_period = await hasRemote();
                      if (!!data_period) {
                        lg('Pushing...');
                        await git.push();
                      }
                    } else {
                      lg('Add a commit description.');
                    }
                break;

                case 'u':
                case 'update':
                    const current_update = await getCurrent();
                    await git.checkout(defaultBranch);
                    await git.pull('origin', defaultBranch);
                    await git.checkout(current_update);
                break;

                case 's':
                case 'status':
                    const status = await git.status();
                    console.log();
                    console.log('Changes:');
                    // console.log(status);
                    if (status?.modified.length) {
                        process.stdout.write(colors.FgCyan);
                        status?.modified.forEach((file) => console.log(`  `, file));
                        process.stdout.write(colors.Reset);
                    }
                    if (status?.not_added.length) {
                        process.stdout.write(colors.FgCyan);
                        process.stdout.write(colors.Dim);
                        status.not_added.forEach((file) => console.log(`  `, file));
                        process.stdout.write(colors.Reset);
                    }

                    if (status?.deleted.length) {
                        console.log('Deleted:');
                        process.stdout.write(colors.FgRed);
                        status?.deleted.forEach((file) => console.log(`  `, file));
                        process.stdout.write(colors.Reset);
                    }

                    if (!status?.modified.length &&
                        !status?.not_added.length &&
                        !status?.deleted.length
                        ) console.log('There are no changes.');

                break;

                case 'set':
                    const current_pushup = await getCurrent();
                    lg('Setting upstream...');
                    try {
                        await git.push(['--set-upstream', 'origin', current_pushup]);
                        await git.addRemote(current_pushup);
                    } catch (err) { lg(chalk.hex('#B55')('Couldnt set upstream')) }
                break;

                case 'github-setup':
                    if (args[1]) {
                        await git.raw([ 'remote', 'add', 'origin', args[1] ]);
                        await git.raw([ 'branch', '-M', defaultBranch ]);
                        await git.raw([ 'push', '-u', 'origin', defaultBranch ]);
                    } else {
                        console.log('This bm CMD needs the github remote uri')
                    }
            
                case '':
                    const data = await git.branch();
                    lg();
                    lg('Branches:');
                    data.all.forEach((branch, idx) => {
                    const item = data.branches[branch];
                    let value = '  ';
                    if (item.current) {
                        process.stdout.write(colors.FgGreen);
                        value = ' >';
                    }
                    if (!branch.includes('remotes/origin')) lg(value, idx + 1, branch);
                    })
            }
        } catch (err) { lg(err) }
    } else if (isGit && !isInit) {
        lg();
        lg(`Run ${colors.FgYellow}bm init ${colors.Reset} to use bm git commands.`)
    }
    process.stdout.write(colors.Reset);
}

const help = () => {
    const title = 'Branch Manager HELP'
    const chars = buildChar(title.length, '─')
    console.log(chars);
    console.log(title);
    console.log(chars);

    const helpList = {
        list: {
            description: `List all directories and shortcuts in current directory.`,
            args: ``},
        cd: {
            description: `Change directory by $shortcut.`,
            args: `$shortcut`},
        init: {
            description: `Initialize BM git repo.`,
            args: ``},
        settings: {
            description: `Display settings for BM git repo.`,
            args: ``},
        'new | n': {
            description: `Updates default branch, creates new $branchName off default.`,
            args: `$branchName`},
        '.': {
            description: `Add all files, make commit with $description`,
            args: `$description`},
        'update | u': {
            description: `Pulls default branch, merges default into current branch`,
            args: ``},
        'pushup': {
            description: `Set upstream remote branch`,
            args: ``},
        'delete | d': {
            description: `Deletes current branch.`,
            args: ``},
        'checkout | co': {
            description: `Checks out $branchName`,
            args: `$branchName`},
        'clear | c': {
            description: `Removes any uncommitted changes.`,
            args: ``},
        'log': {
            description: `List commits of current branch ($n changes items to display)`,
            args: `$n`},

    }

    Object.entries(helpList).forEach(([key, value]) => {
        const displayKey = chalk.hex('#0FF')(key);
        const displayDes = chalk.hex('#FFF')(value.description);
        lg(column([displayKey, displayDes], 20));
        if (value.args) {
            const displayArgs = chalk.hex('#AAF')(value.args);
            lg(column(['', displayArgs], 20));
        }
        lg('__________________________________________________________________________________')
    });
    


}


handleCmds();