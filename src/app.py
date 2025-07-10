from flask import Flask, render_template, request, redirect, url_for, jsonify
from parser import Parser
import os

app = Flask(__name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return redirect(request.url)
    file = request.files['file']
    if file.filename == '':
        return redirect(request.url)
    if file:
        file_path: str = os.path.join(UPLOAD_FOLDER, file.filename)
        try:
            file.save(file_path)
            parser = Parser(file_path)
            summary = parser.get_summary()
            return render_template('results.html', 
                                  summary=summary, 
                                  filename=file.filename)
        except FileNotFoundError:
            return "File not found", 404
    print("No file part in the request or no file selected.")
    return redirect(request.url)

def create_folders():
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)

if __name__ == '__main__':
    create_folders()
    app.run(debug=True)