# -*- coding: utf-8 -*-
import hashlib
import time

def simulate_bitcoin_race(block_text="שבעה ימים בשבוע - חכמת שלמה", target_prefix="0000"):
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

def simulate_blessing_attempt(block_text="שבעה ימים בשבוע - חכמת שלמה", target_prefix="0000"):
    import random
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
        print(f"\n✨ נס שלמה המלך! כורה א׳ פיצח את ה-Hash בניסיון בודד ראשון! (נונס: {nonce_a}) ✨")
        return "Miner A"
    elif hash_b.startswith(target_prefix):
        print(f"\n✨ נס שלמה המלך! כורה ב׳ פיצח את ה-Hash בניסיון בודד ראשון! (נונס: {nonce_b}) ✨")
        return "Miner B"
    else:
        print("\n[תוצאת ניסיון ראשון]: אף כורה לא פגע ביעד בניסיון בודד זה.")
        print("שלמה המלך לימדנו: 'עוֹבֵד אַדְמָתוֹ יִשְׂבַּע לָחֶם' — הוכחת עבודה אמיתית דורשת התמדה וסריקה מלאה!")
        return None

if __name__ == "__main__":
    import sys
    prefix = "0000"
    for arg in sys.argv:
        if arg.startswith("--difficulty="):
            zeros = int(arg.split("=")[1])
            prefix = "0" * zeros
    if "--blessing" in sys.argv:
        simulate_blessing_attempt(target_prefix=prefix)
    else:
        simulate_bitcoin_race(target_prefix=prefix)
