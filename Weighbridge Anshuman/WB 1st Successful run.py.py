import serial
import time
import re

COM_PORT = 'COM3' 
BAUD_RATE = 1200  

try:
    weighbridge = serial.Serial()
    weighbridge.port = COM_PORT
    weighbridge.baudrate = BAUD_RATE
    weighbridge.timeout = 1
    weighbridge.setDTR(False)
    weighbridge.setRTS(False)
    weighbridge.open()
    print(f"Successfully connected on {COM_PORT}.")
except Exception as e:
    print(f"Connection failed: {e}")
    exit()

print("Live weight reading... (Press Ctrl+C to stop)")

while True:
    try:
        if weighbridge.isOpen() and weighbridge.in_waiting > 0:
            
            # 1. Grab the raw data
            raw_bytes = weighbridge.read(weighbridge.in_waiting)
            clean_text = raw_bytes.decode('ascii', errors='ignore')
            
            # 2. Find EVERY group of numbers in that chunk of data
            numbers = re.findall(r'\d+', clean_text)
            
            if numbers:
                # 3. Grab the longest continuous number block 
                # (e.g., if it sees '0', '0800', and '80', it grabs '0800')
                longest_number = max(numbers, key=len)
                
                # 4. Filter out random single-digit electrical noise
                if len(longest_number) >= 2:
                    
                    # Convert '0800' to 80.0 kg, or '00' to 0.0 kg
                    try:
                        final_weight = float(longest_number) / 10 
                        print(f"Scale says: {final_weight} kg")
                    except ValueError:
                        pass
                        
    except Exception as e:
        print(f"Lost connection: {e}")
        break 
        
    # Wait half a second before checking the cable again
    time.sleep(0.5)