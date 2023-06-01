import fs from "fs"; // node:fs
import { Readable } from "stream"; // node:stream
import ffmpeg from "fluent-ffmpeg";
import mic from "mic";
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import { Configuration, OpenAIApi } from "openai";
import dotenv from "dotenv";

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPEN_API_SECRET_KEY,
});
const openai = new OpenAIApi(configuration);
ffmpeg.setFfmpegPath(ffmpegPath);

// call recordAudio and transcribeAudio
async function main() {
  const audioFilename = "recorded_audio.wav";
  try {
    await recordAudio(audioFilename);
    const transcription = await transcribeAudio(audioFilename);
    console.log("Transcription:", transcription);
  } catch (error) {
    console.log(error);
  }
}

// Record audio
function recordAudio(filename) {
  return new Promise((resolve, reject) => {
    const micInstance = mic({
      rate: "16000",
      channels: "1",
      fileType: "wav",
    });
    // get audio stream
    const micInputStream = micInstance.getAudioStream();
    // create writeable stream
    const output = fs.createWriteStream(filename);
    // wrap audio stream in readable stream
    const writable = new Readable().wrap(micInputStream);
    // connect mic input stream to output file
    writable.pipe(output);
    // start recording
    micInstance.start();
    console.log("Recording... Press Ctrl+C to stop.");

    process.on("SIGINT", () => {
      // in this case: SIGINT triggered by Ctrl+C
      micInstance.stop();
      console.log("Finished recording");
      resolve();
    });

    micInputStream.on("error", (err) => {
      reject(err);
    });
  });
}

// Transcribe audio
async function transcribeAudio(filename) {
  const transcript = await openai.createTranscription(
    fs.createReadStream(filename),
    "whisper-1"
  );
  return transcript.data.text;
}

main();
