import http.server
import socketserver
import os
import webbrowser
import threading
import time

PORT = 8000

# 获取当前目录
current_dir = os.path.dirname(os.path.abspath(__file__))

# 更改工作目录到当前目录
os.chdir(current_dir)

# 创建请求处理器
Handler = http.server.SimpleHTTPRequestHandler

# 创建服务器
with socketserver.TCPServer(('', PORT), Handler) as httpd:
    print(f"Flappy Bird Web Server started at http://localhost:{PORT}")
    print("Press Ctrl+C to stop the server")
    
    # 在新线程中打开浏览器
    def open_browser():
        time.sleep(1)  # 等待服务器启动
        webbrowser.open(f'http://localhost:{PORT}')
    
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    try:
        # 启动服务器
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        httpd.server_close()

print("Thank you for playing Flappy Bird!")