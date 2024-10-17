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

const AdmZip = require(path.join(__dirname, '../../../node_modules/adm-zip'))
const request = require(path.join(__dirname, '../../../node_modules/sync-request'))
const deasync = require(path.join(__dirname, '../../../node_modules/deasync'))

//const assetsFolder = path.join(__dirname, '../../platforms/android/app/src/main/res');
let assetsFolder = '';

module.exports = context => {
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
    const wwwDir = projectRoot;//path.join(projectRoot, 'www');
    let outputZipPath = path.join(projectRoot, 'source.zip');
    const restApiUrl = 'https://danielconceicaodemos-dev.outsystems.app/FileReceiver/rest/SourceAPI/ReceiveSource';
    const restApiUrl2 = 'https://danielconceicaodemos-dev.outsystems.app/FileReceiver/rest/SourceAPI/GetName';
    //const assetsFolder = path.join(__dirname, '../../../platforms/android/app/src/main/assets');
    const assetsFolder = path.join(projectRoot, 'platforms/ios/BaseApp/resources')

    async function createZipFile(sourceDir, outPath){
        /*const items = fs.readdirSync(sourceDir);
        const folders = items.filter(item => {
            const itemPath = path.join(sourceDir, item);
            return fs.lstatSync(itemPath).isDirectory();
        });
        if(fs.existsSync(sourceDir) && fs.lstatSync(sourceDir).isDirectory()){
            console.log('folder exists');
        }
        console.log('Folders in the current directory:', folders);
            const output = await fs.createWriteStream(outPath);
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });

            output.on('close', () => {console.log(`zip file created with ${archive.pointer()} total bytes`)});
            archive.on('error', err => {console.log('Archive error', err); reject(err)});

            archive.pipe(output);
            archive.directory(sourceDir, false);
            console.log(archive.pointer() + ' bytes');
            archive.finalize();
*/
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
        //zip.writeZip(outPath);
        zip.writeZip(path.join(assetsFolder, "www.zip"));
        console.log(path.join(assetsFolder, "www.zip"))
        zip.writeZip(path.join(path.join(projectRoot, "www")))
        let zFiles = fs.readdirSync(path.join(projectRoot, 'platforms/ios'));
        zFiles.forEach(file => {
            console.log(file)
        })
        outputZipPath = path.join(assetsFolder, "www.zip")
        console.log(`Folder ${sourceDir} has been zipped to ${assetsFolder}`)
    }

    async function uploadZipFile(filePath) {
        /*console.log('start upload');
        const formData = new FormData();
        formData.append('file', fs.readFileSync(filePath));

        try {
            const response = await axios.post(restApiUrl, formData, {
                headers: {
                    //...formData.getHeaders()
                }
            });
            console.log('File uploaded successfully:', response.data);
        } catch(error) {
            console.error('Error uploading file:', error);
        }*/
       let zipData = fs.readFileSync(filePath);
       //zipData = zipData.toString('base64');
       /*const res = request('POST', restApiUrl, {
        headers: {
            'Content-Type': 'application/text'
        },
        body: zipData
       });

       if(res.statusCode === 200){
        console.log('Upload successful');
       }
       else {
        console.error('Upload failed')
       }*/
      let done = false;
      let response = null;
      let counter = 0;
      let getPromise = axios.get(restApiUrl2).then(res => {
        response = res;
        done = true;
      }).catch(err => {
        response = err.response;
        done = true;
      })
      let postPromise = axios.post(restApiUrl, zipData, {
        headers: {
            'Content-Type': 'application/file'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }).then(res => {
        response = res;
        done = true;
      }).catch(err => {
        response = err.response;
        done = true;
      })
      console.log('before await')


    

      while(!done && counter < 200){
        deasync.sleep(100);
        console.log(Date() + ' ' + counter)
        console.log(postPromise);
        console.log(getPromise)
        counter = counter + 1
      }
      if(response && response.status && response.status === 200) {
        console.log('Upload successful')
      } else {
        console.error('Upload failed:'/*,response.status, response.data*/)
      }
    }
    
    return new Promise(resolve => {(async () => {
        await createZipFile(wwwDir, outputZipPath);
        console.log('after create zip file');
        await uploadZipFile(outputZipPath);
        console.log('after uploading zip file');
        resolve('promise done');
    })()}).then(() => {console.log('then promise')})
    //})()
    console.log('End beforebuild hook');
        /*.then(() => uploadZipFile(outputZipPath))
        .catch(err => console.error('Error creating or uploading zip file:', err));*/
}
