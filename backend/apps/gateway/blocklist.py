"""
In-Memory High-Performance DNS AdBlock & Telemetry Blocklist.
Matches exact domains and subdomains against ad, tracker, and telemetry providers.
"""
from typing import Tuple, Optional

BLOCKED_DOMAINS = {
    # Telemetry
    'telemetry.samsung.com': 'telemetry',
    'samsungcloudplatform.com': 'telemetry',
    'telemetry.microsoft.com': 'telemetry',
    'vortex.data.microsoft.com': 'telemetry',
    'metrics.icloud.com': 'tracker',
    'diag.apple.com': 'telemetry',
    'iadsdk.apple.com': 'ad',
    'telemetry.nvidia.com': 'telemetry',

    # Advertisements
    'googleads.g.doubleclick.net': 'ad',
    'adservice.google.com': 'ad',
    'pagead2.googlesyndication.com': 'ad',
    'doubleclick.net': 'ad',
    'ads.pubmatic.com': 'ad',
    'adnxs.com': 'ad',
    'criteo.com': 'ad',
    'rubiconproject.com': 'ad',
    'outbrain.com': 'ad',
    'taboola.com': 'ad',

    # Trackers & Analytics
    'analytics.tiktok.com': 'tracker',
    'pixel.facebook.com': 'tracker',
    'graph.facebook.com': 'tracker',
    'app-measurement.com': 'tracker',
    'amplitude.com': 'tracker',
    'segment.io': 'tracker',
    'mixpanel.com': 'tracker',
    'hotjar.com': 'tracker',
    'clarity.ms': 'tracker',

    # Malware & Phishing indicators
    'malware-test.net': 'malware',
    'phishing-simulation.internal': 'malware',
}

def is_domain_blocked(domain: str) -> Tuple[bool, Optional[str]]:
    """
    Checks if a domain or its parent domain is on the blocklist.
    Returns (is_blocked, category).
    """
    clean_domain = domain.strip().lower().rstrip('.')

    # Exact match
    if clean_domain in BLOCKED_DOMAINS:
        return True, BLOCKED_DOMAINS[clean_domain]

    # Subdomain matching (e.g. sub.doubleclick.net matches doubleclick.net)
    parts = clean_domain.split('.')
    for i in range(1, len(parts) - 1):
        parent = '.'.join(parts[i:])
        if parent in BLOCKED_DOMAINS:
            return True, BLOCKED_DOMAINS[parent]

    return False, None
