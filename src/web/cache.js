import {
  GoogleAICacheManager,
  GoogleAIFileManager,
} from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
const cacheManager = new GoogleAICacheManager(process.env.API_KEY);
const fileManager = new GoogleAIFileManager(process.env.API_KEY);

const uploadResult = await fileManager.uploadFile(`${mediaPath}/a11.txt`, {
  mimeType: "text/plain",
});

const cacheResult = await cacheManager.create({
  model: "models/gemini-1.5-flash-001",
  contents: [
    {
      role: "user",
      parts: [
        {
          fileData: {
            fileUri: uploadResult.file.uri,
            mimeType: uploadResult.file.mimeType,
          },
        },
      ],
    },
  ],
});

console.log(cacheResult);

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModelFromCachedContent(cacheResult);
const result = await model.generateContent("Please summarize this transcript.");
console.log(result.response.text());
