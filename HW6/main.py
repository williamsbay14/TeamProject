import os
import sys
import http.server
import socketserver
import csv
from flask import Flask, request, render_template, redirect, url_for, jsonify, json
from werkzeug.utils import secure_filename
import util
from flask_cors import CORS
import pandas as pd

class HTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        http.server.SimpleHTTPRequestHandler.end_headers(self)


def server(port):
    httpd = socketserver.TCPServer(('', port), HTTPRequestHandler)
    return httpd


# get current app directory
dir_path = os.path.dirname(os.path.realpath(__file__))
UPLOAD_FOLDER = dir_path + '/uploads/'
app = Flask(__name__)
cors = CORS(app, resources={r"/api/upload": {"origins": "*"}})
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Returns index template when index is loaded


# Saves files to upload directory
@app.route('/api/upload', methods=['POST'])
def upload_file():
    if request.method == 'POST':
        # Checks to make sure file was submitted
        if 'file' not in request.files:
            return json.dumps({
                'status': 'error',
                'message': 'File not available in request'
            })

        # Sets file
        file = request.files['file']

        # Invalid filename
        if file.filename == '':
            return json.dumps({
                'status': 'error',
                'message': 'Invalid file name'
            })

        if file and util.allowed_file(file.filename):

            # Generates filename and filepath for file
            filename = secure_filename(file.filename)
            if os.path.exists(app.config['UPLOAD_FOLDER']) == False:
                os.makedirs(app.config['UPLOAD_FOLDER'])
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

            try:
                # Saves file to server
                file.save(filepath)

                # Opens file for reading
                f = open(filepath)
                reader = csv.DictReader(f)

                # Returns JSON object of CSV file
                name, extension = os.path.splitext(file.filename)
                size = os.path.getsize(filepath)
                return json.dumps({
                    'header': 'Access-Control-Allow-Origin: *',
                    'status': 'success',
                    'file': {
                        'name': name,
                        'extension': extension,
                        'size': util.convert_size(size)
                    },
                    'data': [row for row in reader]
                })
            except FileNotFoundError:
                return json.dumps({
                    'status': 'error',
                    'message': 'File unable to be saved to server'
                })
        else:
            return json.dumps({
                'status': 'error',
                'message': 'Invalid filetype'
            })
        
@app.route("/")
def getdata():
    try:
        df = pd.read_csv("./uploads/NRDC_data.csv")
        df = df.head(n=5)
        temp = df.to_dict('records')
        columnNames = df.columns.values
        return render_template('index.html', records=temp, colnames=columnNames)
    except:
        return render_template('index.html')



@app.route('/', methods=['GET'])
def render_app():
    return render_template('index.html')

if __name__ == '__main__':
    app.debug = True
    ip = '127.0.0.1' or 'localhost'
    app.run(host=ip)
