import sys
import json
import subprocess
import os
import re

NOTEBOOK_ID = "53e585fb-63e8-4432-b245-db2584895a6e"
SERVER_CMD = ["/Users/shakhgildyangy/.venv/bin/python", "-m", "notebooklm_mcp.server"]

CONSULTANT_PERSONA = """
Отвечай как профессиональный консультант по учету НИОКР и налогообложению. 
Твой тон: практичный, экспертный, помогающий решить проблему. 
Используй четкую структуру: заголовки (###), списки и абзацы.
ВАЖНО: 
1. Не используй ссылки в формате [1], [2] и т.д. в самом тексте.
2. Давай практические советы ("Что делать").
3. Если вопрос касается налогов, упоминай риски или льготы.
4. Если пользователь задает уточняющий вопрос, отвечай в контексте предыдущего диалога.

Запрос пользователя: 
"""

def clean_text(text):
    # Fix double-escaped newlines and tabs
    text = text.replace('\\n', '\n').replace('\\r', '').replace('\\t', '\t')
    
    # Try to find a JSON-like structure that contains an "answer" field
    # Search for the most nested answer if multiple exist
    if '"answer":' in text or "'answer':" in text:
        try:
            # Find all potential JSON starts
            matches = list(re.finditer(r'\{', text))
            for m in reversed(matches):
                json_part = text[m.start():]
                braces = 0
                end_pos = -1
                for i, char in enumerate(json_part):
                    if char == '{': braces += 1
                    elif char == '}': 
                        braces -= 1
                        if braces == 0:
                            end_pos = i + 1
                            break
                if end_pos != -1:
                    try:
                        data = json.loads(json_part[:end_pos])
                        if isinstance(data, dict) and "answer" in data:
                            return clean_text(data["answer"])
                    except:
                        continue
        except Exception:
            pass
    
    # Remove citations like [1], [1, 2], [1-3]
    text = re.sub(r'\[\d+(?:,\s*\d+)*\]', '', text)
    text = re.sub(r'\[\d+-\d+\]', '', text)
    
    # Clean up JSON-like literals and trailing metadata
    text = re.sub(r'\{"status":"success",\s*"answer":"', '', text)
    text = re.sub(r'","conversation_id":"[^"]*"\}', '', text)
    text = text.replace('{"status":"success","answer":"', '')
    
    return text.strip()

def run_query(query_text, conversation_id=None):
    # Wrap query with persona
    full_query = CONSULTANT_PERSONA + query_text

    # Try different ways to launch the server
    # 1. Try CLI command (installed via pip)
    # 2. Fall back to module execution if CLI not found
    python_path = sys.executable
    
    # First, try to find the CLI command in the same directory as python
    import shutil
    cli_cmd = shutil.which("notebooklm-mcp") or shutil.which("notebooklm-mcp-server")
    
    if cli_cmd:
        cmd = [cli_cmd]
    else:
        # Fallback to module execution
        cmd = [python_path, "-m", "notebooklm_mcp"]

    # Pass environment variables (including potential NOTEBOOKLM_COOKIES)
    env = os.environ.copy()

    process = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,  # Capture stderr for debugging
        env=env,
        text=True,
        bufsize=0
    )

    # Check if process started successfully
    if not process or not process.stdin or not process.stdout:
        return {"error": "Failed to start notebooklm-mcp server"}
    
    # Give process a moment to fail if it's going to
    import time
    time.sleep(0.5)
    
    # Check if process is still alive
    if process.poll() is not None:
        # Process already exited
        stderr_output = process.stderr.read() if process.stderr else "No stderr"
        return {"error": f"Process exited immediately with code {process.returncode} | stderr: {stderr_output}"}

    try:
        # 1. Initialize
        process.stdin.write(json.dumps({
            "jsonrpc": "2.0", "id": 1, "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05", "capabilities": {},
                "clientInfo": {"name": "rd-consultant-client", "version": "1.0"}
            }
        }) + "\n")
        process.stdin.flush()

        while True:
            line = process.stdout.readline()
            if not line: break
            try:
                resp = json.loads(line)
                if resp.get("id") == 1:
                    process.stdin.write(json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized", "params": {}}) + "\n")
                    process.stdin.flush()
                    break
            except: continue

        # 2. Call Tool
        args = {"notebook_id": NOTEBOOK_ID, "query": full_query}
        if conversation_id:
            args["conversation_id"] = conversation_id

        process.stdin.write(json.dumps({
            "jsonrpc": "2.0", "id": 2, "method": "tools/call",
            "params": {
                "name": "notebook_query",
                "arguments": args
            }
        }) + "\n")
        process.stdin.flush()

        while True:
            line = process.stdout.readline()
            if not line: break
            try:
                resp = json.loads(line)
                if resp.get("id") == 2:
                    if "error" in resp: return {"error": str(resp["error"])}
                    
                    result_data = resp.get("result", {})
                    content = result_data.get("content", [])
                    text = "".join([i.get("text", "") for i in content if i.get("type") == "text"])
                    
                    # Also try to get conversation_id from result if it's there
                    resp_conv_id = result_data.get("conversation_id")
                    
                    return {
                        "answer": clean_text(text),
                        "conversation_id": resp_conv_id
                    }
            except: continue

    except Exception as e:
        # Try to read stderr for more details
        error_msg = str(e)
        if process and process.stderr:
            try:
                stderr_output = process.stderr.read()
                if stderr_output:
                    error_msg = f"{error_msg} | stderr: {stderr_output}"
            except:
                pass
        return {"error": error_msg}
    finally:
        if process:
            process.terminate()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No query provided"}))
        sys.exit(1)
        
    query = sys.argv[1]
    conv_id = sys.argv[2] if len(sys.argv) > 2 else None
    
    result = run_query(query, conv_id)
    print(json.dumps(result, ensure_ascii=False))
