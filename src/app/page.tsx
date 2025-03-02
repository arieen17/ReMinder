"use client";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import pixel from "@/app/pixel.png";

export default function Main() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Image src={pixel} alt="pixel the parrot" className="w-64 h-62" />
      <h1 className="text-4xl font-bold mb-8">Welcome to ReMinder</h1>
      <p className="text-xl mb-5">
        Study with Pixel in your learning style to help you remember everything!
      </p>
      <div className="flex space-x-8">
        <Link href="/auditory">
          <div className="text-white text-xl group relative w-64 h-16 bg-blue-500 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 hover:bg-blue-600 cursor-pointer">
            I'm an auditory learner!
          </div>
        </Link>
        <Link href="/readwrite">
          <div className="text-white group text-xl relative w-64 h-16 bg-green-500 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 hover:bg-green-600 cursor-pointer">
            I'm a read/write learner!
          </div>
        </Link>
      </div>
    </div>
  );
}
