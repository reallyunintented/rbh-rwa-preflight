# REVIEW-2 (M3a decoder)

Attempted bypasses: extra commands, truncated inputs, odd lengths, wrong codehash, unsupported command. Decoder returns TX_FORMAT_UNSUPPORTED or CODEHASH_UNKNOWN; no crash in 200-iteration fuzz. No READY path without decoder result.
