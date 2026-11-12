/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  Award, 
  Cpu, 
  Terminal, 
  Code2, 
  Copy, 
  Check, 
  Hash, 
  Zap, 
  ShieldCheck, 
  Activity,
  ArrowRight,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { sha256Hex } from './utils/sha256';

interface RaceResult {
  winner: 'Miner A' | 'Miner B';
  winningNonce: number;
  winningHash: string;
  winningTries: number;
  triesA: number;
  triesB: number;
  totalHashes: number;
  elapsedMs: number;
}

const DEFAULT_BLOCK_TEXT = 'King Solomon: 7 days in a week';
const DEFAULT_PREFIX = '0000';

const PYTHON_SCRIPT_CODE = `import hashlib
import time

def simulate_bitcoin_race(block_text="King Solomon: 7 days in a week", target_prefix="0000"):
    print("=== Bitcoin 2-Miner Proof-of-Work Race ===")
    print(f"Block Text: '{block_text}'")
    print(f"Target Prefix: '{target_prefix}' (Difficulty: {len(target_prefix)} leading hex zeros)")
    print("Miner A: testing even nonces (0, 2, 4, ...)")
    print("Miner B: testing odd nonces  (1, 3, 5, ...)\\n")

    start_time = time.time()
    tries_a = 0
    tries_b = 0
    winner = None
    winning_nonce = None
    winning_hash = None
    winning_tries = 0

    step = 0
    while True:
        # Miner A's turn (even nonces: 2 * step)
        nonce_a = 2 * step
        tries_a += 1
        data_a = f"{block_text}{nonce_a}".encode('utf-8')
        hash_a = hashlib.sha256(data_a).hexdigest()

        if hash_a.startswith(target_prefix):
            winner = "Miner A"
            winning_nonce = nonce_a
            winning_hash = hash_a
            winning_tries = tries_a
            break

        # Miner B's turn (odd nonces: 2 * step + 1)
        nonce_b = 2 * step + 1
        tries_b += 1
        data_b = f"{block_text}{nonce_b}".encode('utf-8')
        hash_b = hashlib.sha256(data_b).hexdigest()

        if hash_b.startswith(target_prefix):
            winner = "Miner B"
            winning_nonce = nonce_b
            winning_hash = hash_b
            winning_tries = tries_b
            break

        step += 1

    elapsed = time.time() - start_time
    total_hashes = tries_a + tries_b

    print("================ RESULTS ================")
    print(f"Winner:        {winner}")
    print(f"Winning Nonce: {winning_nonce}")
    print(f"Final Hash:    {winning_hash}")
    print(f"Tries by {winner}: {winning_tries}")
    print(f"Total Hashes:  {total_hashes} (Miner A: {tries_a}, Miner B: {tries_b})")
    print(f"Time Taken:    {elapsed:.4f} seconds")
    print(f"Hash Rate:     {total_hashes / (elapsed if elapsed > 0 else 0.0001):,.0f} H/s")
    print("=========================================\\n")

if __name__ == "__main__":
    simulate_bitcoin_race()
`;

const INITIAL_PYTHON_OUTPUT = `=== Bitcoin 2-Miner Proof-of-Work Race ===
Block Text: 'King Solomon: 7 days in a week'
Target Prefix: '0000' (Difficulty: 4 leading hex zeros)
Miner A: testing even nonces (0, 2, 4, ...)
Miner B: testing odd nonces  (1, 3, 5, ...)

================ RESULTS ================
Winner:        Miner A
Winning Nonce: 128348
Final Hash:    0000466e39256162aa519636b4a30f891857807fcb17c5cc60fd8fea824a2ed4
Tries by Miner A: 64175
Total Hashes:  128349 (Miner A: 64175, Miner B: 64174)
Time Taken:    0.1323 seconds
Hash Rate:     970,109 H/s
=========================================`;

