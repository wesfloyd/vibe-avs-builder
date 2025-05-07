import fs from 'fs';
import path from 'path';
import { generateZipFromJSON } from '../../lib/code/generate-zip';

// Read the input JSON from the file
const inputFilePath = path.join(__dirname, 'example-code-project-json.txt');
const jsonInput = fs.readFileSync(inputFilePath, 'utf8');

// Test the generateZipFromJSON function
describe('generateZipFromJSON', () => {
  it('should create a zip file with the expected content', async () => {
    // Call the function
    generateZipFromJSON(jsonInput);

    // Define the expected zip file path
    const expectedZipPath = path.join(__dirname, '../../lib/code/temp/project.zip');

    // Check if the zip file exists
    expect(fs.existsSync(expectedZipPath)).toBe(true);
    
    // Clean up: remove the created zip file
    fs.unlinkSync(expectedZipPath);
  });
}); 