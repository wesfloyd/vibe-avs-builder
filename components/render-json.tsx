import React, { useState, useEffect } from 'react';

interface RenderJsonProps {
  jsonString: string;
}

export const RenderJson: React.FC<RenderJsonProps> = ({ jsonString }) => {
  const [accumulatedText, setAccumulatedText] = useState('');
  const [json, setJson] = useState<any>(null);

  useEffect(() => {
    // Accumulate text only when jsonString changes
    setAccumulatedText((prev) => prev + jsonString);
  }, [jsonString]);

  useEffect(() => {
    try {
      const parsedJson = JSON.parse(accumulatedText);
      setJson(parsedJson);
    } catch (e) {
      // If parsing fails, it might be because the JSON is incomplete
    }
  }, [accumulatedText]); // Only run this effect when accumulatedText changes

  // Extract paths from files array if it exists
  const paths = json?.files ? json.files.map((file: { path: string }) => file.path) : [];

  return (
    <div>
      <pre>{JSON.stringify(json, null, 2)}</pre>
      {paths.length > 0 && (
        <div>
          <h3>File Paths:</h3>
          <ul>
            {paths.map((path: string, index: number) => (
              <li key={index}>{path}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 