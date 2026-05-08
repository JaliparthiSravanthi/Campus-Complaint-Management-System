from flask import Flask, request, jsonify
from flask_cors import CORS
import hashlib
import time
from flask import Flask, request, jsonify, render_template
import sqlite3

app = Flask(__name__)
CORS(app)
def get_db():
    conn = sqlite3.connect("complaints.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = sqlite3.connect('complaints.db')
    cursor = conn.cursor()

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS complaints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT,
        severity TEXT,
        status TEXT
    )
    ''')

    conn.commit()
    conn.close()
init_db()

@app.route('/')
def home():
    return render_template('student.html')
complaints = []
import json

@app.route('/submit', methods=['POST'])
def submit():
    try:
        text = request.form.get('description')

        print("Received:", text)

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            "INSERT INTO complaints (text, severity, status) VALUES (?, ?, ?)",
            (text, "high", "pending")
        )

        conn.commit()
        conn.close()

        return jsonify({"message": "Complaint saved"})

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/complaints', methods=['GET'])
def get_complaints():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM complaints")
    rows = cursor.fetchall()

    conn.close()

    complaints = []
    for row in rows:
        complaints.append({
            "id": row["id"],
            "text": row["text"],
            "severity": row["severity"],
            "status": row["status"]
        })

    print("Fetched:", complaints)  # DEBUG

    return jsonify(complaints)

# 🔐 Generate hash (Blockchain concept)
def generate_hash(data):
    return hashlib.sha256(data.encode()).hexdigest()

# 🧠 Simple NLP logic
def get_priority(description):
    description = description.lower()
    if "urgent" in description or "danger" in description or "immediately" in description:
        return "High"
    return "Normal"

# 📌 API 1: Submit Complaint

def submit_complaint():
    if not data or 'description' not in data:
            return jsonify({
    "message": "Complaint submitted successfully",
    "data": complaint
})
    data = request.json

    priority = get_priority(data['description'])

    prev_hash = complaints[-1]['hash'] if complaints else "0"
    new_hash = generate_hash(data['description'] + prev_hash)

    complaint = {
        "id": len(complaints) + 1,
        "name": data['name'],
        "category": data['category'],
        "description": data['description'],
        "priority": priority,
        "status": "Pending",
        "hash": new_hash,
        "prev_hash": prev_hash,
        "time": time.time()
    }

    complaints.append(complaint)

    return jsonify({
        "message": "Complaint submitted successfully",
        "data": complaint
    })

# 📌 API 2: Get All Complaints
'''@app.route('/complaints', methods=['GET'])
def get_complaints():
    return jsonify(complaints)'''

# 📌 API 3: Escalation Logic
@app.route('/escalate', methods=['GET'])
def escalate():
    current_time = time.time()

    for complaint in complaints:
        if complaint['status'] == "Pending":
            if current_time - complaint['time'] > 30:  # 30 seconds
                complaint['status'] = "Escalated"

    return jsonify({"message": "Escalation checked", "data": complaints})

# ▶️ Run Server
if __name__ == '__main__':
    app.run(debug=True)