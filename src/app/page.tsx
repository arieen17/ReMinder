"use client";
import Link from "next/link";
import React from "react";

export default function Main() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-300">
      <h1 className="text-4xl font-bold mb-8">Welcome to ReMinder</h1>
      <div className="flex space-x-8">
        <Link href="/kys">
          <div className="text-white group relative w-64 h-64 bg-blue-500 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 hover:bg-blue-600 cursor-pointer">
            Learn from PDF
          </div>
        </Link>
        <Link href="/kms">
          <div className="text-white group relative w-64 h-64 bg-green-500 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 hover:bg-green-600 cursor-pointer">
            Learn by Summary
          </div>
        </Link>
      </div>
    </div>
  );
}
