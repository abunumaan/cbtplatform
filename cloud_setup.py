from app import app, db, User, Question

with app.app_context():
    print("Creating tables in Neon Cloud...")
    db.create_all()
    
    # Add a default student/teacher account
    username = "admin"
    password = "password123"
    
    # Check if user already exists
    exists = User.query.filter_by(username=username).first()
    if not exists:
        new_user = User(username=username, password=password)
        db.session.add(new_user)
        db.session.commit()
        print(f"✅ Success! Created user: {username}")
    else:
        print("User already exists.")

print("🚀 Cloud Database is ready for action!")
