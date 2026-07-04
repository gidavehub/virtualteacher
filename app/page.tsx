"use client";

import React from "react";
import Link from "next/link";
import { Monitor, Sliders, ClipboardList, ArrowRight } from "lucide-react";

export default function HomeLauncher() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1f2023] flex flex-col justify-between selection:bg-neutral-100 selection:text-neutral-900 font-sans">
      
      {/* Top bar with thin borders */}
      <header className="w-full flex justify-between items-center py-6 px-8 md:px-16 border-b border-[#eaeaea] bg-white">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-mono tracking-[0.2em] font-semibold text-[#666666] uppercase">
            Virtual Teacher System
          </span>
        </div>
      </header>

      {/* Main Content Area - Generous breathing room */}
      <main className="flex-1 flex flex-col items-center justify-center py-20 px-8 max-w-5xl mx-auto w-full">
        
        {/* Simple Minimal Title */}
        <div className="text-center mb-20 max-w-2xl">
          <span className="inline-block text-[10px] font-semibold text-[#666666] tracking-[0.15em] uppercase mb-4 font-mono">
            UNICEF Dinner Gala
          </span>
          <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-[#111111] mb-6 font-sans">
            AI Teacher Rohey
          </h1>
          <p className="text-[#666666] text-xs md:text-sm leading-relaxed max-w-lg mx-auto font-normal font-sans">
            Experience our real-time interactive presentation system. Orchestrate pre-recorded animated scenes with a live operator control dashboard, tailored for digital classrooms.
          </p>
        </div>

        {/* 3-Column Choice Grid with ultra-thin, precise borders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-stretch">
          
          {/* Card 1: Stage Screen View */}
          <Link 
            href="/stage"
            className="group flex flex-col justify-between p-8 rounded-lg bg-white border border-[#eaeaea] hover:border-[#999999] transition-all duration-300 relative"
          >
            <div>
              <div className="w-10 h-12 flex items-center mb-6 text-[#444444]">
                <Monitor className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-medium text-[#111111] mb-3 font-sans">Stage Screen</h3>
              <p className="text-xs text-[#666666] leading-relaxed font-sans font-normal">
                The grand theater view designed for the main dinner projector. Listens to the local API session state in real time to trigger full-screen videos.
              </p>
            </div>

            <div className="border-t border-[#eaeaea] pt-5 mt-10 flex items-center justify-between text-[10px] font-mono text-[#888888]">
              <span className="group-hover:text-[#111111] font-semibold transition-colors flex items-center gap-1">
                LAUNCH VIEW <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
              <span>1080P READY</span>
            </div>
          </Link>

          {/* Card 2: Operator Panel */}
          <Link 
            href="/operator"
            className="group flex flex-col justify-between p-8 rounded-lg bg-white border border-[#eaeaea] hover:border-[#999999] transition-all duration-300 relative"
          >
            <div>
              <div className="w-10 h-12 flex items-center mb-6 text-[#444444]">
                <Sliders className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-medium text-[#111111] mb-3 font-sans">Operator Panel</h3>
              <p className="text-xs text-[#666666] leading-relaxed font-sans font-normal">
                A tactile, responsive control console. Sync physical gestures, send real-time subtitles, trigger chapters, and coordinate live interactions.
              </p>
            </div>

            <div className="border-t border-[#eaeaea] pt-5 mt-10 flex items-center justify-between text-[10px] font-mono text-[#888888]">
              <span className="group-hover:text-[#111111] font-semibold transition-colors flex items-center gap-1">
                ENTER CONSOLE <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
              <span>CONTROL CONSOLE</span>
            </div>
          </Link>

          {/* Card 3: Project Plan */}
          <Link 
            href="/plan"
            className="group flex flex-col justify-between p-8 rounded-lg bg-white border border-[#eaeaea] hover:border-[#999999] transition-all duration-300 relative"
          >
            <div>
              <div className="w-10 h-12 flex items-center mb-6 text-[#444444]">
                <ClipboardList className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-medium text-[#111111] mb-3 font-sans">Project Plan</h3>
              <p className="text-xs text-[#666666] leading-relaxed font-sans font-normal">
                Review the comprehensive script, inspect the budget comparative analysis, and explore our database synchrony roadmap.
              </p>
            </div>

            <div className="border-t border-[#eaeaea] pt-5 mt-10 flex items-center justify-between text-[10px] font-mono text-[#888888]">
              <span className="group-hover:text-[#111111] font-semibold transition-colors flex items-center gap-1">
                VIEW BLUEPRINT <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
              <span>SCRIPTS & BUDGETS</span>
            </div>
          </Link>

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-[#eaeaea] py-8 text-center px-8">
        <p className="text-[9px] text-[#888888] font-mono tracking-[0.15em] uppercase">
          Supported by Kids Edutainment Labs & UNICEF The Gambia © 2026
        </p>
      </footer>

    </div>
  );
}
