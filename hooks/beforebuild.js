const fs = require('fs');
const path = require('path');
const archiver = require(path.join(__dirname, '../node_modules/archiver'));
const axios = require(path.join(__dirname, '../node_modules/axios'));
const FormData = require(path.join(__dirname, '../node_modules/form-data'));

module.exports = function(context) {
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
            archive.finalize();
        });
    }

    async function uploadZipFile(filePath) {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));

        try {
            const response = await axios.post(restApiUrl, formData, {
                headers: {
                    ...formData.getHeaders()
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