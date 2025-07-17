import fs from 'fs-extra';
import path from 'path';

const foldersToCopy = ['assets', 'images', 'model', 'src'];
const filesToCopy = ['manifest.json'];
const excludedFiles = ['service_worker.js', 'index.js'];

const distDir = './dist';

filesToCopy.forEach(folder => {
    const srcPath = path.join('./', folder);
    const destPath = path.join(distDir, folder);
    fs.copyFileSync(srcPath, destPath)
});

foldersToCopy.forEach(folder => {
    const srcPath = path.join('./', folder);
    const destPath = path.join(distDir, folder);

    fs.mkdirSync(destPath, { recursive: true });
    fs.copySync(srcPath, destPath, {
        filter: (src, dest) => {
            const fileName = path.basename(src);
            const fileExtension = path.extname(src);

            if (excludedFiles.includes(fileName)) {
                console.log(`Excluding file: ${fileName}`);
                return false;
            }


            if (fs.lstatSync(src).isDirectory()) {
                return true;
            }

            return true;
        }
    })
});


