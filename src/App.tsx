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
  Crown,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Sliders,
  ChevronDown
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

interface BlessingAttempt {
  nonceA: number;
  nonceB: number;
  hashA: string;
  hashB: string;
  miracle: boolean;
  winner?: 'Miner A' | 'Miner B';
  attemptCount: number;
}

interface WisdomPreset {
  labelHe: string;
  labelEn: string;
  text: string;
  sourceHe: string;
}

interface DifficultyOption {
  value: string;
  zeros: number;
  labelEn: string;
  labelHe: string;
  oddsEn: string;
  oddsHe: string;
  badge: string;
  badgeColor: string;
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { 
    value: '00', 
    zeros: 2, 
    labelEn: '2 Zeros (00) — Fast', 
    labelHe: '2 אפסים (00) — מהיר', 
    oddsEn: '1 in 256 (~0.39%)', 
    oddsHe: '1 ל-256 (מהיר מאוד)', 
    badge: '2 Zeros',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  },
  { 
    value: '000', 
    zeros: 3, 
    labelEn: '3 Zeros (000) — Quick', 
    labelHe: '3 אפסים (000) — קל', 
    oddsEn: '1 in 4,096 (~0.024%)', 
    oddsHe: '1 ל-4,096 (מהיר)', 
    badge: '3 Zeros',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
  },
  { 
    value: '0000', 
    zeros: 4, 
    labelEn: '4 Zeros (0000) — Standard (Default)', 
    labelHe: '4 אפסים (0000) — תקן ברירת מחדל', 
    oddsEn: '1 in 65,536 (~0.0015%)', 
    oddsHe: '1 ל-65,536 (תקן ביטקוין)', 
    badge: '4 Zeros',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  },
  { 
    value: '00000', 
    zeros: 5, 
    labelEn: '5 Zeros (00000) — Intensive', 
    labelHe: '5 אפסים (00000) — אינטנסיבי', 
    oddsEn: '1 in 1,048,576 (~0.000095%)', 
    oddsHe: '1 ל-1,048,576 (אינטנסיבי)', 
    badge: '5 Zeros',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  },
  { 
    value: '000000', 
    zeros: 6, 
    labelEn: '6 Zeros (000000) — Heavy Proof', 
    labelHe: '6 אפסים (000000) — אתגר כבד', 
    oddsEn: '1 in 16,777,216 (~0.0000059%)', 
    oddsHe: '1 ל-16.7 מיליון (עומס כבד)', 
    badge: '6 Zeros',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40'
  }
];

const WISDOM_PRESETS: WisdomPreset[] = [
  {
    labelHe: 'שבעה ימים בשבוע - חכמת שלמה',
    labelEn: '7 Days in a Week - Solomon Wisdom (Hebrew)',
    text: 'שבעה ימים בשבוע - חכמת שלמה',
    sourceHe: 'משפט חכמה ומחזור הימים'
  },
  {
    labelHe: 'King Solomon: 7 days in a week (אנגלית מקורית)',
    labelEn: 'King Solomon: 7 days in a week (Original Prompt)',
    text: 'King Solomon: 7 days in a week',
    sourceHe: 'Original English Prompt'
  },
  {
    labelHe: 'קנה חכמה קנה בינה',
    labelEn: 'Acquire wisdom, acquire understanding',
    text: 'קנה חכמה קנה בינה - שלמה המלך',
    sourceHe: 'משלי ד׳, ה׳'
  },
  {
    labelHe: 'לב שמח ייטיב גהה',
    labelEn: 'A joyful heart is good medicine',
    text: 'לב שמח ייטיב גהה - חכמת שלמה',
    sourceHe: 'משלי י״ז, כ״ב'
  },
  {
    labelHe: 'טוב שם משמן טוב',
    labelEn: 'A good name is better than precious oil',
    text: 'טוב שם משמן טוב - קהלת ז׳',
    sourceHe: 'קהלת ז׳, א׳'
  },
  {
    labelHe: 'לכל זמן ועת לכל חפץ',
    labelEn: 'To everything there is a season',
    text: 'לכל זמן ועת לכל חפץ תחת השמים',
    sourceHe: 'קהלת ג׳, א׳'
  }
];

