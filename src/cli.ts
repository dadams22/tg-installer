import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import downloadAndUnzip from './download.js';

export default async function cli() {
    const cwd = process.cwd();

    const electronPath = path.join(cwd, 'node_modules/Testgram.app');
    const cliInstalled = fs.existsSync(electronPath);

    if (!cliInstalled) {
        await downloadAndUnzip(cwd);
    }

    const executablePath = path.join(electronPath, 'Contents/MacOS/Testgram')
    const cliArgs = process.argv.slice(2, process.argv.length);
    const child = exec(`${executablePath} ${cliArgs.join(' ')}`);

    child.stdout.on('data', (data) => console.log(data.toString()));
    child.stderr.on('data', (data) => console.error(data.toString()));

    return new Promise((resolve, reject) => {
        child.on('error', (err) => {
            console.error(`Error: ${err.message}`);
            reject(err);
        });
        child.on('close', (code) => {
            console.log(`child process exited with code ${code}`)
            resolve(code);
        });
    })
}