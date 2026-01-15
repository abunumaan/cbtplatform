import random
import os
from datetime import datetime
from flask import Flask, jsonify, request, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = 'some_random_string_here'

# 1. THE CLOUD CONNECTION (Using your specific Neon string)
# Note: I added the 'ql' to postgresql as required by SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://neondb_owner:npg_zEZgbo6KT2wf@ep-silent-field-ahpqp467-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# This allows cookies to be shared across ports
app.config.update(
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_COOKIE_HTTPONLY=True,
)

# 2. INITIALIZE DATABASE & CORS
db = SQLAlchemy(app)

CORS(app, supports_credentials=True, origins=[
    "http://127.0.0.1:5500", 
    "http://127.0.0.1:5501", 
    "http://localhost:5500", 
    "http://localhost:5501",
    "https://github.com/abunumaan/cbtplatform.git"
])

# 3. DATABASE TABLES (The Cloud Library Folders)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(80), nullable=False)

class Question(db.Model):
    __tablename__ = 'questions'
    id = db.Column(db.Integer, primary_key=True)
    question_text = db.Column(db.String(500), nullable=False)
    option_a = db.Column(db.String(200))
    option_b = db.Column(db.String(200))
    option_c = db.Column(db.String(200))
    option_d = db.Column(db.String(200))
    correct_answer = db.Column(db.String(1))

class Result(db.Model):
    __tablename__ = 'results'
    id = db.Column(db.Integer, primary_key=True)
    student_name = db.Column(db.String(100))
    score = db.Column(db.Integer)
    total = db.Column(db.Integer)
    percentage = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# This magic line creates the tables in your cloud if they don't exist
with app.app_context():
    db.create_all()

# --- ROUTES ---

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    # Query the cloud for the user
    user = User.query.filter_by(username=username, password=password).first()

    if user:
        session['user_id'] = user.id
        session['username'] = user.username
        return jsonify({"status": "success", "message": "Login successful!"})
    else:
        return jsonify({"status": "error", "message": "Invalid username or password"}), 401

@app.route('/get-questions', methods=['GET'])
def send_questions():
    # Fetch all questions from the cloud
    db_questions = Question.query.all()
    
    questions_list = []
    for q in db_questions:
        questions_list.append({
            "id": q.id,
            "text": q.question_text,
            "options": {
                "A": q.option_a, "B": q.option_b, "C": q.option_c, "D": q.option_d
            },
            "correct": q.correct_answer
        })
    
    random.shuffle(questions_list) 
    return jsonify(questions_list)

@app.route('/submit-exam', methods=['POST'])
def receive_answers():
    if 'username' not in session:
        return jsonify({"status": "error", "message": "You must be logged in to submit."}), 403

    student_data = request.json
    score = 0
   
    # Fetch correct answers to grade
    db_questions = Question.query.all()
    correct_map = {q.id: q.correct_answer for q in db_questions}

    for student_ans in student_data:
        q_id = student_ans.get('id')
        user_choice = student_ans.get('answer')
        if q_id in correct_map and user_choice == correct_map[q_id]:
            score += 1

    total_questions = len(correct_map)
    percentage = (score / total_questions) * 100 if total_questions > 0 else 0

    try:
        # Create a new Result object and save to cloud
        new_result = Result(
            student_name=session['username'],
            score=score,
            total=total_questions,
            percentage=percentage
        )
        db.session.add(new_result)
        db.session.commit()
    except Exception as e:
        print(f"Error saving results: {e}")
        db.session.rollback()

    return jsonify({
        "status": "success",
        "score": score,
        "total": total_questions,
        "percentage": percentage,
        "message": f"Exam graded! Well done, {session['username']}."
    })

@app.route('/get-results', methods=['GET'])
def get_results():
    if 'username' not in session:
        return jsonify({"status": "error", "message": "Unauthorized"}), 403

    # Query results ordered by most recent
    results = Result.query.order_by(Result.timestamp.desc()).all()

    results_list = []
    for row in results:
        results_list.append({
            "name": row.student_name,
            "score": row.score,
            "total": row.total,
            "percentage": row.percentage,
            "date": row.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        })
    return jsonify(results_list)

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"status": "success", "message": "Logged out successfully"})

if __name__ == '__main__':

    app.run(debug=True, port=5000)
