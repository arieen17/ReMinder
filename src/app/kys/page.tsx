"use client"; // This is a client component

import React, { useState, useEffect, ChangeEvent } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Send, X } from "lucide-react";

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
        "Welcome to ReMinder! I am Pixel the Parrot, upload a PDF to begin.",
    },
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isPassageVisible, setIsPassageVisible] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [instructionsModal, setInstructions] = useState<boolean>(true);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handlePdfChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const pdf = event.target.files[0];
      if (pdf.type === "application/pdf") {
        setPdfFile(pdf);
        setMessages([
          ...messages,
          { role: "user", content: "Uploaded PDF" },
          { role: "model", content: "PDF Received!" },
        ]);
      } else {
        alert("Only accept PDF type file.");
      }
    }
  };

  const handleReady = () => {
    setIsReady(true);
    setIsPassageVisible(false);
    const readyMessage = {
      role: "model",
      content: `Try your best to write a summary of the covered topics.`,
    };
    setMessages((prevMessages) => [...prevMessages, readyMessage]);
  };
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

  const handleCloseModal = () => {
    setInstructions(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">ReMinder Chat</h1>
      {/* instructions */}
      {instructionsModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg relative max-w-lg w-full mx-4">
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X />
            </button>
            <h2 className="text-center text-2xl font-bold mb-4">
              Welcome to ReMinder!
            </h2>
            <p className="mb-4">
              ReMinder is a tool designed to help you recall information
              effectively. Here's how it works:
            </p>
            <ol className="list-decimal pl-6 mb-4">
              <li>
                <b>Choose a PDF: </b> Upload a PDF of the notes or passage that
                you want to learn from.
              </li>
              <li>
                <b>Summarize:</b> ReMinder will then analyze the provided notes
                or passage and reiterrate a summarized version
              </li>
              <li>
                <b>Review and Recall:</b> You then can repeat key parts, where
                ReMinder will quiz you to test how much you remember!
              </li>
            </ol>
            <p className="text-pretty text-center">
              Let's start learning! Enter a topic to get started.
            </p>
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleCloseModal}
                className="bg-blue-500 text-white rounded p-2"
              >
                Start Learning!
              </button>
            </div>
          </div>
        </div>
      )}
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
      {!isPassageVisible && !isReady && (
        <div>
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
                <Send />
              </button>
            </div>
          </form>

          <input
            type="file"
            accept="application/pdf"
            onChange={handlePdfChange}
            className="mb-4"
          />
        </div>
      )}
      {/* topic passage */}
      {isPassageVisible && (
        <div className="border rounded p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">Passage</h2>
          <p>{passage}</p>
          <button
            className="bg-blue-800 text-white rounded p-2 mt-4"
            onClick={handleReady}
          >
            READY
          </button>
        </div>
      )}

      {/* Summary Input */}
      {!isPassageVisible && isReady && (
        <form onSubmit={handleSummarySubmit} className="mb-4">
          <textarea
            className="border rounded p-2 w-full mb-2"
            placeholder="Write your response here..."
            value={userSummary}
            onChange={(e) => setUserSummary(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSummarySubmit(e);
              }
            }}
          />
          <button type="submit" className="bg-blue-500 text-white rounded p-2">
            Submit Response
          </button>
        </form>
      )}
      {loading && <p>Loading...</p>}
    </div>
  );
}
