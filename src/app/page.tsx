"use client";
import { Send } from "lucide-react";

import React, { useState, useEffect, FormEvent } from "react";
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

// async function run() {
//   const chatSession = model.startChat({
//     generationConfig,
//     history: [],
//   });

//   const result = await chatSession.sendMessage("INSERT_INPUT_HERE");
//   console.log(result.response.text());
// }

// run();

type ChatMessage = {
  role: "user" | "model";
  content: string;
};

export default function Home() {
  const [topic, setTopic] = useState<string>("");
  const [confirmedTopic, setConfirmedTopic] = useState<string>("");
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
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isTopicConfirmed, setIsTopicConfirmed] = useState<boolean>(false);
  const [userConfirmed, setUserConfirmed] = useState<boolean>(false);

  const handleTopicSubmit = async (e: React.FormEvent) => {
    const chat = model.startChat({
      history: [],
      generationConfig,
    });

    e.preventDefault();
    if (!topic) {
      return;
    }
    setLoading(true);
    setMessages([...messages, { role: "user", content: `${topic}` }]);

    try {
      const result = await model.generateContent(
        `ask if they want to confirm ${topic} or want to dive into more specific topics`
      );
      const response = result.response.text();
      setMessages([
        ...messages,
        { role: "user", content: `${topic}` },
        { role: "model", content: `${response}` },
      ]);
      setUserConfirmed(true);
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
  const handleTopicConfirm = async (confirm: boolean) => {
    setLoading(true);
    if (confirm) {
      setConfirmedTopic(topic);
      setIsTopicConfirmed(true);
      setMessages([...messages, { role: "user", content: `Confirmed Topic!` }]);

      try {
        const result = await model.generateContent(
          `Generate a short passage about ${topic}.`
        );
        const newPassage = result.response.text();
        setPassage(newPassage);
        setMessages([
          ...messages,
          { role: "user", content: `Confirmed Topic!` },
          {
            role: "model",
            content: `Here is the passage about your topic:\n\n Read the passage and when prepared, select READY.`,
          },
        ]);
        setIsPassageVisible(true);
      } catch (error) {
        console.error("Error generating passage:", error);
        setMessages([
          ...messages,
          { role: "user", content: `${confirmedTopic}` },
          {
            role: "model",
            content: "Sorry, there was an error generating the passage.",
          },
        ]);
      }
    }

    setLoading(false);
  };

  const handleReady = () => {
    setIsReady(true);
    setIsPassageVisible(false);
    setMessages([
      ...messages,
      {
        role: "model",
        content: `Try your best to write a summary of the covered topics.`,
      },
    ]);
  };
  const handleSummarySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userSummary) {
      return;
    }
    setLoading(true);
    setMessages([...messages, { role: "user", content: userSummary }]);
    setUserSummary("");
    try {
      const result = await model.generateContent(
        `Original Passage:\n${passage}\n\nUser Summary:\n${userSummary}\n\nAnalyze the user's summary. Identify key information
         that is missing or inaccurate compared to the original passage. Then, formulate a question that is designed to trigger
         the user to recall the missing information. Make the conversation smooth. If the user states that they cannot remember, 
         provide them with the answer. If the user repeats most of the passage correctly, praise the user.`
      );
      const response = result.response.text();
      setMessages([
        ...messages,
        { role: "user", content: userSummary },
        { role: "model", content: response },
      ]);
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
    const chatContainer = document.getElementById("chat-container");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <div className=" bg-white mx-auto p-4 h-screen w-8/12">
      <div className="text-2xl font-bold mb-4 justify-center flex">
        ReMinder
      </div>
      <div
        id="chat-container"
        className="h-5/6 border rounded p-4 overflow-y-auto mb-4"
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

      {/* to enter topic */}
      {!isPassageVisible && !isReady && !isTopicConfirmed && (
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
      )}
      {/* confirm the topic u want */}
      {userConfirmed && !isTopicConfirmed && (
        <div className="flex">
          <button
            className="bg-green-500 text-white rounded p-2"
            onClick={() => handleTopicConfirm(true)}
          >
            Confirm Topic
          </button>
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

      {/* summary + answer question input */}
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
