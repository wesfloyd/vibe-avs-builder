import fs from 'fs/promises';
import path from 'path';

/**
 * Logs a given string content to a specified file path within a .debug directory,
 * only during development mode. Creates the directory if it doesn't exist.
 *
 * @param content The string content to log.
 * @param filename The name of the file to log to (e.g., 'system-prompt-log.txt').
 * @param callerInfo Optional string to identify the caller in log messages.
 */
export async function logContentForDebug(
  content: string,
  filename: string,
  callerInfo: string = 'Debug Log'
): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    try {
      const debugDir = path.join(process.cwd(), '.debug');
      const logFilePath = path.join(debugDir, filename);
      await fs.mkdir(debugDir, { recursive: true }); // Ensure directory exists
      await fs.writeFile(logFilePath, content, 'utf8');
      console.log(`[DEV ONLY - ${callerInfo}] Content logged to: ${logFilePath}`);
    } catch (logError) {
      console.error(`[DEV ONLY - ${callerInfo}] Failed to write debug log to ${filename}:`, logError);
    }
  }
} 