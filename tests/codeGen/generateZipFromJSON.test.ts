import fs from 'fs';
import path from 'path';
import { generateZipFromJSON } from '../../lib/code/generate-zip';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Read the input JSON from the file
const inputFilePath1 = path.join(__dirname, 'example-code-project-json.txt');
const jsonInput1 = fs.readFileSync(inputFilePath1, 'utf8');

const inputFilePath2 = path.join(__dirname, 'valid-code-project.json');
const jsonInput2 = fs.readFileSync(inputFilePath2, 'utf8');

// Test the generateZipFromJSON function
describe('generateZipFromJSON1', () => {
  it('should create a zip file with the expected content', async () => {
    // Call the function
    const url = await generateZipFromJSON(jsonInput1);

    console.log(url);

    // Check if the zip file exists
    expect(url).toBeDefined();

    const response = await fetch(url);
    expect(response.status).toBe(200);
  });
}); 

describe('generateZipFromJSON2', () => {
  it('should create a zip file with the expected content', async () => {
    // Call the function
    const url = await generateZipFromJSON(jsonInput2);

    console.log(url);

    // Check if the zip file exists
    expect(url).toBeDefined();
    
  });
});
