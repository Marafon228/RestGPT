import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const chatWindowRef = useRef(null); // Ссылка на окно чата
     // Имя модели

    useEffect(() => {
        // Добавляем приветственное сообщение от бота
        const welcomeMessage = {
            role: 'Good',
            content: `Привет! Я бот, работающий на модели. Как я могу вам помочь?`
        };
        setMessages([welcomeMessage]);
    }, []);

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const newMessage = { role: 'user', content: input };
        setMessages((prev) => [...prev, newMessage]);
        setInput('');

        try {
            const response = await axios.post('http://localhost:5000/api/chat', {
                message: input,
            });
            const botMessage = {
                role: 'assistant',
                content: response.data.response,
            };
            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error('Ошибка при получении ответа:', error);
        }
    };

    // Прокрутка вниз при добавлении нового сообщения
    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="chat-container">
            <div className="chat-window" ref={chatWindowRef}>
                {messages.map((msg, index) => (
                    <div key={index} className={`mb-2 ${msg.role === 'user' ? 'text-end' : 'text-start'}`}>
                        <div className={`p-2 rounded ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-light'}`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Введите ваше сообщение"
                        value={input}
                        onChange={handleInputChange}
                    />
                    <button className="btn btn-primary" type="submit">Отправить</button>
                </div>
            </form>
        </div>
    );
}

export default App;
