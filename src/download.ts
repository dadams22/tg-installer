import fs from 'fs';
import path from 'path';
import axios from 'axios';
import Seven from 'node-7z';
import sevenBin from '7zip-bin';
import { execSync } from 'child_process';

const BASE_URL = 'https://api.github.com/repos/dadams22/tg-cli/releases';
const DOWNLOAD_DIR = 'node_modules';

async function getReleases() {
    return await axios.get(BASE_URL, { responseType: 'json', }).then(response => response.data);
}

async function getLatestRelease() {
    const releases = await getReleases();
    const assets = releases[0].assets;
    return assets.find(asset => asset.name.includes('-mac.7z'));
}

async function downloadZip(downloadUrl, downloadVersion, destinationPath) {
    const file = fs.createWriteStream(destinationPath);

    console.log(`Downloading ${downloadVersion} from ${downloadUrl}`);

    const response = await axios.get(
        downloadUrl,
        {
            headers: { 'User-Agent': 'tg-installer', 'Accept': 'application/octet-stream', },
            responseType: 'stream',
        });

    // @ts-ignore
    response.data.pipe(file);

    return new Promise((resolve, reject) => {
        file.on('finish', (val) => {
            file.close();
            console.log('Download complete');
            resolve(val);
        });
        file.on('error', (err) => {
            fs.unlink(destinationPath, () => {});
            console.log('An error occurred while downloading the Testgram CLI');
            reject(err);
        });
    })
}

async function unzipAndInstall(zipPath, destinationPath) {
    const unzipTask = Seven.extractFull(zipPath, destinationPath, { $bin: sevenBin.path7za, $progress: true });

    console.log(`Unzipping ${zipPath}`);

    return new Promise((resolve, reject) => {
        unzipTask.on('end', (val) => {
            fs.unlinkSync(zipPath); // Delete zip file once install completed

            const executablePath = path.join(destinationPath, 'Testgram.app/Contents/MacOS/Testgram');
            execSync(`chmod +x ${executablePath}`); // Make sure we are able to execute the app

            resolve(val);
        })
        unzipTask.on('progress', (progress) => {});
        unzipTask.on('error', (err) => {
            console.log(err.message);
            console.log('An error occurred while unzipping the Testgram application');
            reject(err);
        })
    })
}

export default async function downloadAndUnzip(cwd) {
    const latestRelease = await getLatestRelease();
    const downloadDir = path.join(cwd, DOWNLOAD_DIR);
    const zipDownloadPath = path.join(downloadDir, 'testgram.7z');

    await downloadZip(latestRelease.url, latestRelease.name, zipDownloadPath);
    await unzipAndInstall(zipDownloadPath, downloadDir);

    console.log('Testgram CLI successfully installed');
}