import express from 'express';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import bodyParser from 'body-parser';

type CodeFile = {
    filename: string;
    content: string;
  };

  
async function createZipFromFiles(fileArray: CodeFile[], zipFilePath: string): Promise<string> {
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip');
  
    return new Promise((resolve, reject) => {
      archive.pipe(output);
  
      fileArray.forEach(file => {
        const fullPath = path.join('temp', file.filename);
        const dir = path.dirname(fullPath);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(fullPath, file.content, 'utf8');
        archive.file(fullPath, { name: file.filename });
      });
  
      archive.finalize();
  
      output.on('close', () => resolve(zipFilePath));
      archive.on('error', (err: Error) => reject(err));
    });
  }

export function generateZipFromJSON(jsonInput: string) {
    
  const files = JSON.parse(jsonInput);
  const zipPath = path.join(__dirname, 'temp', 'project.zip');
  createZipFromFiles(files, zipPath);
  //todo: return something

 
};
