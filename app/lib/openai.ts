// OpenAI integration is currently disabled.
// Transcription requires local audio files, which are no longer available
// since downloads are now served via Cobalt API URLs.

export async function transcribeAudio(_audioPath: string): Promise<string> {
  throw new Error("Transcription service is not available.");
}
