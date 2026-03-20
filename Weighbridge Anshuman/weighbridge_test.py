import serial
import time
import re
from collections import Counter

COM_PORT = 'COM3' 
BAUD_RATE = 1200  

try:
    weighbridge = serial.Serial(port=COM_PORT, baudrate=BAUD_RATE, timeout=1)
    weighbridge.setDTR(False)
    weighbridge.setRTS(False)
    print(f"Successfully connected on {COM_PORT}.")
except Exception as e:
    print(f"Connection failed: {e}")
    exit()

print("Live weight reading... (Press Ctrl+C to stop)")

while True:
    try:
        if weighbridge.isOpen() and weighbridge.in_waiting > 0:
            
            raw_bytes = weighbridge.read(weighbridge.in_waiting)
            
            # 1. Swap invisible symbols with '?' so the numbers don't mash together
            clean_text = raw_bytes.decode('ascii', errors='replace')
            
            # 2. Find all blocks of numbers that are at least 2 digits long
            numbers = re.findall(r'\d{2,}', clean_text)
            
            if numbers:
                # 3. Look at all the fragments we caught and find the most common one.
                # If we caught ['550', '550', '55', '550'], it ignores the '55' and picks '550'.
                most_common_number = Counter(numbers).most_common(1)[0][0]
                
                # 4. Convert '550' to 55.0 kg
                try:
                    final_weight = float(most_common_number) / 10
                    print(f"ERP Weight: {final_weight} kg")
                except ValueError:
                    pass
                    
    except Exception as e:
        print(f"Lost connection: {e}")
        break 
        
    time.sleep(0.5)
