# DevDrop Security Policy & Non-Malicious Software Declaration

## Safe Software Declaration

DevDrop is an open-source, local-network file and clipboard synchronization tool created by [Debanjan](https://github.com/Debanjan110d). It is engineered strictly to operate within your private local area network (LAN / Wi-Fi).

DevDrop is **NOT** malware, spyware, adware, or a remote access trojan (RAT):
- **Zero Remote Code Execution (RCE):** The application cannot execute arbitrary commands from remote endpoints.
- **Zero Cloud Relay / Zero Telemetry:** DevDrop connects only to local IP addresses on your private subnet (RFC 1918: `192.168.0.0/16`, `10.0.0.0/8`, `172.16.0.0/12`). No usage analytics, telemetry, or user data are transmitted outside your Wi-Fi router.
- **No Keystroke Logging:** The Quick Text utility transfers only explicitly typed or pasted text that the user deliberately sends. It does not monitor background typing or system keystrokes.
- **Explicit User Consent:** Transfers require user-initiated selection or QR-based pairing authorization.

---

## Android Permissions Transparency

DevDrop requests specific Android permissions strictly for core functionality:

| Permission | Purpose | Why It Is Safe |
| :--- | :--- | :--- |
| `INTERNET` | Communication with devices on the same Wi-Fi router | Restrictive use: only communicates across private LAN IP addresses |
| `ACCESS_NETWORK_STATE` | Detects Wi-Fi connection and subnet range | Used only to discover local DevDrop peers via ping sweeps |
| `CAMERA` | Scan pairing QR codes from PC or other phones | Camera preview runs locally via Expo Camera; no photos or video streams are saved or transmitted |
| `READ_MEDIA_*` / Storage | Read user-selected files to transfer and save received files | Saves strictly to the user-accessible `Downloads/DevDrop` folder |
| `REQUEST_INSTALL_PACKAGES` | Allows users to install in-app APK updates directly | Triggers the standard native Android package installer dialog via `FileProvider` with user confirmation |

---

## Independent Network Audit Guide

Anyone can verify DevDrop's local-only behavior using standard network packet capture tools such as Wireshark or tcpdump:

1. Connect your PC and phone to the same Wi-Fi network.
2. Start Wireshark on your PC and filter by `ip.addr == <Phone_IP>`.
3. Transfer files and send quick text between devices.
4. You will observe direct HTTP streaming on ports `5000` (PC) and `4545` (Phone).
5. Filter by DNS (`dns`) or non-local IP ranges to confirm that zero outbound external internet traffic is produced by DevDrop.

---

## Reporting Vulnerabilities

If you identify a security issue, please open an issue or pull request directly at the official GitHub repository:
- **Repository:** [https://github.com/Debanjan110d/DevDrop](https://github.com/Debanjan110d/DevDrop)
- **Maintainer:** [@Debanjan110d](https://github.com/Debanjan110d)

