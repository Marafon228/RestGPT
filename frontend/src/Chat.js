import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // Для дополнительных стилей (если нужно)

function App() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const newMessage = { role: 'user', content: input };
        setMessages([...messages, newMessage]);
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

    return (
        <div className="container mt-5">
            <h1 className="text-center">ChatGPT Clone</h1>
            <div className="chat-window border rounded p-3 mb-3" style={{ height: '400px', overflowY: 'scroll' }}>
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
