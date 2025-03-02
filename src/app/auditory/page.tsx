"use client";
import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect, ChangeEvent, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Send, X } from "lucide-react";
import pixel from "@/app/pixel.png";

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
  const [userSummary, setUserSummary] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      content:
        "Welcome to ReMinder! I am Pixel the Parrot, upload a .txt file to begin.",
    },
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [instructionsModal, setInstructions] = useState<boolean>(true);
  const [fileContent, setFileContent] = useState<string>("");
  const [passage, setPassage] = useState<string>("");
  const [isPassageVisible, setIsPassageVisible] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);

  const [speed, setSpeed] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [lastSpokenText, setLastSpokenText] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const yap = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speed;
      utterance.volume = volume;
      utteranceRef.current = utterance;

      utterance.onstart = () => {
        setIsPlaying(true);
      };
      utterance.onend = () => {
        setIsPlaying(false);
      };

      speechSynthesis.speak(utterance);
      setLastSpokenText(text);
    } else {
      console.error("Speech synthesis not supported!!");
    }
  };

  const repeat = () => {
    if (lastSpokenText) {
      yap(lastSpokenText);
    }
  };

  const stop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const shouldSpeak = useRef(false);
  const hasInitialMessageSpoken = useRef(false);
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "model") {
      if (
        shouldSpeak.current &&
        lastMessage.content !==
          "Welcome to ReMinder! I am Pixel the Parrot, upload a .txt file to begin."
      ) {
        yap(lastMessage.content);
      }
    }

    shouldSpeak.current = true;
  }, [messages]);

  const handleReady = async () => {
    setIsReady(true);
    setIsPassageVisible(false);

    try {
      const result = await chat.sendMessage(
        `Generate 3 questions based on the following passage:\n\n${passage}`
      );
      const questionList = result.response.text();
      const questionsArray = questionList
        .split("\n")
        .filter((line) => line.trim().length > 0);
      setQuestions(questionsArray);

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "model",
          content: `Okay, here is your first question:\n\n${questionsArray[0]}`,
        },
      ]);
    } catch (error) {
      console.error("Error generating questions:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "model",
          content: "Sorry, I couldn't generate the questions.",
        },
      ]);
    }
  };
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      if (file.type === "text/plain") {
        setLoading(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
          try {
            const content = e.target?.result as string;
            setFileContent(content);

            const passageResult = await model.generateContent([
              "Generate a passage from the given document: do not ask any questions, only a summary with 3 sentences (80-90 words)\n\n",
              { text: content },
            ]);

            const newPassage = passageResult.response.text();
            setPassage(newPassage);
            setMessages([
              ...messages,
              { role: "user", content: "Uploaded text file" },
              {
                role: "model",
                content: `File received! Here is a passage based off your file`,
              },
            ]);
            setIsPassageVisible(true);
          } catch (error) {
            console.error("Error processing file:", error);
            setMessages([
              ...messages,
              { role: "user", content: "Uploaded file" },
              {
                role: "model",
                content: "Sorry, there was an error processing your file.",
              },
            ]);
          } finally {
            setLoading(false);
          }
        };

        reader.onerror = () => {
          setLoading(false);
          alert("Error reading file");
        };

        reader.readAsText(file);
      } else {
        alert("Please upload a text file (.txt)");
      }
    }
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

      setMessages([
        ...messages,
        { role: "user", content: `${topic}` },
        {
          role: "model",
          content: `Here is the passage about ${topic}:\n\n ${newPassage}\n\n Read and then, summarize.`,
        },
      ]);
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

    try {
      const userSummaryMessage = { role: "user", content: userSummary };
      setUserAnswers([...userAnswers, userSummary]);
      setUserSummary("");

      const result = await chat.sendMessage(userSummary);
      setMessages((prevMessages) => [...prevMessages, userSummaryMessage]);

      if (currentQuestionIndex < questions.length - 1) {
        const nextQuestionIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextQuestionIndex);
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "model",
            content: `Here is your next question:\n\n${questions[nextQuestionIndex]}`,
          },
        ]);
      } else {
        const evaluationResult = await chat.sendMessage(
          `Evaluate the user's answers to the following questions based on the provided passage:\n\n
              Passage: ${passage}\n\n
              Questions:\n${questions.join("\n")}\n\n
              User Answers:\n${userAnswers.join("\n")}\n\n
              Provide feedback on the correctness of each answer and suggest improvements. Provide in a paragraph`
        );

        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "model",
            content: `You have answered all the questions!\n\nHere is a general evaluation of your answers:\n\n${evaluationResult.response.text()}`,
          },
        ]);
      }
    } catch (error) {
      console.error("Error generating feedback:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "user", content: userSummary },
        {
          role: "model",
          content: "Sorry, there was an error processing your summary.",
        },
      ]);
      setUserSummary("");
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
    <div className="container mx-auto p-4 bg-white">
      <div className=" flex justify-center">
        <Link href="/">
          <Image src={pixel} alt="pixel the parrot" className="w-48 h-34" />
        </Link>
      </div>
      <Link href="/">
        <div className="text-center text-2xl font-bold mb-4 cursor-pointer">
          ReMinder
        </div>
      </Link>
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
            <ol className="text-pretty list-decimal pl-6 mb-4">
              <li>
                <b>Upload text: </b> Upload a text file with content you want to
                learn.
              </li>
              <li>
                <b>Audio Passage:</b> ReMinder will analyze the content and
                create a passage from it.
              </li>
              <li>
                <b>Review and Recall:</b> You will click ready, where ReMinder
                will verbally quiz you to test how much you remember!
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
            <div
              className={`flex items-center ${
                msg.role === "user" ? "justify-end" : ""
              }`}
            >
              <Image
                src={pixel}
                alt="pixel the parrot"
                className={`w-24 h-18 ${msg.role === "user" ? "hidden" : ""}`}
              />
              <span
                className={`inline-block p-2 rounded-lg ${
                  msg.role === "user" ? "bg-green-300" : "bg-gray-200"
                }`}
              >
                {msg.content}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center">
          <label htmlFor="rate" className="mr-2">
            Speed: 0.5x
          </label>
          <input
            type="range"
            id="rate"
            min="0.5"
            max="2"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
          <label htmlFor="rate" className="m-2">
            2.0x
          </label>
        </div>

        <div className="flex items-center">
          <label htmlFor="volume" className="mr-2">
            Volume:
          </label>
          <input
            type="range"
            id="volume"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </div>
        <button
          onClick={repeat}
          className="bg-green-500 text-white rounded p-2"
        >
          Repeat
        </button>
        <button onClick={stop} className="bg-red-500 text-white rounded p-2">
          Stop
        </button>
      </div>

      {/* Topic Input and File Upload */}
      {!isPassageVisible && !isReady && messages.length == 1 && (
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

          <div className="flex flex-col mb-4">
            <p className="mb-2">Upload a text file (.txt):</p>
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="mb-2"
            />
          </div>
        </div>
      )}
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
          {isPassageVisible &&
            typeof window !== "undefined" &&
            "speechSynthesis" in window && (
              <div className="mt-4">
                <button
                  onClick={() => yap(passage)}
                  className="bg-blue-500 text-white rounded p-2"
                >
                  Read Passage Aloud
                </button>
              </div>
            )}
        </div>
      )}

      {/* Summary Input */}
      {!isPassageVisible &&
        isReady &&
        currentQuestionIndex < questions.length && (
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
            <button
              type="submit"
              className="bg-blue-500 text-white rounded p-2"
            >
              Submit Response
            </button>
          </form>
        )}
      {loading && <p>Loading...</p>}
    </div>
  );
}
