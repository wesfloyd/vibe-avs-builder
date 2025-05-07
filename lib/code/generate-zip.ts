import express from 'express';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import bodyParser from 'body-parser';
import { PassThrough, Readable } from 'stream';
import { put } from '@vercel/blob';

type CodeFile = {
    path: string;
    content: string;
  };

// Define a type for the response if not already available
type BlobResponse = {
    url: string;
};

export async function generateZipFromJSON(jsonInput: string): Promise<string> {
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

    // Create the zip archive and collect output in a buffer
    const archive = archiver('zip');
    const chunks: Buffer[] = [];

    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('error', (err) => { throw err; });

    files.forEach(file => {
        archive.append(file.content, { name: file.path });
    });

    await archive.finalize();

    const buffer = Buffer.concat(chunks);

    // Upload to Vercel Blob Storage
    const response: BlobResponse = await put(
        `projectCodeZipArchives/${Date.now()}.zip`,
        buffer,
        {
            access: 'public',
            contentType: 'application/zip',
        }
    );
    return response.url;
}
