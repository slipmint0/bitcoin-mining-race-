import hashlib
import time

def simulate_bitcoin_race(block_text="King Solomon: 7 days in a week", target_prefix="0000"):
    print(f"=== Bitcoin 2-Miner Proof-of-Work Race ===")
    print(f"Block Text: '{block_text}'")
    print(f"Target Prefix: '{target_prefix}' (Difficulty: {len(target_prefix)} leading hex zeros)")
    print(f"Miner A: testing even nonces (0, 2, 4, ...)")
    print(f"Miner B: testing odd nonces  (1, 3, 5, ...)\n")

    start_time = time.time()
    tries_a = 0
    tries_b = 0
    nonce = 0
    winner = None
    winning_nonce = None
    winning_hash = None
    winning_tries = 0

    # Simulate step-by-step round-robin race between Miner A and Miner B
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

    print(f"================ RESULTS ================")
    print(f"Winner:        {winner}")
    print(f"Winning Nonce: {winning_nonce}")
    print(f"Final Hash:    {winning_hash}")
    print(f"Tries by {winner}: {winning_tries}")
    print(f"Total Hashes:  {total_hashes} (Miner A: {tries_a}, Miner B: {tries_b})")
    print(f"Time Taken:    {elapsed:.4f} seconds")
    print(f"Hash Rate:     {total_hashes / (elapsed if elapsed > 0 else 0.0001):,.0f} H/s")
    print(f"=========================================\n")

    return {
        "winner": winner,
        "winning_nonce": winning_nonce,
        "winning_hash": winning_hash,
        "winning_tries": winning_tries,
        "tries_a": tries_a,
        "tries_b": tries_b,
        "total_hashes": total_hashes,
        "time_taken": elapsed
    }

if __name__ == "__main__":
    simulate_bitcoin_race()
