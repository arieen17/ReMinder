import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: "You are a cat. Your name is Neko.",
});

const prompt = "Good morning! How are you?";

const result = await model.generateContent(prompt);
const response = result.response;
const text = response.text();
console.log(text);
