"use client";

import React from "react";
import Link from "next/link";
import { Monitor, Sliders, ClipboardList, Sparkles, ArrowRight } from "lucide-react";

export default function HomeLauncher() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between relative overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Premium modern light-mode background design */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0,transparent_65%)] pointer-events-none filter blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.05)_0,transparent_65%)] pointer-events-none filter blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_center,rgba(0,0,0,0.005),transparent)] pointer-events-none" />

      {/* Header */}
      <header className="w-full flex justify-between items-center py-5 px-8 md:px-16 border-b border-slate-200/50 backdrop-blur-md bg-white/40 z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
          <span className="text-[13px] font-mono tracking-[0.18em] font-semibold text-slate-600 uppercase">
            Virtual Teacher Suite
          </span>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/30">
          v2.1.0 // ACTIVE
        </span>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center py-16 px-6 relative z-10 max-w-6xl mx-auto w-full">
        
        {/* Title and Intro */}
        <div className="text-center mb-16 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/50 text-[10px] font-semibold text-indigo-600 tracking-wider uppercase mb-5 font-mono">
            UNICEF Dinner Gala Integration
          </span>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.1] mb-6 text-slate-900">
            AI Virtual Teacher <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">Rohey</span>
          </h1>
          <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-normal">
            Experience our real-time interactive avatar presentation system. Orchestrate pre-recorded animated scenes with a live operator control dashboard, tailored for digital-first classrooms.
          </p>
        </div>

        {/* 3-Column Choice Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-stretch">
          
          {/* Card 1: Stage Screen View */}
          <Link 
            href="/stage"
            className="group flex flex-col justify-between p-8 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(99,102,241,0.08)] transition-all duration-300 relative overflow-hidden"
          >
            {/* Hover card glow aura */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.02),transparent_50%)] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center mb-8 text-indigo-500 group-hover:scale-105 transition-transform duration-300">
                <Monitor className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3 tracking-tight">Stage Screen</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                The grand theater view designed for the main dinner projector. Listens to the local Next.js API session state in real time to trigger seamless, cinematic full-screen videos and dynamic subtitles.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-5 mt-10 flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="group-hover:text-indigo-600 font-semibold transition-colors flex items-center gap-1">
                LAUNCH VIEWER <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
              <span>1080P / 4K READY</span>
            </div>
          </Link>

          {/* Card 2: Operator Panel */}
          <Link 
            href="/operator"
            className="group flex flex-col justify-between p-8 rounded-2xl bg-white border border-slate-100 hover:border-purple-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.08)] transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.02),transparent_50%)] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100/50 flex items-center justify-center mb-8 text-purple-500 group-hover:scale-105 transition-transform duration-300">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3 tracking-tight">Operator Panel</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                A tactile, responsive control console optimized for tablet or phone operators. Sync custom gestures, send real-time subtitles, trigger chapters, and coordinate live interactions.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-5 mt-10 flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="group-hover:text-purple-600 font-semibold transition-colors flex items-center gap-1">
                ENTER CONSOLE <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
              <span>MOBILE READY</span>
            </div>
          </Link>

          {/* Card 3: Project Plan */}
          <Link 
            href="/plan"
            className="group flex flex-col justify-between p-8 rounded-2xl bg-white border border-slate-100 hover:border-pink-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(236,72,153,0.08)] transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.02),transparent_50%)] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div>
              <div className="w-12 h-12 rounded-xl bg-pink-50 border border-pink-100/50 flex items-center justify-center mb-8 text-pink-500 group-hover:scale-105 transition-transform duration-300">
                <ClipboardList className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3 tracking-tight">Project Plan</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Review the comprehensive script, inspect the budget comparative analysis, browse the vocal synthesis archive, and explore our database synchrony roadmap.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-5 mt-10 flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="group-hover:text-pink-600 font-semibold transition-colors flex items-center gap-1">
                VIEW BLUEPRINT <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
              <span>LEDGER INSIGHTS</span>
            </div>
          </Link>

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-100 py-8 text-center relative z-10 px-8">
        <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
          Supported by Kids Edutainment Labs & UNICEF The Gambia © 2026
        </p>
      </footer>

    </div>
  );
}
