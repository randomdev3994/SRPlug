const fs = require('fs');
const path = require('path');

console.log('test2')

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

    const projectRoot = context.opts.projectRoot;
    const wwwDir = projectRoot;//path.join(projectRoot, 'www');
    let outputZipPath = path.join(projectRoot, 'source.zip');

    //const assetsFolder = path.join(__dirname, '../../../platforms/android/app/src/main/assets');
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
        //zip.writeZip(outPath);
        zip.writeZip(path.join(assetsFolder, "www.zip"));
        console.log(path.join(assetsFolder, "www.zip"))
        let zFiles = fs.readdirSync(path.join(projectRoot, 'platforms/ios/BaseApp'));
        zFiles.forEach(file => {
            console.log(file)
        })
        zFiles = fs.readdirSync(assetsFolder);
        zFiles.forEach(file => {
            console.log(file)
        })
        outputZipPath = path.join(assetsFolder, "www.zip")
        console.log(`Folder ${sourceDir} has been zipped to ${assetsFolder}`)
    }
    
    return new Promise(resolve => {(async () => {
        await createZipFile(wwwDir, outputZipPath);
        console.log('after create zip file');
        //await uploadZipFile(outputZipPath);
        console.log('after uploading zip file');
        resolve('promise done');
    })()}).then(() => {console.log('then promise')})

}