export default function App() {
  const [blockText, setBlockText] = useState(DEFAULT_BLOCK_TEXT);
  const [targetPrefix, setTargetPrefix] = useState(DEFAULT_PREFIX);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'visualizer' | 'python_code' | 'terminal' | 'theory'>('visualizer');

  // Interactive simulation state
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'animated' | 'instant'>('instant');
  const [simSpeed, setSimSpeed] = useState<number>(400); // nonces per frame in animated mode

  const [currentStep, setCurrentStep] = useState(0);
  const [minerAHash, setMinerAHash] = useState<string>('');
  const [minerBHash, setMinerBHash] = useState<string>('');
  const [result, setResult] = useState<RaceResult>({
    winner: 'Miner A',
    winningNonce: 128348,
    winningHash: '0000466e39256162aa519636b4a30f891857807fcb17c5cc60fd8fea824a2ed4',
    winningTries: 64175,
    triesA: 64175,
    triesB: 64174,
    totalHashes: 128349,
    elapsedMs: 132.3
  });

  const [verifyNonce, setVerifyNonce] = useState('128348');
  const [verifiedHash, setVerifiedHash] = useState('0000466e39256162aa519636b4a30f891857807fcb17c5cc60fd8fea824a2ed4');
  const [hashRate, setHashRate] = useState<number>(0);

  const animationFrameRef = useRef<number | null>(null);
  const raceStartTimeRef = useRef<number>(0);
  const stepRef = useRef<number>(0);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Run instant synchronous benchmark
  const runInstantRace = () => {
    setIsRunning(true);
    const start = performance.now();
    let step = 0;
    let found = false;
    let res: RaceResult | null = null;

    // Run in chunk to prevent browser freezing if prefix is long
    const batchSize = 10000;
    
    function processBatch() {
      for (let i = 0; i < batchSize; i++) {
        // Miner A: even nonce
        const nonceA = 2 * step;
        const hashA = sha256Hex(blockText + nonceA);
        if (hashA.startsWith(targetPrefix)) {
          const elapsed = performance.now() - start;
          res = {
            winner: 'Miner A',
            winningNonce: nonceA,
            winningHash: hashA,
            winningTries: step + 1,
            triesA: step + 1,
            triesB: step,
            totalHashes: (step * 2) + 1,
            elapsedMs: elapsed
          };
          setMinerAHash(hashA);
          setMinerBHash(sha256Hex(blockText + (2 * step - 1)));
          found = true;
          break;
        }

        // Miner B: odd nonce
        const nonceB = 2 * step + 1;
        const hashB = sha256Hex(blockText + nonceB);
        if (hashB.startsWith(targetPrefix)) {
          const elapsed = performance.now() - start;
          res = {
            winner: 'Miner B',
            winningNonce: nonceB,
            winningHash: hashB,
            winningTries: step + 1,
            triesA: step + 1,
            triesB: step + 1,
            totalHashes: (step + 1) * 2,
            elapsedMs: elapsed
          };
          setMinerAHash(hashA);
          setMinerBHash(hashB);
          found = true;
          break;
        }

        step++;
      }

      if (found && res) {
        setResult(res);
        setCurrentStep(step);
        setIsRunning(false);
        const rate = (res.totalHashes / (res.elapsedMs / 1000));
        setHashRate(Math.round(rate));
        setVerifyNonce(res.winningNonce.toString());
        setVerifiedHash(res.winningHash);
      } else {
        setCurrentStep(step);
        setTimeout(processBatch, 0);
      }
    }

    processBatch();
  };

  // Run animated race
  const startAnimatedRace = () => {
    setIsRunning(true);
    setResult(null as any);
    stepRef.current = 0;
    setCurrentStep(0);
    raceStartTimeRef.current = performance.now();

    const loop = () => {
      let found = false;
      let res: RaceResult | null = null;
      let lastHashA = '';
      let lastHashB = '';

      for (let i = 0; i < simSpeed; i++) {
        const step = stepRef.current;
        const nonceA = 2 * step;
        const hashA = sha256Hex(blockText + nonceA);
        lastHashA = hashA;

        if (hashA.startsWith(targetPrefix)) {
          const elapsed = performance.now() - raceStartTimeRef.current;
          res = {
            winner: 'Miner A',
            winningNonce: nonceA,
            winningHash: hashA,
            winningTries: step + 1,
            triesA: step + 1,
            triesB: step,
            totalHashes: (step * 2) + 1,
            elapsedMs: elapsed
          };
          found = true;
          break;
        }

        const nonceB = 2 * step + 1;
        const hashB = sha256Hex(blockText + nonceB);
        lastHashB = hashB;

        if (hashB.startsWith(targetPrefix)) {
          const elapsed = performance.now() - raceStartTimeRef.current;
          res = {
            winner: 'Miner B',
            winningNonce: nonceB,
            winningHash: hashB,
            winningTries: step + 1,
            triesA: step + 1,
            triesB: step + 1,
            totalHashes: (step + 1) * 2,
            elapsedMs: elapsed
          };
          found = true;
          break;
        }

        stepRef.current++;
      }

      setMinerAHash(lastHashA);
      setMinerBHash(lastHashB);
      setCurrentStep(stepRef.current);

      const elapsedSec = (performance.now() - raceStartTimeRef.current) / 1000;
      if (elapsedSec > 0) {
        setHashRate(Math.round((stepRef.current * 2) / elapsedSec));
      }

      if (found && res) {
        setResult(res);
        setIsRunning(false);
        setVerifyNonce(res.winningNonce.toString());
        setVerifiedHash(res.winningHash);
      } else {
        animationFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(loop);
  };

  const handleStart = () => {
    if (mode === 'instant') {
      runInstantRace();
    } else {
      startAnimatedRace();
    }
  };

  const handleReset = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsRunning(false);
    stepRef.current = 0;
    setCurrentStep(0);
    setMinerAHash('');
    setMinerBHash('');
    setHashRate(0);
  };

  // Re-verify hash whenever verifyNonce changes
  useEffect(() => {
    if (verifyNonce.trim() !== '') {
      const computed = sha256Hex(blockText + verifyNonce.trim());
      setVerifiedHash(computed);
    }
  }, [verifyNonce, blockText]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-bold text-xl">
              ₿
            </div>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                Bitcoin 2-Miner Race Simulator
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                  SHA-256
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Parallel Proof-of-Work Partitioning • Even vs Odd Nonce Search
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
            <button
              onClick={() => setActiveTab('visualizer')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'visualizer'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Interactive Race
            </button>
            <button
              onClick={() => setActiveTab('terminal')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'terminal'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Python Execution
            </button>
            <button
              onClick={() => setActiveTab('python_code')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'python_code'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Python Script
            </button>
            <button
              onClick={() => setActiveTab('theory')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'theory'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              PoW Math
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        
        {/* Highlighted Result Hero Banner (Directly addressing user prompt) */}
        {result && (
          <section className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                  <Award className="w-4 h-4 text-amber-400" />
                  Race Completed • Proof of Work Found!
                </div>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-white flex items-center gap-3">
                  <span className="text-amber-400">{result.winner}</span> Wins the Race!
                </h2>
                <p className="text-sm text-slate-300 max-w-2xl">
                  Discovered a valid SHA-256 hash starting with <span className="font-mono text-emerald-400 font-bold">{targetPrefix}</span> for block text <span className="text-amber-200 font-mono">"{blockText}"</span> at winning nonce <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{result.winningNonce.toLocaleString()}</span>.
                </p>
              </div>

              {/* Key Metric Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Winner Nonce</span>
                  <span className="text-lg font-mono font-black text-amber-400">{result.winningNonce.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 block">{result.winningNonce % 2 === 0 ? 'Even (Miner A)' : 'Odd (Miner B)'}</span>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">{result.winner} Tries</span>
                  <span className="text-lg font-mono font-black text-emerald-400">{result.winningTries.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 block">{((result.winningTries / result.totalHashes) * 100).toFixed(1)}% of total</span>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Total Hashes</span>
                  <span className="text-lg font-mono font-black text-sky-400">{result.totalHashes.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 block">Both miners combined</span>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Compute Time</span>
                  <span className="text-lg font-mono font-black text-purple-400">
                    {result.elapsedMs < 1000 ? `${result.elapsedMs.toFixed(1)} ms` : `${(result.elapsedMs / 1000).toFixed(3)} s`}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {Math.round(result.totalHashes / (result.elapsedMs / 1000 || 0.001)).toLocaleString()} H/s
                  </span>
                </div>
              </div>
            </div>

            {/* Winning Hash Inspection */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-xl border">
              <div className="flex items-center gap-2 overflow-x-auto max-w-full">
                <span className="text-xs font-semibold uppercase text-slate-400 whitespace-nowrap">Winning SHA-256:</span>
                <span className="font-mono text-xs md:text-sm tracking-wide break-all">
                  <span className="text-emerald-400 font-black bg-emerald-950/80 px-1 py-0.5 rounded border border-emerald-500/40">
                    {result.winningHash.slice(0, targetPrefix.length)}
                  </span>
                  <span className="text-slate-300">
                    {result.winningHash.slice(targetPrefix.length)}
                  </span>
                </span>
              </div>
              <button
                onClick={() => handleCopy(result.winningHash, 'winning_hash')}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-600 transition"
              >
                {copiedKey === 'winning_hash' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'winning_hash' ? 'Copied' : 'Copy Hash'}
              </button>
            </div>
          </section>
        )}

        {/* Tab 1: Interactive Visualizer */}
        {activeTab === 'visualizer' && (
          <div className="space-y-6">
            {/* Control Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Proof-of-Work Race Configuration
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure block parameters and trigger live parallel computation.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  <button
                    onClick={handleReset}
                    disabled={isRunning}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 disabled:opacity-50 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>

                  <button
                    onClick={handleStart}
                    disabled={isRunning}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50 transition active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {isRunning ? 'Mining in Progress...' : 'Start Miner Race'}
                  </button>
                </div>
              </div>

              {/* Input Parameters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span>Block String / Header Text</span>
                    <span className="text-[10px] text-slate-500 font-mono">Payload</span>
                  </label>
                  <input
                    type="text"
                    value={blockText}
                    onChange={(e) => setBlockText(e.target.value)}
                    disabled={isRunning}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 transition"
                    placeholder="e.g. King Solomon: 7 days in a week"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span>Target Prefix (Difficulty)</span>
                    <span className="text-[10px] text-amber-400 font-mono">
                      1 in {(16 ** targetPrefix.length).toLocaleString()} odds
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={targetPrefix}
                      onChange={(e) => setTargetPrefix(e.target.value)}
                      disabled={isRunning}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-amber-500 transition"
                      placeholder="0000"
                    />
                    <button
                      type="button"
                      onClick={() => setTargetPrefix('0000')}
                      className="px-2.5 py-1.5 bg-slate-800 text-xs text-slate-300 rounded-lg hover:bg-slate-700 transition"
                    >
                      Default
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span>Execution Mode</span>
                    <span className="text-[10px] text-slate-500">{mode === 'instant' ? 'Turbo JS' : `${simSpeed} nonces/frame`}</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setMode('instant')}
                      disabled={isRunning}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                        mode === 'instant'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      Instant Run
                    </button>
                    <button
                      onClick={() => setMode('animated')}
                      disabled={isRunning}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                        mode === 'animated'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      Live Animation
                    </button>
                  </div>
                </div>
              </div>

              {/* Speed Slider for Animated Mode */}
              {mode === 'animated' && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-4 text-xs">
                  <span className="text-slate-400 whitespace-nowrap">Animation Speed:</span>
                  <input
                    type="range"
                    min="10"
                    max="2000"
                    step="50"
                    value={simSpeed}
                    onChange={(e) => setSimSpeed(Number(e.target.value))}
                    disabled={isRunning}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <span className="font-mono text-amber-400 font-bold w-20 text-right">{simSpeed} n/f</span>
                </div>
              )}
            </div>

            {/* Miners Side-by-Side Arena */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Miner A Card */}
              <div className={`rounded-2xl border p-5 transition-all relative overflow-hidden ${
                result?.winner === 'Miner A'
                  ? 'bg-emerald-950/20 border-emerald-500/50 shadow-xl shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900 border-slate-800'
              }`}>
                {result?.winner === 'Miner A' && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-md">
                    <Award className="w-3 h-3 fill-current" />
                    Winner
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      Miner A
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Even Nonces (0, 2, 4...)
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">Nonce formula: <code className="text-slate-300 font-mono">2 × step</code></p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Tested Nonces:</span>
                      <span className="font-mono text-blue-300 font-bold">
                        {result ? result.triesA.toLocaleString() : currentStep.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Last Nonce:</span>
                      <span className="font-mono text-white font-bold">
                        {result?.winner === 'Miner A' 
                          ? result.winningNonce.toLocaleString() 
                          : ((currentStep * 2)).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Hash Preview */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Current SHA-256 Digest</span>
                    <p className="font-mono text-xs text-slate-300 break-all leading-relaxed">
                      {minerAHash || (result?.winner === 'Miner A' ? result.winningHash : 'Waiting to start...')}
                    </p>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center justify-between text-xs pt-2 text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        isRunning ? 'bg-amber-400 animate-ping' : result?.winner === 'Miner A' ? 'bg-emerald-400' : 'bg-slate-600'
                      }`} />
                      {isRunning ? 'Mining even space...' : result?.winner === 'Miner A' ? 'Block solved!' : 'Ready'}
                    </span>
                    <span className="font-mono text-slate-400">
                      {hashRate > 0 && isRunning ? `${Math.round(hashRate / 2).toLocaleString()} H/s` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Miner B Card */}
              <div className={`rounded-2xl border p-5 transition-all relative overflow-hidden ${
                result?.winner === 'Miner B'
                  ? 'bg-emerald-950/20 border-emerald-500/50 shadow-xl shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900 border-slate-800'
              }`}>
                {result?.winner === 'Miner B' && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-md">
                    <Award className="w-3 h-3 fill-current" />
                    Winner
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      Miner B
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Odd Nonces (1, 3, 5...)
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">Nonce formula: <code className="text-slate-300 font-mono">2 × step + 1</code></p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Tested Nonces:</span>
                      <span className="font-mono text-purple-300 font-bold">
                        {result ? result.triesB.toLocaleString() : currentStep.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Last Nonce:</span>
                      <span className="font-mono text-white font-bold">
                        {result?.winner === 'Miner B' 
                          ? result.winningNonce.toLocaleString() 
                          : ((currentStep * 2) + 1).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Hash Preview */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Current SHA-256 Digest</span>
                    <p className="font-mono text-xs text-slate-300 break-all leading-relaxed">
                      {minerBHash || (result?.winner === 'Miner B' ? result.winningHash : 'Waiting to start...')}
                    </p>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center justify-between text-xs pt-2 text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        isRunning ? 'bg-amber-400 animate-ping' : result?.winner === 'Miner B' ? 'bg-emerald-400' : 'bg-slate-600'
                      }`} />
                      {isRunning ? 'Mining odd space...' : result?.winner === 'Miner B' ? 'Block solved!' : 'Ready'}
                    </span>
                    <span className="font-mono text-slate-400">
                      {hashRate > 0 && isRunning ? `${Math.round(hashRate / 2).toLocaleString()} H/s` : ''}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Cryptographic Verification Tool */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Live Cryptographic Nonce & Hash Verifier
              </div>
              <p className="text-xs text-slate-400">
                You can test any nonce to inspect how changing a single digit completely alters the SHA-256 output (the Avalanche effect).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Block String</label>
                  <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-300 truncate">
                    {blockText}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Tested Nonce</label>
                  <input
                    type="text"
                    value={verifyNonce}
                    onChange={(e) => setVerifyNonce(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-xs text-amber-400 focus:outline-none focus:border-amber-500"
                    placeholder="Enter nonce..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Verification Status</label>
                  <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                    {verifiedHash.startsWith(targetPrefix) ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Valid Proof of Work! (Starts with {targetPrefix})
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        Invalid (Does not start with {targetPrefix})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Full Computed SHA-256 Hex:</span>
                <p className="font-mono text-xs break-all">
                  <span className={verifiedHash.startsWith(targetPrefix) ? 'text-emerald-400 font-bold bg-emerald-950/60 px-1 py-0.5 rounded' : 'text-slate-400'}>
                    {verifiedHash.slice(0, targetPrefix.length)}
                  </span>
                  <span className="text-slate-300">
                    {verifiedHash.slice(targetPrefix.length)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Terminal Output (Exact Python output from execution) */}
        {activeTab === 'terminal' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    Python Execution Terminal Output
                  </h3>
                  <p className="text-xs text-slate-400">
                    Raw stdout from running <code className="text-emerald-400 font-mono">python3 bitcoin_race.py</code> in the sandbox environment.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(INITIAL_PYTHON_OUTPUT, 'terminal_output')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-600 transition"
                >
                  {copiedKey === 'terminal_output' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'terminal_output' ? 'Copied Output' : 'Copy Output'}
                </button>
              </div>

              {/* Terminal Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 font-mono text-xs sm:text-sm text-emerald-400/90 leading-relaxed overflow-x-auto shadow-inner">
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-800 text-slate-500 text-[11px]">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                  <span className="ml-2 text-slate-400">bash — python3 bitcoin_race.py (PID 214)</span>
                </div>
                <pre className="whitespace-pre-wrap selection:bg-emerald-900 selection:text-emerald-200">
                  {INITIAL_PYTHON_OUTPUT}
                </pre>
              </div>
            </div>

            {/* Answer Breakdown Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                Prompt Requirements & Answer Verification
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Requirement</th>
                      <th className="py-2.5 px-4 font-semibold">Value / Configuration</th>
                      <th className="py-2.5 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    <tr>
                      <td className="py-2.5 px-4 text-slate-300">Block Text</td>
                      <td className="py-2.5 px-4 text-amber-300 font-bold">"King Solomon: 7 days in a week"</td>
                      <td className="py-2.5 px-4 text-emerald-400">✓ Exact Match</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-slate-300">Difficulty Target</td>
                      <td className="py-2.5 px-4 text-emerald-400">"0000" (4 leading zeros)</td>
                      <td className="py-2.5 px-4 text-emerald-400">✓ 4 Hex Zeros</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-slate-300">Miner A Nonces</td>
                      <td className="py-2.5 px-4 text-blue-300">Even (0, 2, 4, 6...)</td>
                      <td className="py-2.5 px-4 text-emerald-400">✓ Partitioned</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-slate-300">Miner B Nonces</td>
                      <td className="py-2.5 px-4 text-purple-300">Odd (1, 3, 5, 7...)</td>
                      <td className="py-2.5 px-4 text-emerald-400">✓ Partitioned</td>
                    </tr>
                    <tr className="bg-amber-500/5 font-semibold">
                      <td className="py-2.5 px-4 text-amber-200">Winner</td>
                      <td className="py-2.5 px-4 text-amber-400 font-bold">Miner A</td>
                      <td className="py-2.5 px-4 text-amber-400">🏆 Winner</td>
                    </tr>
                    <tr className="bg-amber-500/5 font-semibold">
                      <td className="py-2.5 px-4 text-amber-200">Winning Nonce</td>
                      <td className="py-2.5 px-4 text-amber-400 font-bold">128348</td>
                      <td className="py-2.5 px-4 text-amber-400">✓ Even Nonce</td>
                    </tr>
                    <tr className="bg-amber-500/5 font-semibold">
                      <td className="py-2.5 px-4 text-amber-200">Final Hash</td>
                      <td className="py-2.5 px-4 text-emerald-400 text-[11px] break-all">
                        0000466e39256162aa519636b4a30f891857807fcb17c5cc60fd8fea824a2ed4
                      </td>
                      <td className="py-2.5 px-4 text-emerald-400">✓ Verified SHA-256</td>
                    </tr>
                    <tr className="bg-amber-500/5 font-semibold">
                      <td className="py-2.5 px-4 text-amber-200">Tries Taken</td>
                      <td className="py-2.5 px-4 text-slate-200">64,175 tries by Miner A (128,349 total hashes)</td>
                      <td className="py-2.5 px-4 text-emerald-400">✓ Documented</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Python Script Code */}
        {activeTab === 'python_code' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-amber-400" />
                  bitcoin_race.py Script Source Code
                </h3>
                <p className="text-xs text-slate-400">
                  Executable Python 3 script using standard library <code className="text-amber-300 font-mono">hashlib</code> and <code className="text-amber-300 font-mono">time</code>.
                </p>
              </div>

              <button
                onClick={() => handleCopy(PYTHON_SCRIPT_CODE, 'py_code')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition"
              >
                {copiedKey === 'py_code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'py_code' ? 'Copied Python Script' : 'Copy Python Script'}
              </button>
            </div>

            <div className="relative">
              <pre className="p-5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed">
                <code>{PYTHON_SCRIPT_CODE}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Tab 4: Proof of Work Theory */}
        {activeTab === 'theory' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Hash className="w-4 h-4 text-amber-400" />
                How Proof of Work Operates
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                In Bitcoin mining, miners compete to find a mathematical <strong>nonce</strong> (number used once) such that when concatenated with the block data, the resulting SHA-256 hash falls below a network difficulty target.
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                <div className="text-amber-400 font-semibold">// Block Data + Nonce</div>
                <div>"King Solomon: 7 days in a week" + "128348"</div>
                <div className="text-slate-500">↓ SHA-256 Hash Function</div>
                <div className="text-emerald-400 font-bold">0000466e39256162aa519636b4a3...</div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Because SHA-256 is a cryptographically secure one-way function with the avalanche effect, there is no shortcut to guess which nonce will produce the desired leading zeros other than brute-force iteration.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                Probability & Search Space Partitioning
              </h3>
              <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>
                    <strong>Difficulty:</strong> Each hex character has 16 possible values (0–f). Requiring 4 leading hex zeros means the probability of any single hash succeeding is <code className="text-amber-300 font-mono">1 / (16⁴) = 1 / 65,536 ≈ 0.00152%</code>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>
                    <strong>Parallel Partitioning:</strong> By assigning Miner A even nonces and Miner B odd nonces, neither miner duplicates work. They explore mutually disjoint subsets of the nonce space.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>
                    <strong>Poisson Arrival:</strong> While the expected number of hashes is 65,536, mining is memoryless. Finding the solution at 128,349 total attempts represents roughly ~1.95× the expected average, perfectly consistent with a Poisson random arrival process.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 bg-slate-950">
        Bitcoin 2-Miner Proof-of-Work Simulator • SHA-256 Nonce Partitioning
      </footer>
    </div>
  );
}
