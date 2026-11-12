# ⛏️ Bitcoin Mining Race (`bitcoin-mining-race`)

An interactive Bitcoin Proof-of-Work (PoW) simulator and real-time SHA-256 visualization tool built in Google AI Studio. Watch two competing miners race to discover a valid winning nonce under adjustable network difficulty rules.

## 🚀 Features

* **2-Miner Proof-of-Work Race:** Simulates Miner A (testing even nonces) vs. Miner B (testing odd nonces) racing to solve a cryptographic puzzle.
* **Real-Time SHA-256 Verification:** Instantly computes and verifies 64-character hexadecimal SHA-256 hashes.
* **Custom Block Payloads:** Test any text string (default: `"King Solomon: 7 days in a week"`) to observe how changing a single character completely alters the resulting hash (**the avalanche effect**).
* **Adjustable Target Difficulty:** Modify the required leading hex zeros (e.g., `000`, `0000`, `00000`) to see how mining attempts and time scale exponentially.
* **Live Race Metrics:** Tracks winning nonce, attempts per miner, total hashes computed, elapsed time, and hash rate (H/s).

## 🧠 Core Cryptographic Concepts Demonstrated

1. **Determinism:** Identical block text + nonce inputs always produce the exact same SHA-256 output across any tool or machine.
2. **The Avalanche Effect:** Altering a single letter or digit completely scrambles the hash output and invalidates leading zeros.
3. **Proof-of-Work (Nonce Discovery):** Finding a hash below a target difficulty requires brute-force trial and error, while verifying the winning hash takes a single instant calculation.

## 🛠️ Built With

* **Python / Web Preview** via Google AI Studio
* Standard **SHA-256** cryptographic hashing
