from flask import Flask, render_template, request, redirect, url_for, jsonify
from parser import Parser
import requests
import os

app = Flask(__name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
current_file_path = None  # Store the current file path globally for API access

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    global current_file_path
    if 'file' not in request.files:
        return redirect(request.url)
    file = request.files['file']
    if file.filename == '':
        return redirect(request.url)
    if file:
        file_path: str = os.path.join(UPLOAD_FOLDER, file.filename)
        try:
            file.save(file_path)
            current_file_path = file_path  # Store path for API access
            return render_template('analytics.html', filename=file.filename)
        except FileNotFoundError:
            return "File not found", 404
    return redirect(request.url)

@app.route('/api/summary', methods=['GET'])
def get_summary():
    global current_file_path
    if current_file_path:
        parser = Parser(current_file_path)
        summary = parser.get_summary()
        return jsonify(summary)
    else:
        return jsonify({"error": "No file has been uploaded"}), 400

def create_folders():
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)

if __name__ == '__main__':
    create_folders()
    app.run(debug=True)