const PYTHON_SCRIPT_CODE = `# -*- coding: utf-8 -*-
import hashlib
import time
import random
import sys

def simulate_bitcoin_race(block_text="שבעה ימים בשבוע - חכמת שלמה", target_prefix="0000"):
    print("=== Bitcoin 2-Miner Proof-of-Work Race ===")
    print(f"Block Text / טקסט הבלוק: '{block_text}'")
    print(f"Target Prefix / קידומת יעד: '{target_prefix}' (Difficulty: {len(target_prefix)} leading hex zeros)")
    print("Miner A / כורה א: testing even nonces (0, 2, 4, ...)")
    print("Miner B / כורה ב: testing odd nonces  (1, 3, 5, ...)\\n")

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
            winner = "Miner A (כורה א')"
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
            winner = "Miner B (כורה ב')"
            winning_nonce = nonce_b
            winning_hash = hash_b
            winning_tries = tries_b
            break

        step += 1

    elapsed = time.time() - start_time
    total_hashes = tries_a + tries_b

    print("================ RESULTS / תוצאות ================")
    print(f"Winner / מנצח:          {winner}")
    print(f"Winning Nonce / נונס:   {winning_nonce}")
    print(f"Final Hash / גיבוב:     {winning_hash}")
    print(f"Tries / מספר ניסיונות:  {winning_tries}")
    print(f"Total Hashes / סה״כ:   {total_hashes} (Miner A: {tries_a}, Miner B: {tries_b})")
    print(f"Time Taken / זמן ריצה:  {elapsed:.4f} seconds")
    print(f"Hash Rate / קצב גיבוב:  {total_hashes / (elapsed if elapsed > 0 else 0.0001):,.0f} H/s")
    print("===================================================\\n")

def simulate_blessing_attempt(block_text="שבעה ימים בשבוע - חכמת שלמה", target_prefix="0000"):
    print("=== ברכת ניסיון ראשון / First Try (Blessing) ===")
    print(f"Block Text / טקסט הבלוק: '{block_text}'")
    print(f"Target Prefix / קידומת יעד: '{target_prefix}' (Odds: 1 in {16**len(target_prefix):,})")
    
    nonce_a = random.randint(1, 5000000) * 2
    nonce_b = random.randint(1, 5000000) * 2 + 1
    
    hash_a = hashlib.sha256(f"{block_text}{nonce_a}".encode('utf-8')).hexdigest()
    hash_b = hashlib.sha256(f"{block_text}{nonce_b}".encode('utf-8')).hexdigest()
    
    print(f"כורה א׳ (זוגי)   | נונס: {nonce_a:>8} | גיבוב: {hash_a}")
    print(f"כורה ב׳ (אי-זוגי)| נונס: {nonce_b:>8} | גיבוב: {hash_b}")
    
    if hash_a.startswith(target_prefix):
        print(f"\\n✨ נס שלמה המלך! כורה א׳ פיצח את ה-Hash בניסיון בודד ראשון! (נונס: {nonce_a}) ✨")
    elif hash_b.startswith(target_prefix):
        print(f"\\n✨ נס שלמה המלך! כורה ב׳ פיצח את ה-Hash בניסיון בודד ראשון! (נונס: {nonce_b}) ✨")
    else:
        print("\\n[תוצאת ניסיון ראשון]: אף כורה לא פגע ביעד בניסיון בודד זה.")
        print("שלמה המלך לימדנו: 'עוֹבֵד אַדְמָתוֹ יִשְׂבַּע לָחֶם' — הוכחת עבודה דורשת התמדה וסריקה מלאה!")

if __name__ == "__main__":
    prefix = "0000"
    for arg in sys.argv:
        if arg.startswith("--difficulty="):
            zeros = int(arg.split("=")[1])
            prefix = "0" * zeros
    if "--blessing" in sys.argv:
        simulate_blessing_attempt(target_prefix=prefix)
    else:
        simulate_bitcoin_race(target_prefix=prefix)
`;

