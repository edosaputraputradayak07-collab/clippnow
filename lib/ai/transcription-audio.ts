export function buildTranscriptionAudioArgs(inputPath: string, outputPath: string): string[] {
  if (!inputPath || !outputPath) throw new Error('Invalid transcription audio paths');
  return ['-hide_banner','-loglevel','error','-i',inputPath,'-vn','-ac','1','-ar','16000','-c:a','libmp3lame','-b:a','32k','-y',outputPath];
}
