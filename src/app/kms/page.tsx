"use client"; // This is a client component

import React, { useState, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_API_KEY || "");
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction:
    "You are a nice and encouraging teacher for learning students one on one and help by helping students recall from a passage through further questions. You do not directly state you are talking to a user or state that you are asking questions.",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const chat = model.startChat({
  history: [],
  generationConfig,
});

type ChatMessage = {
  role: "user" | "model";
  content: string;
};

export default function Home() {
  const [topic, setTopic] = useState<string>("");
  const [passage, setPassage] = useState<string>("");
  const [userSummary, setUserSummary] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      content:
        "Welcome to ReMinder! I am Pixel the Parrot, choose a topic you'd like to learn about.",
    },
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isPassageVisible, setIsPassageVisible] = useState<boolean>(false);

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) {
      return;
    }

    setLoading(true);
    setMessages([...messages, { role: "user", content: `${topic}` }]);

    try {
      const result = await chat.sendMessage(
        `Generate a short passage about ${topic}.`
      );
      const newPassage = result.response.text();

      setPassage(newPassage);
      setMessages([
        ...messages,
        { role: "user", content: `${topic}` },
        {
          role: "model",
          content: `Here is the passage about ${topic}:\n\n ${newPassage}\n\n Read and then, summarize.`,
        },
      ]);

      setIsPassageVisible(true);
    } catch (error) {
      console.error("Error generating passage:", error);
      setMessages([
        ...messages,
        { role: "user", content: `${topic}` },
        {
          role: "model",
          content: "Sorry, there was an error generating the passage.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userSummary) {
      return;
    }
    setLoading(true);
    // setMessages([...messages, { role: "user", content: userSummary }]);
    // const result = await chat.sendMessage(userSummary);
    // const response = result.response.text();

    setUserSummary("");
    try {
      const userSummaryMessage = { role: "user", content: userSummary };
      const summaryResult = await chat.sendMessage(userSummary); // Send user summary to update chat history
      const summaryResponse = summaryResult.response.text();

      setMessages((prevMessages) => [
        ...prevMessages,
        userSummaryMessage,
        { role: "model", content: summaryResponse },
      ]);

      const result = await chat.sendMessage(
        `Original Passage:\n${passage}\n\nUser Summary:\n${userSummary}\n\nAnalyze the user's summary. Identify key information
         that is missing or inaccurate compared to the original passage. Then, formulate a question that is designed to trigger
         the user to recall the missing information. Make the conversation smooth. If the user states that they cannot remember, 
         provide them with the answer. The interaction should end when the user repeats most of the information in \n${passage}\n`
      );
      //   const storeHistory = await chat.sendMessage(result.response.text());
      const response = result.response.text();
    } catch (error) {
      console.error("Error generating feedback:", error);
      setMessages([
        ...messages,
        { role: "user", content: userSummary },
        {
          role: "model",
          content: "Sorry, there was an error processing your summary.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Scroll to the bottom of the chat on new messages
    const chatContainer = document.getElementById("chat-container");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">ReMinder Chat</h1>
      <div
        id="chat-container"
        className="border rounded p-4 h-96 overflow-y-auto mb-4"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 ${
              msg.role === "user" ? "text-right" : "text-left"
            }`}
          >
            <span
              className={`inline-block p-2 rounded-lg ${
                msg.role === "user" ? "bg-green-300" : "bg-gray-200"
              }`}
            >
              {msg.content}
            </span>
          </div>
        ))}
      </div>

      {/* Topic Input */}
      {!isPassageVisible && (
        <form onSubmit={handleTopicSubmit} className="mb-4">
          <div className="flex">
            <input
              type="text"
              className="border rounded p-2 flex-grow mr-2"
              placeholder="Enter a topic..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-500 text-white rounded p-2"
            >
              Go
            </button>
          </div>
        </form>
      )}
      {/* Passage */}
      {isPassageVisible && (
        <div className="border rounded p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">Passage</h2>
          <p>{passage}</p>
        </div>
      )}

      {/* Summary Input */}
      {isPassageVisible && (
        <form onSubmit={handleSummarySubmit} className="mb-4">
          <textarea
            className="border rounded p-2 w-full mb-2"
            placeholder="Write your summary here..."
            value={userSummary}
            onChange={(e) => setUserSummary(e.target.value)}
          />
          <button type="submit" className="bg-blue-500 text-white rounded p-2">
            Submit Summary
          </button>
        </form>
      )}
      {loading && <p>Loading...</p>}
    </div>
  );
}
