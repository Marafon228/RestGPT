import os
import jwt
import bcrypt
from flask import Flask, request, jsonify
from flask_cors import CORS
from g4f.client import Client
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Секретный ключ для кодирования JWT
SECRET_KEY = os.getenv('SECRET_KEY', 'f5181663af1c5545bfd01d78838719f2cce596c0b8319c15')

client = Client()


# Подключение к базе данных
DATABASE_URL = "postgresql://postgres:54312Cth@localhost:5432/AI_APP"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)


# Регистрация пользователя
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    session = Session()
    try:
        session.execute(
            "INSERT INTO users (username, password) VALUES (:username, :password)",
            {'username': username, 'password': hashed_password}
        )
        session.commit()
    except SQLAlchemyError as e:
        session.rollback()
        return jsonify({'error': 'Username already exists or database error', 'details': str(e)}), 400
    finally:
        session.close()

    return jsonify({'message': 'User registered successfully'}), 201


# Аутентификация пользователя
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    session = Session()
    user = session.execute(
        "SELECT * FROM users WHERE username = :username",
        {'username': username}
    ).fetchone()
    session.close()

    if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
        return jsonify({'error': 'Invalid username or password'}), 401

    # Генерация токена
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(hours=1)
    }, SECRET_KEY, algorithm='HS256')

    return jsonify({'token': token}), 200


# Защищенный маршрут
@app.route('/api/chat', methods=['POST'])
def chat():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Token is missing!'}), 403

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token has expired!'}), 403
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token!'}), 403

    data = request.get_json()
    message = data.get('message')

    if not message:
        return jsonify({'error': 'Message is required'}), 400

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": message}]
        )

        bot_response = response.choices[0].message.content

        session = Session()
        session.execute(
            "INSERT INTO chat_history (user_message, bot_response) VALUES (:user_message, :bot_response)",
            {'user_message': message, 'bot_response': bot_response}
        )
        session.commit()
        session.close()

        return jsonify({'response': bot_response}), 200

    except SQLAlchemyError as e:
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(port=5000)