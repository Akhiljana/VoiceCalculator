# Voice Calculator

A production-ready voice-activated calculator built with FastAPI, HTML/JS/CSS, and Python.

## Features
- Voice recognition to dictate math problems
- Safe math expression parsing
- Fallback keyboard input
- Calculation history (SQLite)
- Windows Auto-Start mechanism

## Installation

1. Make sure Python 3.11+ is installed.
2. Clone or download this project.
3. You do not need to manually install dependencies. The startup script handles it.

## First Run

1. Navigate to the `scripts` folder.
2. Double-click `start.bat`.
3. The script will create a virtual environment, install dependencies, and launch the server.
4. The browser will open automatically at `http://127.0.0.1:8000/`.

## Normal Use

Click the **START LISTENING** button and speak your calculation, e.g., "twenty five plus ten".
The application will process your voice and display/speak the result.

## Auto Start

To make the Voice Calculator start automatically when Windows starts:
1. Double-click `scripts/setup_autostart.bat`.
2. This creates a shortcut in your Windows Startup folder.

## Stop Server

To completely stop the background server:
1. Double-click `scripts/stop.bat`.

## Troubleshooting

- **Microphone permission**: Ensure your browser has permission to use the microphone. Check the icon in your address bar.
- **Python not found**: Make sure Python is added to your PATH environment variable.
- **Port already in use**: The script defaults to 8000. Edit `.env` and `start.bat` if you need to change it.
