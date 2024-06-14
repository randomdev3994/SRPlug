const fs = require('fs');
const path = require('path');

console.log('test2')
/*
const archiver = require(path.join(__dirname, '../../../node_modules/archiver'));
const axios = require(path.join(__dirname, '../../../node_modules/axios'));
const FormData = require(path.join(__dirname, '../../../node_modules/form-data'));*/
//import archiver from '../../../node_modules/archiver';
const archiver = require(path.join(__dirname, '../../../node_modules/archiver'));
//import axios from '../../../node_modules/axios';
const axios = require(path.join(__dirname, '../../../node_modules/axios/dist/browser/axios.cjs'));
//import FormData from '../../../node_modules/form-data';
const FormData = require(path.join(__dirname, '../../../node_modules/form-data'));


module.exports = function(context) {
    /*const currentDir = path.join(__dirname, '../../..');
    const items = fs.readdirSync(currentDir);
    const folders = items.filter(item => {
        const itemPath = path.join(currentDir, item);
        return fs.lstatSync(itemPath).isDirectory();
    });
    console.log('Folders in the current directory:', folders);
    const folderName = 'node_modules';
    const folderPath = path.join(currentDir, folderName);
    if(fs.existsSync(folderPath) && fs.lstatSync(folderPath).isDirectory()){
        console.log('folder exists');
    }
    else {
        console.log('folder doesnt exist');
    }*/
    const projectRoot = context.opts.projectRoot;
    const wwwDir = path.join(projectRoot, 'www');
    const outputZipPath = path.join(projectRoot, 'www.zip');
    const restApiUrl = 'https://danielconceicaodemos-dev.outsystems.app/FileReceiver/rest/SourceAPI/ReceiveSource';

    function createZipFile(sourceDir, outPath){
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(outPath);
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });

            output.on('close', () => resolve());
            archive.on('error', err => reject(err));

            archive.pipe(output);
            archive.directory(sourceDir, false);
            console.log(archive.pointer() + ' bytes');
            archive.finalize();
        });
    }

    async function uploadZipFile(filePath) {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));

        try {
            const response = await axios.post(restApiUrl, formData, {
                headers: {
                    //...formData.getHeaders()
                }
            });
            console.log('File uploaded successfully:', response.data);
        } catch(error) {
            console.error('Error uploading file:', error);
        }
    }

    createZipFile(wwwDir, outputZipPath)
        .then(() => uploadZipFile(outputZipPath))
        .catch(err => console.error('Error creating or uploading zip file:', err));
}