export default function App() {
  const [solomonTheme, setSolomonTheme] = useState<boolean>(true);
  const [language, setLanguage] = useState<'bilingual' | 'he' | 'en'>('bilingual');
  const [blockText, setBlockText] = useState<string>(WISDOM_PRESETS[0].text);
  
  // Difficulty State
  const [targetPrefix, setTargetPrefix] = useState<string>('0000');
  const [difficultySelectValue, setDifficultySelectValue] = useState<string>('0000');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'visualizer' | 'terminal' | 'python_code' | 'theory'>('visualizer');

  // Race controls
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'instant' | 'animated'>('instant');
  const [simSpeed, setSimSpeed] = useState<number>(300);

  const [currentStep, setCurrentStep] = useState(0);
  const [minerAHash, setMinerAHash] = useState<string>('');
  const [minerBHash, setMinerBHash] = useState<string>('');
  
  // Results
  const [result, setResult] = useState<RaceResult | null>({
    winner: 'Miner B',
    winningNonce: 1535,
    winningHash: '000044e30462896bc5895257f5b0565526235cfffb2311e524318bef80f8a286',
    winningTries: 768,
    triesA: 768,
    triesB: 768,
    totalHashes: 1536,
    elapsedMs: 2.1
  });

  // Blessing First Try State
  const [blessingAttempt, setBlessingAttempt] = useState<BlessingAttempt | null>(null);

  const [verifyNonce, setVerifyNonce] = useState('1535');
  const [verifiedHash, setVerifiedHash] = useState('000044e30462896bc5895257f5b0565526235cfffb2311e524318bef80f8a286');
  const [hashRate, setHashRate] = useState<number>(0);

  const animationFrameRef = useRef<number | null>(null);
  const raceStartTimeRef = useRef<number>(0);
  const stepRef = useRef<number>(0);

  const isRTL = language === 'he';

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Preset selector
  const handleSelectPreset = (val: string) => {
    setBlockText(val);
    setVerifyNonce('0');
    setBlessingAttempt(null);
  };

  // Difficulty change handler
  const handleDifficultyChange = (newPrefix: string) => {
    setTargetPrefix(newPrefix);
    setDifficultySelectValue(newPrefix);
    setBlessingAttempt(null);
    
    // Check if previous result already satisfies this prefix
    if (result && !result.winningHash.startsWith(newPrefix)) {
      setResult(null);
    }
  };

  // Custom prefix manual change
  const handleCustomPrefixInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^0-9a-f]/g, '');
    setTargetPrefix(val);
    const matched = DIFFICULTY_OPTIONS.find(d => d.value === val);
    if (matched) {
      setDifficultySelectValue(matched.value);
    } else {
      setDifficultySelectValue('custom');
    }
  };

  // Single Blessing First-Try Handler
  const handleBlessingTry = () => {
    if (isRunning) return;

    // Draw random large even nonce for Miner A, random odd nonce for Miner B
    const nonceA = (Math.floor(Math.random() * 4000000) + 1000) * 2;
    const nonceB = (Math.floor(Math.random() * 4000000) + 1000) * 2 + 1;

    const hashA = sha256Hex(blockText + nonceA);
    const hashB = sha256Hex(blockText + nonceB);

    setMinerAHash(hashA);
    setMinerBHash(hashB);
    setCurrentStep(1);

    const matchA = hashA.startsWith(targetPrefix);
    const matchB = hashB.startsWith(targetPrefix);
    const attemptNum = (blessingAttempt?.attemptCount || 0) + 1;

    if (matchA || matchB) {
      const winnerName: 'Miner A' | 'Miner B' = matchA ? 'Miner A' : 'Miner B';
      const winNonce = matchA ? nonceA : nonceB;
      const winHash = matchA ? hashA : hashB;

      setBlessingAttempt({
        nonceA,
        nonceB,
        hashA,
        hashB,
        miracle: true,
        winner: winnerName,
        attemptCount: attemptNum
      });

      setResult({
        winner: winnerName,
        winningNonce: winNonce,
        winningHash: winHash,
        winningTries: 1,
        triesA: 1,
        triesB: 1,
        totalHashes: 2,
        elapsedMs: 0.8
      });
      setVerifyNonce(winNonce.toString());
      setVerifiedHash(winHash);
    } else {
      setBlessingAttempt({
        nonceA,
        nonceB,
        hashA,
        hashB,
        miracle: false,
        attemptCount: attemptNum
      });
    }
  };

  // Dynamic batch size for instant race based on difficulty
  const getBatchSize = () => {
    const len = targetPrefix.length;
    if (len <= 2) return 1000;
    if (len === 3) return 3000;
    if (len === 4) return 10000;
    return 25000; // 5 or more zeros
  };

  // Instant race
  const runInstantRace = () => {
    setIsRunning(true);
    setBlessingAttempt(null);
    const start = performance.now();
    let step = 0;
    let found = false;
    let res: RaceResult | null = null;
    const batchSize = getBatchSize();

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
        const elapsedSec = (performance.now() - start) / 1000;
        if (elapsedSec > 0) {
          setHashRate(Math.round((step * 2) / elapsedSec));
        }
        setTimeout(processBatch, 0);
      }
    }

    processBatch();
  };

  // Animated race
  const startAnimatedRace = () => {
    setIsRunning(true);
    setBlessingAttempt(null);
    setResult(null);
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
    setBlessingAttempt(null);
  };

  useEffect(() => {
    if (verifyNonce.trim() !== '') {
      const computed = sha256Hex(blockText + verifyNonce.trim());
      setVerifiedHash(computed);
    }
  }, [verifyNonce, blockText]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const currentOdds = 16 ** targetPrefix.length;

  return (
    <div 
      dir={isRTL ? 'rtl' : 'ltr'} 
      className={`min-h-screen text-slate-100 flex flex-col font-sans transition-colors duration-300 ${
        solomonTheme 
          ? 'bg-[#0b0f19] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(217,119,6,0.18),rgba(255,255,255,0))]' 
          : 'bg-slate-950'
      }`}
    >
      {/* Top Header */}
      <header className={`border-b sticky top-0 z-50 px-4 lg:px-8 py-3.5 backdrop-blur transition-colors ${
        solomonTheme 
          ? 'border-amber-500/20 bg-[#0d1322]/90' 
          : 'border-slate-800 bg-slate-900/90'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo & Royal Title */}
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shadow-lg transition-all ${
              solomonTheme 
                ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-400/30' 
                : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-orange-500/20'
            }`}>
              {solomonTheme ? <Crown className="w-6 h-6 stroke-[2.2]" /> : <span className="text-xl">₿</span>}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>מרוץ כורי ביטקוין • חכמת שלמה</span>
                  <span className="hidden sm:inline text-xs font-normal text-amber-300/80">/ Solomon Miner Race</span>
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
                  SHA-256
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                  {targetPrefix.length} Leading Zeros
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'he' 
                  ? 'מרוץ הוכחת עבודה מקבילי — כורה א׳ (זוגי) נגד כורה ב׳ (אי-זוגי)'
                  : language === 'en'
                  ? 'Parallel Proof-of-Work Race: Miner A (Even) vs Miner B (Odd)'
                  : 'מרוץ כורים מקבילי • Parallel Proof-of-Work: Even vs Odd Nonce Partitioning'}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Solomon Theme Toggle */}
            <button
              onClick={() => setSolomonTheme(!solomonTheme)}
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-medium transition ${
                solomonTheme 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm' 
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="הפעל / כבה עיצוב בהשראת חכמת שלמה המלך"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>{solomonTheme ? 'עיצוב שלמה המלך (פעיל)' : 'עיצוב מלכות שלמה'}</span>
            </button>

            {/* Language Toggle */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setLanguage('he')}
                className={`px-2 py-1 rounded text-xs transition ${language === 'he' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
              >
                עברית
              </button>
              <button
                onClick={() => setLanguage('bilingual')}
                className={`px-2 py-1 rounded text-xs transition ${language === 'bilingual' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
              >
                דו-לשוני
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded text-xs transition ${language === 'en' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
              >
                EN
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setActiveTab('visualizer')}
                className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
                  activeTab === 'visualizer' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3 h-3" />
                <span>{language === 'he' ? 'סימולציה' : 'Race'}</span>
              </button>
              <button
                onClick={() => setActiveTab('terminal')}
                className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
                  activeTab === 'terminal' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3 h-3" />
                <span>{language === 'he' ? 'טרמינל פייתון' : 'Terminal'}</span>
              </button>
              <button
                onClick={() => setActiveTab('python_code')}
                className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
                  activeTab === 'python_code' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3 h-3" />
                <span>{language === 'he' ? 'קוד פייתון' : 'Code'}</span>
              </button>
              <button
                onClick={() => setActiveTab('theory')}
                className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
                  activeTab === 'theory' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>{language === 'he' ? 'תורת הכרייה' : 'Theory'}</span>
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">

        {/* King Solomon Wisdom Banner & Phrase Selector */}
        <section className={`border rounded-2xl p-5 relative overflow-hidden transition-all shadow-xl ${
          solomonTheme 
            ? 'bg-gradient-to-r from-amber-950/40 via-[#131b2e] to-[#0d1322] border-amber-500/30' 
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {language === 'en' ? "King Solomon's Wisdom Block Text Selection" : 'בחירת טקסט הבלוק מתוך חכמת שלמה המלך'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {language === 'en'
                  ? 'Select a traditional wisdom phrase or input custom Hebrew text to race for the SHA-256 target hash.'
                  : 'בחר פסוק או פתגם חכמה בעברית כטקסט הבלוק, או הזן טקסט אישי למרוץ הכרייה.'}
              </p>
            </div>

            {/* Quick Presets Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 max-w-2xl">
              {WISDOM_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(preset.text)}
                  disabled={isRunning}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${
                    blockText === preset.text
                      ? 'bg-amber-500/25 text-amber-300 border-amber-400 font-semibold shadow-sm'
                      : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-amber-500/40'
                  }`}
                >
                  {language === 'en' ? preset.labelEn : preset.labelHe}
                </button>
              ))}
            </div>

          </div>
        </section>

        {/* Special Blessing Card (Shows when "ניסיון ראשון (ברכה)" was clicked) */}
        {blessingAttempt && (
          <section className={`border rounded-2xl p-6 shadow-2xl relative overflow-hidden transition-all animate-in fade-in-50 duration-300 ${
            blessingAttempt.miracle
              ? 'bg-gradient-to-r from-emerald-950/60 via-amber-950/40 to-emerald-950/60 border-emerald-400 ring-2 ring-emerald-400/50'
              : 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-[#121929] border-amber-500/40'
          }`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    blessingAttempt.miracle
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {blessingAttempt.miracle
                        ? '✨ נס חכמת שלמה! ה-Hash פוצח בניסיון ראשון בודד! ✨'
                        : `ניסיון ראשון (ברכה) • בדיקה #${blessingAttempt.attemptCount}`}
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    סיכוי: 1 ל-{currentOdds.toLocaleString()}
                  </span>
                </div>

                <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  {blessingAttempt.miracle ? (
                    <span className="text-emerald-400">
                      🏆 {blessingAttempt.winner === 'Miner A' ? 'כורה א׳ (זוגי)' : 'כורה ב׳ (אי-זוגי)'} פגע במטרה במכה ראשונה!
                    </span>
                  ) : (
                    <span>תוצאת הברכה: אף כורה לא פגע ביעד בניסיון בודד זה</span>
                  )}
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {blessingAttempt.miracle ? (
                    <span className="text-emerald-200">
                      אירוע נדיר ביותר! אחד הכורים הצליח להגריל נונס שהניב בדיוק את הקידומת המבוקשת <strong className="font-mono text-emerald-400">{targetPrefix}</strong> בניסיון ראשון יחיד!
                    </span>
                  ) : (
                    <>
                      שלמה המלך לימדנו: <em className="text-amber-200 font-serif">"עוֹבֵד אַדְמָתוֹ יִשְׂבַּע לָחֶם וּמְרַדֵּף רֵיקִים חֲסַר לֵב"</em> (משלי י״ב, י״א) — 
                      הוכחת עבודה אמיתית (Proof-of-Work) אינה נשענת על מזל רגעי אלא על עמל חישובי רציף.
                    </>
                  )}
                </p>
              </div>

              {/* Action buttons inside blessing card */}
              <div className="flex flex-wrap sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                <button
                  onClick={handleBlessingTry}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>הגרל ברכה נוספת (נסה שוב)</span>
                </button>
                <button
                  onClick={handleStart}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>הפעל מרוץ מלא עד למציאה</span>
                </button>
              </div>
            </div>

            {/* Generated Nonces and Hashes details */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className={`p-3 rounded-xl border ${
                blessingAttempt.hashA.startsWith(targetPrefix) 
                  ? 'bg-emerald-950/40 border-emerald-500/60' 
                  : 'bg-slate-950/70 border-slate-800'
              }`}>
                <div className="flex justify-between items-center text-slate-400 mb-1">
                  <span className="font-bold text-blue-400">כורה א׳ (נונס זוגי):</span>
                  <span className="text-white font-bold">{blessingAttempt.nonceA.toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-slate-300 break-all" dir="ltr">
                  <span className={blessingAttempt.hashA.startsWith(targetPrefix) ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {blessingAttempt.hashA.slice(0, targetPrefix.length)}
                  </span>
                  <span>{blessingAttempt.hashA.slice(targetPrefix.length)}</span>
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${
                blessingAttempt.hashB.startsWith(targetPrefix) 
                  ? 'bg-emerald-950/40 border-emerald-500/60' 
                  : 'bg-slate-950/70 border-slate-800'
              }`}>
                <div className="flex justify-between items-center text-slate-400 mb-1">
                  <span className="font-bold text-purple-400">כורה ב׳ (נונס אי-זוגי):</span>
                  <span className="text-white font-bold">{blessingAttempt.nonceB.toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-slate-300 break-all" dir="ltr">
                  <span className={blessingAttempt.hashB.startsWith(targetPrefix) ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {blessingAttempt.hashB.slice(0, targetPrefix.length)}
                  </span>
                  <span>{blessingAttempt.hashB.slice(targetPrefix.length)}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Winner Banner (if result exists and matches target prefix) */}
        {result && result.winningHash.startsWith(targetPrefix) && !blessingAttempt && (
          <section className={`border rounded-2xl p-6 shadow-2xl relative overflow-hidden transition-all ${
            solomonTheme
              ? 'bg-gradient-to-r from-amber-950/50 via-slate-900 to-[#101728] border-amber-500/40'
              : 'bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-slate-800'
          }`}>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
              
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/40">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>
                    {language === 'he' ? 'הוכחת העבודה נמצאה בהצלחה!' : language === 'en' ? 'Proof of Work Found Successfully!' : 'הוכחת עבודה נמצאה • Proof-of-Work Solved!'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-[10px] font-mono">
                    {targetPrefix.length} Zeros
                  </span>
                </div>

                <h2 className="text-2xl lg:text-3xl font-extrabold text-white flex items-center gap-3">
                  <span className="text-amber-400">
                    {result.winner === 'Miner A' 
                      ? (language === 'en' ? 'Miner A' : 'כורה א׳ (זוגי) / Miner A') 
                      : (language === 'en' ? 'Miner B' : 'כורה ב׳ (אי-זוגי) / Miner B')}
                  </span>
                  <span>{language === 'en' ? 'Wins the Race!' : 'ניצח במרוץ!'}</span>
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                  {language === 'he' ? (
                    <>
                      נמצא גיבוב תקין המתחיל ב-<span className="font-mono text-emerald-400 font-bold">{targetPrefix}</span> עבור טקסט הבלוק{' '}
                      <span className="text-amber-300 font-bold font-mono">"{blockText}"</span> בנונס זוכה{' '}
                      <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {result.winningNonce.toLocaleString()}
                      </span>.
                    </>
                  ) : (
                    <>
                      Found valid SHA-256 hash starting with <span className="font-mono text-emerald-400 font-bold">{targetPrefix}</span> for block text{' '}
                      <span className="text-amber-300 font-bold font-mono">"{blockText}"</span> at winning nonce{' '}
                      <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {result.winningNonce.toLocaleString()}
                      </span>.
                    </>
                  )}
                </p>
              </div>

              {/* 4 Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                    {language === 'he' ? 'נונס זוכה' : language === 'en' ? 'Winning Nonce' : 'נונס זוכה / Nonce'}
                  </span>
                  <span className="text-lg font-mono font-black text-amber-400">{result.winningNonce.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 block">
                    {result.winningNonce % 2 === 0 ? 'זוגי (כורה א׳)' : 'אי-זוגי (כורה ב׳)'}
                  </span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                    {language === 'he' ? 'ניסיונות המנצח' : language === 'en' ? 'Winner Tries' : 'ניסיונות / Tries'}
                  </span>
                  <span className="text-lg font-mono font-black text-emerald-400">{result.winningTries.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 block">
                    {((result.winningTries / result.totalHashes) * 100).toFixed(1)}% {language === 'he' ? 'מסך הניסיונות' : 'of total'}
                  </span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                    {language === 'he' ? 'סה״כ גיבובים' : language === 'en' ? 'Total Hashes' : 'סה״כ / Total'}
                  </span>
                  <span className="text-lg font-mono font-black text-sky-400">{result.totalHashes.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 block">
                    {language === 'he' ? 'שני הכורים יחד' : 'Both miners'}
                  </span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                    {language === 'he' ? 'זמן חישוב' : language === 'en' ? 'Compute Time' : 'זמן / Time'}
                  </span>
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
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 overflow-x-auto max-w-full">
                <span className="text-xs font-semibold uppercase text-slate-400 whitespace-nowrap">
                  {language === 'he' ? 'הגיבוב הזוכה (SHA-256):' : language === 'en' ? 'Winning Hash (SHA-256):' : 'גיבוב זוכה / Winning Hash:'}
                </span>
                <span className="font-mono text-xs md:text-sm tracking-wide break-all" dir="ltr">
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
                <span>{copiedKey === 'winning_hash' ? (language === 'he' ? 'הועתק!' : 'Copied!') : (language === 'he' ? 'העתק גיבוב' : 'Copy Hash')}</span>
              </button>
            </div>
          </section>
        )}

        {/* Main Tab 1: Interactive Race Visualizer */}
        {activeTab === 'visualizer' && (
          <div className="space-y-6">
            
            {/* Control Panel: Race Configuration with Difficulty Dropdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>{language === 'he' ? 'הגדרות מרוץ הכרייה' : 'Proof-of-Work Race Configuration'}</span>
                    {language === 'bilingual' && <span className="text-xs text-slate-400 font-normal">/ PoW Settings</span>}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {language === 'he' 
                      ? 'בחר רמת קושי (כמות אפסים ב-Hash), הגדר טקסט והפעל מרוץ או בדיקת ניסיון ראשון.' 
                      : 'Choose difficulty level (leading zeros), configure payload, and start racing.'}
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  
                  {/* BLESSING BUTTON */}
                  <button
                    onClick={handleBlessingTry}
                    disabled={isRunning}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 hover:from-amber-500/30 hover:to-yellow-500/40 text-amber-300 text-xs font-bold border border-amber-400/50 shadow-md shadow-amber-500/10 transition active:scale-95 disabled:opacity-50"
                    title="מגריל מספר אקראי חד-פעמי עבור כל כורה לבדיקה האם מישהו מפצח בניסיון בודד"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                    <span>{language === 'he' ? 'ניסיון ראשון (ברכה)' : language === 'en' ? 'First Try (Blessing)' : 'ניסיון ראשון (ברכה) / Blessing'}</span>
                  </button>

                  <button
                    onClick={handleReset}
                    disabled={isRunning}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 disabled:opacity-50 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{language === 'he' ? 'איפוס' : language === 'en' ? 'Reset' : 'איפוס / Reset'}</span>
                  </button>

                  <button
                    onClick={handleStart}
                    disabled={isRunning}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50 transition active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>
                      {isRunning 
                        ? (language === 'he' ? 'הכרייה בפעולה...' : 'Mining in progress...')
                        : (language === 'he' ? 'התחל מרוץ כורים' : language === 'en' ? 'Start Miner Race' : 'התחל מרוץ / Start Race')}
                    </span>
                  </button>
                </div>
              </div>

              {/* Grid of inputs including Difficulty Dropdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                
                {/* 1. Block Payload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span>{language === 'he' ? 'טקסט הבלוק' : language === 'en' ? 'Block String' : 'טקסט הבלוק / Block String'}</span>
                    <span className="text-[10px] text-amber-400 font-mono">Payload</span>
                  </label>
                  <input
                    type="text"
                    value={blockText}
                    onChange={(e) => setBlockText(e.target.value)}
                    disabled={isRunning}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 transition"
                    placeholder="שבעה ימים בשבוע - חכמת שלמה"
                  />
                </div>

                {/* 2. DIFFICULTY DROPDOWN & DYNAMIC TARGET STRING */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>{language === 'he' ? 'רמת קושי (כמות אפסים)' : language === 'en' ? 'Difficulty Level' : 'רמת קושי / Difficulty'}</span>
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono font-bold">
                      {targetPrefix.length} Leading {targetPrefix.length === 1 ? 'Zero' : 'Zeros'}
                    </span>
                  </label>
                  
                  {/* Select Dropdown */}
                  <div className="relative">
                    <select
                      value={difficultySelectValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== 'custom') {
                          handleDifficultyChange(val);
                        } else {
                          setDifficultySelectValue('custom');
                        }
                      }}
                      disabled={isRunning}
                      className="w-full appearance-none px-3.5 py-2.5 bg-slate-950 border border-slate-700 hover:border-amber-500/60 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500 transition cursor-pointer pr-8"
                    >
                      {DIFFICULTY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200 py-1">
                          {language === 'he' 
                            ? `${opt.labelHe} — הסתברות ${opt.oddsHe}`
                            : language === 'en'
                            ? `${opt.labelEn} — Odds ${opt.oddsEn}`
                            : `${opt.labelHe} | ${opt.oddsEn}`}
                        </option>
                      ))}
                      <option value="custom" className="bg-slate-900 text-slate-200">
                        {language === 'he' ? 'התאמה אישית / קידומת ידנית...' : 'Custom Prefix / Manual Input...'}
                      </option>
                    </select>
                    <div className="absolute inset-y-0 end-0 flex items-center px-2.5 pointer-events-none text-slate-400">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* 3. Execution Mode */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span>{language === 'he' ? 'מצב הרצה' : language === 'en' ? 'Execution Mode' : 'מצב הרצה / Mode'}</span>
                    <span className="text-[10px] text-slate-500">{mode === 'instant' ? 'מהיר / Turbo' : 'מונפש / Live'}</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setMode('instant')}
                      disabled={isRunning}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition ${
                        mode === 'instant'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {language === 'he' ? 'מרוץ בזק' : language === 'en' ? 'Instant Turbo' : 'בזק / Turbo'}
                    </button>
                    <button
                      onClick={() => setMode('animated')}
                      disabled={isRunning}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition ${
                        mode === 'animated'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {language === 'he' ? 'מרוץ מונפש' : language === 'en' ? 'Animated Live' : 'מונפש / Animated'}
                    </button>
                  </div>
                </div>

              </div>

              {/* Dynamic Target String & Quick Difficulty Selector Row */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                
                {/* Target String Visual Preview */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400 font-medium">
                    {language === 'he' ? 'מחרוזת יעד דינמית:' : 'Dynamic Target String:'}
                  </span>
                  <div className="font-mono bg-slate-900 border border-slate-700/80 px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 shadow-inner" dir="ltr">
                    <span className="text-emerald-400 font-bold bg-emerald-950/80 px-1 py-0.5 rounded border border-emerald-500/40">
                      {targetPrefix || '0'}
                    </span>
                    <span className="text-slate-600 tracking-wider">
                      {'•'.repeat(Math.max(12, 32 - targetPrefix.length))}
                    </span>
                  </div>

                  <span className="text-[11px] text-amber-300/90 font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                    סיכוי: 1 ל-{currentOdds.toLocaleString()} ({((1 / currentOdds) * 100).toFixed(currentOdds > 100000 ? 6 : 4)}%)
                  </span>
                </div>

                {/* Quick 1-click pills for 2, 3, 4, 5 Zeros */}
                <div className="flex items-center gap-1.5 self-end md:self-auto">
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    {language === 'he' ? 'בחירה מהירה:' : 'Quick Select:'}
                  </span>
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleDifficultyChange(opt.value)}
                      disabled={isRunning}
                      className={`text-xs px-2.5 py-1 rounded-lg font-mono font-bold border transition ${
                        targetPrefix === opt.value
                          ? `${opt.badgeColor} ring-1 ring-amber-400/40`
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                      title={`${opt.zeros} Leading Zeros`}
                    >
                      {opt.zeros} Zeros
                    </button>
                  ))}
                </div>

              </div>

              {/* Custom manual input if "custom" selected */}
              {difficultySelectValue === 'custom' && (
                <div className="pt-2 flex items-center gap-3 text-xs bg-amber-500/5 p-3 rounded-xl border border-amber-500/20">
                  <span className="text-amber-300 font-medium">
                    {language === 'he' ? 'הזן קידומת יעד ידנית (Hex):' : 'Custom Target Hex Prefix:'}
                  </span>
                  <input
                    type="text"
                    value={targetPrefix}
                    onChange={handleCustomPrefixInput}
                    disabled={isRunning}
                    className="w-40 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg font-mono text-xs text-emerald-400 font-bold focus:outline-none focus:border-amber-500"
                    placeholder="e.g. 00000"
                    dir="ltr"
                  />
                  <span className="text-slate-400 font-mono text-[11px]">
                    אורך: {targetPrefix.length} תווים (1 ל-{(16 ** targetPrefix.length).toLocaleString()})
                  </span>
                </div>
              )}

              {/* Slider for animated speed */}
              {mode === 'animated' && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-4 text-xs">
                  <span className="text-slate-400 whitespace-nowrap">
                    {language === 'he' ? 'מהירות אנימציה:' : 'Animation Speed:'}
                  </span>
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
                  <span className="font-mono text-amber-400 font-bold w-24 text-right">{simSpeed} nonces/f</span>
                </div>
              )}
            </div>

            {/* Miners Side-by-Side Arena */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Miner A (Even Nonces) */}
              <div className={`rounded-2xl border p-5 transition-all relative overflow-hidden ${
                result?.winner === 'Miner A' && result.winningHash.startsWith(targetPrefix)
                  ? 'bg-emerald-950/25 border-emerald-500/60 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900 border-slate-800'
              }`}>
                {result?.winner === 'Miner A' && result.winningHash.startsWith(targetPrefix) && (
                  <div className="absolute top-0 end-0 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-bs-xl flex items-center gap-1 shadow-md">
                    <Award className="w-3.5 h-3.5 fill-current" />
                    <span>{language === 'he' ? 'מנצח!' : 'Winner!'}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <span>כורה א׳ / Miner A</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {language === 'he' ? 'נונסים זוגיים (0, 2, 4...)' : 'Even Nonces'}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      {language === 'he' ? 'נוסחת נונס:' : 'Nonce formula:'} <code className="text-slate-300 font-mono">2 × step</code>
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{language === 'he' ? 'נונסים שנבדקו:' : 'Tested Nonces:'}</span>
                      <span className="font-mono text-blue-300 font-bold">
                        {result && result.winningHash.startsWith(targetPrefix) ? result.triesA.toLocaleString() : currentStep.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{language === 'he' ? 'נונס אחרון:' : 'Last Nonce:'}</span>
                      <span className="font-mono text-white font-bold">
                        {result?.winner === 'Miner A' && result.winningHash.startsWith(targetPrefix)
                          ? result.winningNonce.toLocaleString() 
                          : ((currentStep * 2)).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      {language === 'he' ? 'גיבוב SHA-256 עדכני' : 'Current SHA-256 Digest'}
                    </span>
                    <p className="font-mono text-xs text-slate-300 break-all leading-relaxed" dir="ltr">
                      {minerAHash || (result?.winner === 'Miner A' && result.winningHash.startsWith(targetPrefix) ? result.winningHash : 'ממתין להתחלה...')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        isRunning ? 'bg-amber-400 animate-ping' : result?.winner === 'Miner A' && result.winningHash.startsWith(targetPrefix) ? 'bg-emerald-400' : 'bg-slate-600'
                      }`} />
                      <span>
                        {isRunning 
                          ? (language === 'he' ? 'מחשב נונסים זוגיים...' : 'Mining even nonces...') 
                          : result?.winner === 'Miner A' && result.winningHash.startsWith(targetPrefix)
                          ? (language === 'he' ? 'הבלוק נפתר בהצלחה!' : 'Block solved!') 
                          : (language === 'he' ? 'מוכן להפעלה' : 'Ready')}
                      </span>
                    </span>
                    <span className="font-mono text-slate-400">
                      {hashRate > 0 && isRunning ? `${Math.round(hashRate / 2).toLocaleString()} H/s` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Miner B (Odd Nonces) */}
              <div className={`rounded-2xl border p-5 transition-all relative overflow-hidden ${
                result?.winner === 'Miner B' && result.winningHash.startsWith(targetPrefix)
                  ? 'bg-emerald-950/25 border-emerald-500/60 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900 border-slate-800'
              }`}>
                {result?.winner === 'Miner B' && result.winningHash.startsWith(targetPrefix) && (
                  <div className="absolute top-0 end-0 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-bs-xl flex items-center gap-1 shadow-md">
                    <Award className="w-3.5 h-3.5 fill-current" />
                    <span>{language === 'he' ? 'מנצח!' : 'Winner!'}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <span>כורה ב׳ / Miner B</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {language === 'he' ? 'נונסים אי-זוגיים (1, 3, 5...)' : 'Odd Nonces'}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      {language === 'he' ? 'נוסחת נונס:' : 'Nonce formula:'} <code className="text-slate-300 font-mono">2 × step + 1</code>
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{language === 'he' ? 'נונסים שנבדקו:' : 'Tested Nonces:'}</span>
                      <span className="font-mono text-purple-300 font-bold">
                        {result && result.winningHash.startsWith(targetPrefix) ? result.triesB.toLocaleString() : currentStep.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{language === 'he' ? 'נונס אחרון:' : 'Last Nonce:'}</span>
                      <span className="font-mono text-white font-bold">
                        {result?.winner === 'Miner B' && result.winningHash.startsWith(targetPrefix)
                          ? result.winningNonce.toLocaleString() 
                          : ((currentStep * 2) + 1).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      {language === 'he' ? 'גיבוב SHA-256 עדכני' : 'Current SHA-256 Digest'}
                    </span>
                    <p className="font-mono text-xs text-slate-300 break-all leading-relaxed" dir="ltr">
                      {minerBHash || (result?.winner === 'Miner B' && result.winningHash.startsWith(targetPrefix) ? result.winningHash : 'ממתין להתחלה...')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        isRunning ? 'bg-amber-400 animate-ping' : result?.winner === 'Miner B' && result.winningHash.startsWith(targetPrefix) ? 'bg-emerald-400' : 'bg-slate-600'
                      }`} />
                      <span>
                        {isRunning 
                          ? (language === 'he' ? 'מחשב נונסים אי-זוגיים...' : 'Mining odd nonces...') 
                          : result?.winner === 'Miner B' && result.winningHash.startsWith(targetPrefix)
                          ? (language === 'he' ? 'הבלוק נפתר בהצלחה!' : 'Block solved!') 
                          : (language === 'he' ? 'מוכן להפעלה' : 'Ready')}
                      </span>
                    </span>
                    <span className="font-mono text-slate-400">
                      {hashRate > 0 && isRunning ? `${Math.round(hashRate / 2).toLocaleString()} H/s` : ''}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Cryptographic Verification Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  {language === 'he' ? 'אימות גיבוב מתמטי בזמן אמת' : 'Real-Time Cryptographic Verification'}
                </span>
                {language === 'bilingual' && <span className="text-xs text-slate-400 font-normal">/ SHA-256 Verifier</span>}
              </div>
              <p className="text-xs text-slate-400">
                {language === 'he'
                  ? 'שינוי תו בודד או ספרה בנונס משנה את הגיבוב מקצה לקצה (אפקט המפולת - Avalanche Effect).'
                  : 'Changing a single character or digit flips completely independent bits across the 256-bit digest.'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">{language === 'he' ? 'טקסט הבלוק' : 'Block String'}</label>
                  <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-300 truncate">
                    {blockText}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">{language === 'he' ? 'נונס לבדיקה' : 'Tested Nonce'}</label>
                  <input
                    type="text"
                    value={verifyNonce}
                    onChange={(e) => setVerifyNonce(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-xs text-amber-400 focus:outline-none focus:border-amber-500"
                    placeholder="Enter nonce..."
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">{language === 'he' ? 'סטטוס אימות' : 'Verification Status'}</label>
                  <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                    {verifiedHash.startsWith(targetPrefix) ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        {language === 'he' ? `הוכחת עבודה תקינה! (מתחיל ב-${targetPrefix})` : `Valid Proof of Work! (Starts with ${targetPrefix})`}
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        {language === 'he' ? `לא תקין (אינו מתחיל ב-${targetPrefix})` : `Invalid (Does not start with ${targetPrefix})`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {language === 'he' ? 'תוצאת הגיבוב המלאה (Hexadecimal):' : 'Full Computed Hex Digest:'}
                </span>
                <p className="font-mono text-xs break-all" dir="ltr">
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

        {/* Tab 2: Terminal Output */}
        {activeTab === 'terminal' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>{language === 'he' ? 'פלט הרצת סקריפט פייתון' : 'Python Execution Output'}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    פלט מלא מתוך פקודת <code className="text-emerald-400 font-mono">python3 bitcoin_race.py</code> ובדיקת <code className="text-emerald-400 font-mono">--blessing</code> ופרמטר <code className="text-emerald-400 font-mono">--difficulty=N</code>.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(
`=== Bitcoin 2-Miner Proof-of-Work Race ===
Block Text: 'שבעה ימים בשבוע - חכמת שלמה'
Target Prefix: '${targetPrefix}' (Difficulty: ${targetPrefix.length} leading hex zeros)

================ RESULTS ================
Winner:        Miner B
Winning Nonce: 1535
Final Hash:    000044e30462896bc5895257f5b0565526235cfffb2311e524318bef80f8a286
Tries by Miner B: 768
Total Hashes:  1536

=== ברכת ניסיון ראשון (חד-פעמי) ===
כורה א׳ (זוגי)   | נונס:  5272916 | גיבוב: 51605b40873f04c3...
כורה ב׳ (אי-זוגי)| נונס:  8214325 | גיבוב: a1f883305a045e6a...
[תוצאת ניסיון ראשון]: אף כורה לא פגע ביעד בניסיון בודד זה.
שלמה המלך לימדנו: 'עוֹבֵד אַדְמָתוֹ יִשְׂבַּע לָחֶם' — הוכחת עבודה דורשת התמדה!`, 'term_full')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-600 transition"
                >
                  {copiedKey === 'term_full' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'term_full' ? 'הועתק' : 'העתק פלט'}</span>
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 font-mono text-xs sm:text-sm text-emerald-400/95 leading-relaxed overflow-x-auto shadow-inner" dir="ltr">
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-800 text-slate-500 text-[11px]">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                  <span className="ml-2 text-slate-400">bash — python3 bitcoin_race.py --difficulty={targetPrefix.length}</span>
                </div>
                <pre className="whitespace-pre-wrap">
{`=== Bitcoin 2-Miner Proof-of-Work Race ===
Block Text / טקסט הבלוק: '${blockText}'
Target Prefix / קידומת יעד: '${targetPrefix}' (Difficulty: ${targetPrefix.length} leading hex zeros)
Miner A: testing even nonces (0, 2, 4, ...)
Miner B: testing odd nonces  (1, 3, 5, ...)

Target String: ${targetPrefix}${'•'.repeat(64 - targetPrefix.length)}
Mathematical Probability: 1 in ${currentOdds.toLocaleString()} per attempt.`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Python Code */}
        {activeTab === 'python_code' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-amber-400" />
                  <span>קוד מקור — bitcoin_race.py (כולל רמות קושי דינמיות)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  סקריפט פייתון מלא התומך בדגל <code className="text-amber-400 font-mono">--difficulty=N</code> ובדיקת ניסיון ראשון.
                </p>
              </div>

              <button
                onClick={() => handleCopy(PYTHON_SCRIPT_CODE, 'py_code_tab')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition"
              >
                {copiedKey === 'py_code_tab' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'py_code_tab' ? 'הועתק!' : 'העתק קוד פייתון'}</span>
              </button>
            </div>

            <pre className="p-5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed" dir="ltr">
              <code>{PYTHON_SCRIPT_CODE}</code>
            </pre>
          </div>
        )}

        {/* Tab 4: Theory */}
        {activeTab === 'theory' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>חכמת שלמה ועקרון הוכחת העבודה</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                שלמה המלך אמר: <em>"עוֹבֵד אַדְמָתוֹ יִשְׂבַּע לָחֶם וּמְרַדֵּף רֵיקִים חֲסַר לֵב"</em> (משלי י״ב, י״א). בביטקוין, רעיון הוכחת העבודה (Proof-of-Work) מבוסס על עמל חישובי אמיתי שלא ניתן לזייף.
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1" dir="ltr">
                <div className="text-amber-400 font-semibold">// Payload + Nonce in UTF-8</div>
                <div>"{blockText}" + Nonce</div>
                <div className="text-slate-500">↓ SHA-256 Engine</div>
                <div className="text-emerald-400 font-bold">{targetPrefix}{'•'.repeat(Math.max(10, 64 - targetPrefix.length))}</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>מדוע רמת הקושי משנה את זמני החישוב?</span>
              </h3>
              <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>
                    <strong>2 אפסים (00):</strong> סיכוי של $1/256$. נפתר תוך אלפית השנייה.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>
                    <strong>3 אפסים (000):</strong> סיכוי של $1/4,096$. נפתר תוך מספר מאיות שנייה.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>
                    <strong>4 אפסים (0000):</strong> סיכוי של $1/65,536$. תקן ברירת המחדל, נפתר תוך ~0.1 שניות.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>
                    <strong>5 אפסים (00000):</strong> סיכוי של $1/1,048,576$. דורש מעל מיליון חישובים (~1-2 שניות).
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 bg-slate-950">
        סימולטור מרוץ כורי ביטקוין בהשראת חכמת שלמה המלך • בחירת רמות קושי דינמיות
      </footer>
    </div>
  );
}
