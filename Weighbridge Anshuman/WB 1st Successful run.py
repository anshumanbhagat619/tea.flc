import serial
import time
import re
from collections import Counter

COM_PORT = 'COM3' 
BAUD_RATE = 1200  

try:
    weighbridge = serial.Serial()
    weighbridge.port = COM_PORT
    weighbridge.baudrate = BAUD_RATE
    weighbridge.timeout = 0.5
    weighbridge.open()
    print(f"Successfully connected on {COM_PORT}.")
except Exception as e:
    print(f"Connection failed: {e}")
    exit()

print("Live weight reading... (Press Ctrl+C to stop)")

while True:
    try:
        if weighbridge.is_open and weighbridge.in_waiting > 0:
            # 1. Grab raw stream and handle any hidden characters
            raw_data = weighbridge.read(weighbridge.in_waiting)
            text = raw_data.decode('ascii', errors='replace')
            
            # 2. Find all numeric values
            numbers = re.findall(r'\d+', text)
            
            if numbers:
                # 3. Find the most stable value
                most_common = Counter(numbers).most_common(1)[0][0]
                
                # --- SENIOR REVERSAL FIX ---
                # Fixed the bug where 105 became 501. Flip it back!
                corrected_str = most_common[::-1].lstrip('0')
                
                if not corrected_str:
                    print("Scale says: 0kg")
                else:
                    try:
                        raw_val = float(corrected_str)
                        
                        # --- UNIVERSAL ADAPTIVE SCALING ---
                        # 8+ digits -> Divide by 1M (High precision scale)
                        # < 7 digits -> Standard KG weight (105, 1783, 50000)
                        if len(corrected_str) >= 7:
                            final_weight = raw_val / 1000000
                        else:
                            final_weight = raw_val
                        
                        if final_weight.is_integer():
                            final_weight = int(final_weight)
                        else:
                            final_weight = round(final_weight, 1)

                        print(f"Scale says: {final_weight}kg")
                    except ValueError:
                        pass
                        
    except Exception as e:
        print(f"Lost connection: {e}")
        break 
        
    time.sleep(0.1)