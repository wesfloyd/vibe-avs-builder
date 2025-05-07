import fs from 'fs';
import path from 'path';
import { generateZipFromJSON } from '../../lib/code/generate-zip';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Read the input JSON from the file
const inputFilePath = path.join(__dirname, 'example-code-project-json.txt');
const jsonInput = fs.readFileSync(inputFilePath, 'utf8');

// Test the generateZipFromJSON function
describe('generateZipFromJSON', () => {
  it('should create a zip file with the expected content', async () => {
    // Call the function
    const url = await generateZipFromJSON(jsonInput);

    console.log(url);

    // Check if the zip file exists
    expect(url).toBeDefined();

    const response = await fetch(url);
    expect(response.status).toBe(200);
  });
}); 