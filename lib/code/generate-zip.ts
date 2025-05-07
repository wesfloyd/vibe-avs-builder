import express from 'express';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import bodyParser from 'body-parser';

type CodeFile = {
    path: string;
    content: string;
  };

export function generateZipFromJSON(jsonInput: string): Promise<string> {
    let files: CodeFile[];

    try {
        files = JSON.parse(jsonInput);
    } catch (error) {
        throw new Error("Invalid JSON format: Unable to parse input.");
    }

    if (!Array.isArray(files)) {
        throw new Error("Invalid input: Expected an array of files.");
    }

    files.forEach((file, index) => {
        if (!file.path || typeof file.path !== 'string') {
            throw new Error(`Invalid input at index ${index}: Each file must have a valid 'path' property.`);
        }
        if (!file.content || typeof file.content !== 'string') {
            throw new Error(`Invalid input at index ${index}: Each file must have a valid 'content' property.`);
        }
    });

    const zipPath = path.join(__dirname, 'temp', 'project.zip').toString();
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip');

    return new Promise((resolve, reject) => {
        archive.pipe(output);

        files.forEach(file => {
            const fullPath = path.join('temp', file.path);
            const dir = path.dirname(fullPath);
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(fullPath, file.content, 'utf8');
            archive.file(fullPath, { name: file.path });
        });

        archive.finalize();

        output.on('close', () => resolve(zipPath));
        archive.on('error', (err: Error) => reject(err));
    });
}
