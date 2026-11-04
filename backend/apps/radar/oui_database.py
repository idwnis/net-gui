"""
IEEE OUI (Organizationally Unique Identifier) Hardware Vendor Database.
Maps MAC prefix (first 3 octets / 24 bits) to device vendor name.
"""
from typing import Optional

# Standard OUI prefix table (Upper-case hex without separators)
OUI_DATABASE = {
    # Apple, Inc.
    '3C0630': 'Apple, Inc.',
    'F01898': 'Apple, Inc.',
    'ACDE48': 'Apple, Inc.',
    'BC9FEF': 'Apple, Inc.',
    '7081EB': 'Apple, Inc.',
    'A483E7': 'Apple, Inc.',
    '147DD7': 'Apple, Inc.',
    '286AB8': 'Apple, Inc.',
    'F84D89': 'Apple, Inc.',
    'A8667F': 'Apple, Inc.',

    # AsusTek
    'E4C32A': 'AsusTek Computer',
    '001E8C': 'AsusTek Computer',
    '04D9F5': 'AsusTek Computer',
    '2C4D54': 'AsusTek Computer',
    'AC9E17': 'AsusTek Computer',

    # Raspberry Pi Foundation
    'DCA632': 'Raspberry Pi Foundation',
    'B827EB': 'Raspberry Pi Foundation',
    'E45F01': 'Raspberry Pi Foundation',
    '28CDC1': 'Raspberry Pi Foundation',

    # Samsung Electronics
    'BCD074': 'Samsung Electronics',
    '0007AB': 'Samsung Electronics',
    'E47CF9': 'Samsung Electronics',
    '508569': 'Samsung Electronics',
    'AC5F3E': 'Samsung Electronics',

    # Espressif Inc. (ESP32, ESP8266 IoT)
    '30AEA4': 'Espressif Inc.',
    '240AC4': 'Espressif Inc.',
    '84F3EB': 'Espressif Inc.',
    'A4CF12': 'Espressif Inc.',
    'B4E62D': 'Espressif Inc.',
    'ECFABC': 'Espressif Inc.',

    # Canon, Inc.
    '001E8F': 'Canon, Inc.',
    '70B3D5': 'Canon, Inc.',
    '000085': 'Canon, Inc.',

    # Google LLC
    'A47733': 'Google LLC',
    '546009': 'Google LLC',
    'F4F5D8': 'Google LLC',
    'D86C63': 'Google LLC',

    # Intel Corporate
    '001B21': 'Intel Corporate',
    'A44CC8': 'Intel Corporate',
    '6805CA': 'Intel Corporate',

    # TP-Link
    '50C7BF': 'TP-Link Corporation',
    'EC086B': 'TP-Link Corporation',
    '003192': 'TP-Link Corporation',

    # Amazon Technologies
    'FC65DE': 'Amazon Technologies',
    '44650D': 'Amazon Technologies',
    '74C246': 'Amazon Technologies',

    # Sony Corporation
    'F8461C': 'Sony Interactive Entertainment',
    '709E29': 'Sony Corporation',

    # LG Electronics
    '58A2B5': 'LG Electronics',
    '001C62': 'LG Electronics',

    # Cisco Systems
    '00000C': 'Cisco Systems',
    '000142': 'Cisco Systems',
    '001D45': 'Cisco Systems',
}

def lookup_vendor(mac_address: str) -> str:
    """
    Looks up vendor name from MAC address using OUI table.
    Gracefully handles common separators (: - .) and casing.
    """
    if not mac_address:
        return 'Unknown Vendor'

    clean_mac = mac_address.replace(':', '').replace('-', '').replace('.', '').upper()
    if len(clean_mac) >= 6:
        prefix = clean_mac[:6]
        return OUI_DATABASE.get(prefix, 'Generic Network Device')
    return 'Unknown Vendor'
